/**
 * Sistema de ID Persistente Cross-Session
 * 
 * Cria um identificador único para cada visitante que persiste além dos cookies,
 * melhorando significativamente a atribuição de conversões no Meta Ads.
 * 
 * Estratégias de persistência (fallback triplo):
 * 1. localStorage - Persiste até ser limpo manualmente
 * 2. IndexedDB - Mais resistente a limpezas de cache
 * 3. Cookie de longa duração - Fallback para navegadores antigos
 * 
 * O ID é usado como external_id na Meta Conversions API para:
 * - Rastrear a jornada completa do cliente
 * - Melhorar o Event Match Quality Score
 * - Permitir atribuição cross-device (quando o usuário faz login)
 */

const STORAGE_KEY = 'fp_visitor_id';
const COOKIE_NAME = 'fp_vid';
const COOKIE_DAYS = 365 * 2; // 2 anos
const DB_NAME = 'FitPrimeTracking';
const DB_STORE = 'visitor';

// Gera um UUID v4
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Gera um fingerprint básico do navegador (anônimo, sem dados pessoais)
function generateBrowserFingerprint(): string {
  const components: string[] = [];
  
  // Screen
  if (typeof screen !== 'undefined') {
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  }
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown');
  
  // Language
  components.push(navigator.language || 'unknown');
  
  // Platform
  components.push(navigator.platform || 'unknown');
  
  // Hardware concurrency
  if (navigator.hardwareConcurrency) {
    components.push(`cores:${navigator.hardwareConcurrency}`);
  }
  
  // Device memory (se disponível)
  if ((navigator as any).deviceMemory) {
    components.push(`mem:${(navigator as any).deviceMemory}`);
  }
  
  // Touch support
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  components.push(`touch:${touchSupport}`);
  
  // Canvas fingerprint (hash simples)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('FitPrime', 2, 2);
      components.push(`canvas:${canvas.toDataURL().slice(-50)}`);
    }
  } catch (e) {
    // Ignorar erros de canvas
  }
  
  // WebGL renderer (se disponível)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        components.push(`gl:${renderer?.slice(0, 30) || 'unknown'}`);
      }
    }
  } catch (e) {
    // Ignorar erros de WebGL
  }
  
  // Gera hash do fingerprint
  const fingerprintString = components.join('|');
  return hashString(fingerprintString);
}

// Hash simples para o fingerprint
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Salva em cookie
function setCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Lê do cookie
function getCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

// Salva no IndexedDB
async function saveToIndexedDB(value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => resolve(); // Não falhar se IndexedDB não estiver disponível
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([DB_STORE], 'readwrite');
        const store = transaction.objectStore(DB_STORE);
        store.put({ id: 'visitor_id', value, updatedAt: Date.now() });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          resolve();
        };
      };
    } catch (e) {
      resolve(); // Não falhar
    }
  });
}

// Lê do IndexedDB
async function getFromIndexedDB(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => resolve(null);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([DB_STORE], 'readonly');
        const store = transaction.objectStore(DB_STORE);
        const getRequest = store.get('visitor_id');
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result?.value || null);
        };
        
        getRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      };
    } catch (e) {
      resolve(null);
    }
  });
}

// Estrutura do ID persistente
export interface PersistentVisitorId {
  id: string;           // UUID único do visitante
  fingerprint: string;  // Fingerprint do navegador
  firstSeen: number;    // Timestamp da primeira visita
  lastSeen: number;     // Timestamp da última visita
  sessionCount: number; // Número de sessões
  source?: string;      // Fonte de aquisição (utm_source)
  medium?: string;      // Meio de aquisição (utm_medium)
  campaign?: string;    // Campanha (utm_campaign)
  fbclid?: string;      // Facebook Click ID
  gclid?: string;       // Google Click ID
  ttclid?: string;      // TikTok Click ID
}

