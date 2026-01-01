const CACHE_VERSION = 'v2';
const STATIC_CACHE = `fitprime-static-${CACHE_VERSION}`;
const API_CACHE = `fitprime-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `fitprime-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Recursos estáticos para cache imediato
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Rotas de API para cache (dados importantes para offline)
const API_CACHE_ROUTES = [
  '/api/trpc/auth.me',
  '/api/trpc/personal.getProfile',
  '/api/trpc/personal.getStudents',
  '/api/trpc/personal.getWorkouts',
  '/api/trpc/personal.getSessions',
  '/api/trpc/personal.getPlans',
  '/api/trpc/studentPortal.profile',
  '/api/trpc/studentPortal.workouts',
  '/api/trpc/studentPortal.sessions',
  '/api/trpc/studentPortal.measurements',
  '/api/trpc/studentPortal.charges',
];

// Tempo de expiração do cache de API (em ms)
const API_CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hora

// Install - Cache recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('fitprime-') &&
              name !== STATIC_CACHE &&
              name !== API_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch - Estratégias de cache por tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições de extensões do Chrome
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Estratégia para API tRPC
  if (url.pathname.startsWith('/api/trpc')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Estratégia para imagens
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Estratégia para recursos estáticos (JS, CSS, HTML)
  event.respondWith(handleStaticRequest(request));
});

// Estratégia: Network First com fallback para cache (API)
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Verificar se é uma rota que deve ser cacheada
  const shouldCache = API_CACHE_ROUTES.some((route) =>
    url.pathname.includes(route.replace('/api/trpc/', ''))
  );
  
  try {
    const networkResponse = await fetch(request);
    
    // Se sucesso e deve cachear, salvar no cache
    if (networkResponse.ok && shouldCache) {
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();
      
      // Adicionar timestamp ao cache
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cache-timestamp', Date.now().toString());
      
      const responseWithTimestamp = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', request.url);
    
    // Tentar cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Verificar se o cache não expirou
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      if (cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp, 10);
        if (age < API_CACHE_MAX_AGE) {
          console.log('[SW] Returning cached API response');
          return cachedResponse;
        }
      } else {
        // Se não tem timestamp, retornar mesmo assim (melhor que nada)
        return cachedResponse;
      }
    }
    
    // Se não tem cache, retornar erro offline
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Você está offline e não há dados em cache.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Estratégia: Cache First com fallback para network (Imagens)
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Retornar placeholder para imagens
    return new Response('', { status: 404 });
  }
}

// Estratégia: Stale While Revalidate (Recursos estáticos)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(STATIC_CACHE);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(async () => {
      // Se falhar e for navegação, mostrar página offline
      if (request.mode === 'navigate') {
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
          return offlineResponse;
        }
      }
      return new Response('Offline', { status: 503 });
    });
  
  // Retornar cache imediatamente se disponível, senão aguardar network
  return cachedResponse || fetchPromise;
}

// Background Sync - Sincronizar dados offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  console.log('[SW] Syncing offline data...');
  
  // Notificar clientes que a sincronização está acontecendo
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_STARTED',
    });
  });
  
  // A sincronização real é feita pelo cliente
  // O SW apenas notifica que está online novamente
  
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETED',
    });
  });
}

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'fitprime-notification',
    renotify: true,
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'FitPrime', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Verificar se já tem uma janela aberta
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Se não tem janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.source.postMessage({
          type: 'CACHE_SIZE',
          size: size,
        });
      })
    );
  }
});

// Calcular tamanho do cache
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service Worker loaded');
