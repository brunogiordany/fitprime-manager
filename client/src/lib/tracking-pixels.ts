/**
 * Tracking Pixels Integration
 * Integração com Google Analytics 4, Facebook Pixel e TikTok Ads
 */

// Tipos para os eventos
interface TrackingEvent {
  name: string;
  params?: Record<string, any>;
}

// Configuração dos pixels (será carregada do localStorage ou env)
interface PixelConfig {
  ga4Id?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
}

// Obter configuração dos pixels
function getPixelConfig(): PixelConfig {
  try {
    const stored = localStorage.getItem('tracking_pixels_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Erro ao carregar configuração de pixels:', e);
  }
  return {};
}

// Salvar configuração dos pixels
export function savePixelConfig(config: PixelConfig): void {
  try {
    localStorage.setItem('tracking_pixels_config', JSON.stringify(config));
    // Reinicializar pixels após salvar
    initializePixels();
  } catch (e) {
    console.warn('Erro ao salvar configuração de pixels:', e);
  }
}

// Verificar se estamos no browser
const isBrowser = typeof window !== 'undefined';

// ==================== GOOGLE ANALYTICS 4 ====================

// Inicializar GA4
function initGA4(measurementId: string): void {
  if (!isBrowser || !measurementId) return;
  
  // Verificar se já foi inicializado
  if ((window as any).gtag) return;
  
  // Adicionar script do GA4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  
  // Configurar gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: true
  });
  
  console.log('[GA4] Inicializado com ID:', measurementId);
}

// Enviar evento para GA4
function trackGA4Event(event: TrackingEvent): void {
  if (!isBrowser || !(window as any).gtag) return;
  
  (window as any).gtag('event', event.name, event.params);
  console.log('[GA4] Evento:', event.name, event.params);
}

// ==================== FACEBOOK PIXEL ====================

// Inicializar Facebook Pixel
function initFacebookPixel(pixelId: string): void {
  if (!isBrowser || !pixelId) return;
  
  // Verificar se já foi inicializado
  if ((window as any).fbq) return;
  
  // Código do Facebook Pixel
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  
  (window as any).fbq('init', pixelId);
  (window as any).fbq('track', 'PageView');
  
  console.log('[Facebook Pixel] Inicializado com ID:', pixelId);
}

// Enviar evento para Facebook Pixel
function trackFacebookEvent(event: TrackingEvent): void {
  if (!isBrowser || !(window as any).fbq) return;
  
  // Mapear eventos para o padrão do Facebook
  const fbEventMap: Record<string, string> = {
    'page_view': 'PageView',
    'quiz_started': 'InitiateCheckout',
    'quiz_completed': 'CompleteRegistration',
    'trial_created': 'Lead',
    'checkout_started': 'AddToCart',
    'checkout_completed': 'Purchase',
    'plan_selected': 'AddToWishlist',
    'exit_intent_shown': 'ViewContent',
    'exit_intent_converted': 'Lead',
  };
  
  const fbEventName = fbEventMap[event.name] || event.name;
  
  if (fbEventMap[event.name]) {
    (window as any).fbq('track', fbEventName, event.params);
  } else {
    (window as any).fbq('trackCustom', event.name, event.params);
  }
  
  console.log('[Facebook Pixel] Evento:', fbEventName, event.params);
}

// ==================== TIKTOK PIXEL ====================

// Inicializar TikTok Pixel
function initTikTokPixel(pixelId: string): void {
  if (!isBrowser || !pixelId) return;
  
  // Verificar se já foi inicializado
  if ((window as any).ttq) return;
  
  // Código do TikTok Pixel
  (function(w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    var ttq = w[t] = w[t] || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function(t: any, e: any) {
      t[e] = function() {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function(t: any) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n]);
      }
      return e;
    };
    ttq.load = function(e: any, n: any) {
      var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = i;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var o = document.createElement("script");
      o.type = "text/javascript";
      o.async = true;
      o.src = i + "?sdkid=" + e + "&lib=" + t;
      var a = document.getElementsByTagName("script")[0];
      a.parentNode!.insertBefore(o, a);
    };
    ttq.load(pixelId);
    ttq.page();
  })(window, document, 'ttq');
  
  console.log('[TikTok Pixel] Inicializado com ID:', pixelId);
}

// Enviar evento para TikTok Pixel
function trackTikTokEvent(event: TrackingEvent): void {
  if (!isBrowser || !(window as any).ttq) return;
  
  // Mapear eventos para o padrão do TikTok
  const ttEventMap: Record<string, string> = {
    'page_view': 'ViewContent',
    'quiz_started': 'InitiateCheckout',
    'quiz_completed': 'CompleteRegistration',
    'trial_created': 'SubmitForm',
    'checkout_started': 'AddToCart',
    'checkout_completed': 'CompletePayment',
    'plan_selected': 'AddToWishlist',
    'exit_intent_shown': 'ViewContent',
    'exit_intent_converted': 'SubmitForm',
  };
  
  const ttEventName = ttEventMap[event.name] || event.name;
  
  (window as any).ttq.track(ttEventName, event.params);
  
  console.log('[TikTok Pixel] Evento:', ttEventName, event.params);
}

// ==================== FUNÇÕES PÚBLICAS ====================

// Inicializar todos os pixels configurados
export function initializePixels(): void {
  const config = getPixelConfig();
  
  if (config.ga4Id) {
    initGA4(config.ga4Id);
  }
  
  if (config.facebookPixelId) {
    initFacebookPixel(config.facebookPixelId);
  }
  
  if (config.tiktokPixelId) {
    initTikTokPixel(config.tiktokPixelId);
  }
}

// Enviar evento para todos os pixels
export function trackPixelEvent(eventName: string, params?: Record<string, any>): void {
  const event: TrackingEvent = { name: eventName, params };
  
  trackGA4Event(event);
  trackFacebookEvent(event);
  trackTikTokEvent(event);
}

// Eventos específicos do funil
export const pixelEvents = {
  pageView: (page: string) => trackPixelEvent('page_view', { page }),
  quizStarted: () => trackPixelEvent('quiz_started'),
  quizCompleted: (score: number) => trackPixelEvent('quiz_completed', { score }),
  trialCreated: (email: string) => trackPixelEvent('trial_created', { email }),
  checkoutStarted: (planId: string, value: number) => trackPixelEvent('checkout_started', { planId, value, currency: 'BRL' }),
  checkoutCompleted: (planId: string, value: number) => trackPixelEvent('checkout_completed', { planId, value, currency: 'BRL' }),
  planSelected: (planId: string, planName: string) => trackPixelEvent('plan_selected', { planId, planName }),
  exitIntentShown: (page: string) => trackPixelEvent('exit_intent_shown', { page }),
  exitIntentConverted: (page: string) => trackPixelEvent('exit_intent_converted', { page }),
};

// Inicializar automaticamente ao carregar
if (isBrowser) {
  // Aguardar DOM estar pronto
  if (document.readyState === 'complete') {
    initializePixels();
  } else {
    window.addEventListener('load', initializePixels);
  }
}