// Obtém ou cria o ID persistente
export async function getPersistentVisitorId(): Promise<PersistentVisitorId> {
  // Tenta recuperar de todas as fontes
  let storedData: PersistentVisitorId | null = null;
  
  // 1. Tenta localStorage
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      storedData = JSON.parse(localData);
    }
  } catch (e) {
    // Ignorar erros
  }
  
  // 2. Tenta IndexedDB se localStorage falhou
  if (!storedData) {
    try {
      const idbData = await getFromIndexedDB();
      if (idbData) {
        storedData = JSON.parse(idbData);
      }
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // 3. Tenta cookie se os outros falharam
  if (!storedData) {
    try {
      const cookieData = getCookie();
      if (cookieData) {
        storedData = JSON.parse(decodeURIComponent(cookieData));
      }
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // Captura parâmetros de tracking da URL
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParams = {
    source: urlParams.get('utm_source') || undefined,
    medium: urlParams.get('utm_medium') || undefined,
    campaign: urlParams.get('utm_campaign') || undefined,
    fbclid: urlParams.get('fbclid') || undefined,
    gclid: urlParams.get('gclid') || undefined,
    ttclid: urlParams.get('ttclid') || undefined,
  };
  
  const now = Date.now();
  const fingerprint = generateBrowserFingerprint();
  
  if (storedData) {
    // Atualiza dados existentes
    storedData.lastSeen = now;
    storedData.sessionCount = (storedData.sessionCount || 1) + 1;
    storedData.fingerprint = fingerprint;
    
    // Atualiza parâmetros de tracking se presentes na URL
    if (trackingParams.source) storedData.source = trackingParams.source;
    if (trackingParams.medium) storedData.medium = trackingParams.medium;
    if (trackingParams.campaign) storedData.campaign = trackingParams.campaign;
    if (trackingParams.fbclid) storedData.fbclid = trackingParams.fbclid;
    if (trackingParams.gclid) storedData.gclid = trackingParams.gclid;
    if (trackingParams.ttclid) storedData.ttclid = trackingParams.ttclid;
  } else {
    // Cria novo ID
    storedData = {
      id: generateUUID(),
      fingerprint,
      firstSeen: now,
      lastSeen: now,
      sessionCount: 1,
      ...trackingParams,
    };
  }
  
  // Salva em todas as fontes
  const dataString = JSON.stringify(storedData);
  
  try {
    localStorage.setItem(STORAGE_KEY, dataString);
  } catch (e) {
    // Ignorar erros
  }
  
  try {
    await saveToIndexedDB(dataString);
  } catch (e) {
    // Ignorar erros
  }
  
  try {
    setCookie(encodeURIComponent(dataString));
  } catch (e) {
    // Ignorar erros
  }
  
  return storedData;
}

// Obtém apenas o ID (para uso rápido)
export async function getVisitorId(): Promise<string> {
  const visitor = await getPersistentVisitorId();
  return visitor.id;
}

// Obtém o external_id formatado para o Meta (combinação de ID + fingerprint)
export async function getMetaExternalId(): Promise<string> {
  const visitor = await getPersistentVisitorId();
  return `${visitor.id}_${visitor.fingerprint}`;
}

// Obtém os parâmetros de tracking para o Meta
export async function getMetaTrackingParams(): Promise<{
  external_id: string;
  fbc?: string;
  fbp?: string;
  client_user_agent: string;
}> {
  const visitor = await getPersistentVisitorId();
  
  // Gera fbc se tiver fbclid
  let fbc: string | undefined;
  if (visitor.fbclid) {
    fbc = `fb.1.${visitor.firstSeen}.${visitor.fbclid}`;
  } else {
    // Tenta pegar do cookie _fbc
    const fbcCookie = document.cookie.match(/(^| )_fbc=([^;]+)/);
    if (fbcCookie) {
      fbc = fbcCookie[2];
    }
  }
  
  // Pega fbp do cookie _fbp
  let fbp: string | undefined;
  const fbpCookie = document.cookie.match(/(^| )_fbp=([^;]+)/);
  if (fbpCookie) {
    fbp = fbpCookie[2];
  } else {
    // Gera um fbp se não existir
    fbp = `fb.1.${visitor.firstSeen}.${Math.random().toString(36).substring(2, 15)}`;
  }
  
  return {
    external_id: `${visitor.id}_${visitor.fingerprint}`,
    fbc,
    fbp,
    client_user_agent: navigator.userAgent,
  };
}

// Registra um evento na jornada do visitante
export async function trackJourneyEvent(eventName: string, eventData?: Record<string, any>): Promise<void> {
  const visitor = await getPersistentVisitorId();
  
  // Armazena eventos da jornada
  const journeyKey = `fp_journey_${visitor.id}`;
  let journey: Array<{ event: string; data?: Record<string, any>; timestamp: number; page: string }> = [];
  
  try {
    const stored = localStorage.getItem(journeyKey);
    if (stored) {
      journey = JSON.parse(stored);
    }
  } catch (e) {
    // Ignorar erros
  }
  
  journey.push({
    event: eventName,
    data: eventData,
    timestamp: Date.now(),
    page: window.location.pathname,
  });
  
  // Limita a 100 eventos para não estourar o localStorage
  if (journey.length > 100) {
    journey = journey.slice(-100);
  }
  
  try {
    localStorage.setItem(journeyKey, JSON.stringify(journey));
  } catch (e) {
    // Ignorar erros
  }
}

// Obtém a jornada do visitante
export async function getVisitorJourney(): Promise<Array<{ event: string; data?: Record<string, any>; timestamp: number; page: string }>> {
  const visitor = await getPersistentVisitorId();
  const journeyKey = `fp_journey_${visitor.id}`;
  
  try {
    const stored = localStorage.getItem(journeyKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignorar erros
  }
  
  return [];
}

// Inicializa o sistema de ID persistente
let initialized = false;
export async function initPersistentId(): Promise<PersistentVisitorId> {
  const visitor = await getPersistentVisitorId();
  
  if (!initialized) {
    initialized = true;
    
    // Registra PageView na jornada
    await trackJourneyEvent('PageView', {
      url: window.location.href,
      referrer: document.referrer,
    });
    
    // Log para debug (remover em produção)
    console.log('[FitPrime Tracking] Visitor ID:', visitor.id);
    console.log('[FitPrime Tracking] Session:', visitor.sessionCount);
  }
  
  return visitor;
}

// Exporta para uso global
export default {
  getPersistentVisitorId,
  getVisitorId,
  getMetaExternalId,
  getMetaTrackingParams,
  trackJourneyEvent,
  getVisitorJourney,
  initPersistentId,
};
