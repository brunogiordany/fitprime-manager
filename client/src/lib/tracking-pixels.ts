/**
 * Tracking Pixels Integration - Meta Ads Completo
 * Integração com Google Analytics 4, Facebook Pixel + Conversions API, TikTok Ads
 * 
 * Seguindo as melhores práticas da documentação oficial do Meta:
 * - Pixel (frontend) + Conversions API (backend) para redundância
 * - Deduplicação via event_id
 * - Captura de fbc, fbp, fbclid para matching avançado
 * - Parâmetros de usuário para melhor Event Match Quality
 * - IDs persistentes cross-session para rastreamento avançado
 */

import { getMetaTrackingParams, initPersistentId, trackJourneyEvent, getVisitorId } from './persistent-id';

// Tipos para os eventos
interface TrackingEvent {
  name: string;
  params?: Record<string, any>;
  eventId?: string; // Para deduplicação
  userData?: UserData;
}

// Dados do usuário para matching (Meta Conversions API)
interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
}

// Configuração dos pixels (será carregada do localStorage ou env)
interface PixelConfig {
  ga4Id?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
  // Configurações avançadas para Conversions API
  facebookApiToken?: string;
  tiktokApiToken?: string;
  ga4ApiSecret?: string;
  serverSideEnabled?: boolean;
}

// Gerar event_id único para deduplicação
function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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

// ==================== META TRACKING HELPERS ====================

// Obter fbclid da URL (Facebook Click ID)
function getFbclid(): string | null {
  if (!isBrowser) return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('fbclid');
}

// Obter ou criar fbc (Facebook Click Cookie)
function getFbc(): string | null {
  if (!isBrowser) return null;
  
  // Tentar obter do cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbc') {
      return value;
    }
  }
  
  // Se não existe mas temos fbclid, criar
  const fbclid = getFbclid();
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    // Salvar no cookie por 90 dias
    document.cookie = `_fbc=${fbc}; max-age=${90 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    return fbc;
  }
  
  return null;
}

// Obter ou criar fbp (Facebook Browser ID)
function getFbp(): string {
  if (!isBrowser) return '';
  
  // Tentar obter do cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      return value;
    }
  }
  
  // Criar novo fbp
  const fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
  // Salvar no cookie por 90 dias
  document.cookie = `_fbp=${fbp}; max-age=${90 * 24 * 60 * 60}; path=/; SameSite=Lax`;
  return fbp;
}

// Salvar fbclid quando presente na URL
function captureFbclid(): void {
  if (!isBrowser) return;
  
  const fbclid = getFbclid();
  if (fbclid) {
    // Salvar no localStorage para uso posterior
    localStorage.setItem('meta_fbclid', fbclid);
    localStorage.setItem('meta_fbclid_time', Date.now().toString());
    
    // Garantir que fbc seja criado
    getFbc();
  }
}

// Obter dados de tracking do Meta
export function getMetaTrackingData(): { fbc: string | null; fbp: string; fbclid: string | null } {
  return {
    fbc: getFbc(),
    fbp: getFbp(),
    fbclid: getFbclid() || localStorage.getItem('meta_fbclid'),
  };
}

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
  
  (window as any).gtag('event', event.name, {
    ...event.params,
    event_id: event.eventId, // Para deduplicação com Measurement Protocol
  });
  console.log('[GA4] Evento:', event.name, event.params);
}

// ==================== FACEBOOK PIXEL + CONVERSIONS API ====================

// Inicializar Facebook Pixel com parâmetros avançados
// NOTA: O código base do Pixel já está no index.html
// Esta função apenas configura o tracking avançado e Conversions API
function initFacebookPixel(pixelId: string): void {
  if (!isBrowser || !pixelId) return;
  
  // Capturar fbclid se presente
  captureFbclid();
  
  console.log('[Facebook Pixel] Configurando tracking avançado...');
  
  // O Pixel já foi inicializado no index.html com fbq('init') e fbq('track', 'PageView')
  // Aqui apenas configuramos o tracking avançado e enviamos via Conversions API
  
  // Setup avançado assíncrono
  const setupAdvanced = async () => {
    // Aguardar o fbq estar disponível (carregado pelo index.html)
    let retries = 0;
    while (!(window as any).fbq && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (!(window as any).fbq) {
      console.warn('[Facebook Pixel] fbq não encontrado após 5s');
      return;
    }
    
    try {
      const metaData = getMetaTrackingData();
      const persistentParams = await getMetaTrackingParams();
      
      // Enviar PageView via Conversions API como redundância
      // O PageView do browser já foi enviado pelo index.html
      const pageViewEventId = generateEventId();
      sendServerSideEvent('PageView', {}, pageViewEventId);
      
      console.log('[Facebook Pixel] Tracking avançado configurado');
      console.log('[Facebook Pixel] Meta tracking:', metaData);
      console.log('[Facebook Pixel] External ID:', persistentParams.external_id);
    } catch (e) {
      console.warn('[Facebook Pixel] Erro setup:', e);
    }
  };
  
  setupAdvanced().catch(err => console.error('[Facebook Pixel] Erro:', err));
}

// Enviar evento para Facebook Pixel com deduplicação
function trackFacebookEvent(event: TrackingEvent): void {
  if (!isBrowser || !(window as any).fbq) return;
  
  const eventId = event.eventId || generateEventId();
  
  // Mapear eventos para o padrão do Facebook (eventos padrão do Meta)
  // Referência: https://developers.facebook.com/docs/meta-pixel/reference
  const fbEventMap: Record<string, string> = {
    // Eventos padrão do Meta
    'page_view': 'PageView',
    'view_content': 'ViewContent',
    'lead': 'Lead',
    'complete_registration': 'CompleteRegistration',
    'add_to_cart': 'AddToCart',
    'initiate_checkout': 'InitiateCheckout',
    'add_payment_info': 'AddPaymentInfo',
    'purchase': 'Purchase',
    'subscribe': 'Subscribe',
    'start_trial': 'StartTrial',
    'contact': 'Contact',
    'search': 'Search',
    'find_location': 'FindLocation',
    'schedule': 'Schedule',
    'submit_application': 'SubmitApplication',
    'customize_product': 'CustomizeProduct',
    'donate': 'Donate',
    // Eventos legados/personalizados mapeados para eventos padrão
    'quiz_started': 'ViewContent',
    'quiz_completed': 'Lead',
    'trial_created': 'CompleteRegistration',
    'checkout_started': 'InitiateCheckout',
    'checkout_completed': 'Purchase',
    'plan_selected': 'AddToCart',
    'exit_intent_shown': 'ViewContent',
    'exit_intent_converted': 'Lead',
    'form_submitted': 'Lead',
    'subscription_started': 'Subscribe',
  };
  
  const fbEventName = fbEventMap[event.name] || event.name;
  const isStandardEvent = !!fbEventMap[event.name];
  
  // Adicionar parâmetros de valor se disponíveis
  const params = {
    ...event.params,
    content_name: event.params?.content_name || event.name,
  };
  
  // Enviar via Pixel (frontend)
  if (isStandardEvent) {
    (window as any).fbq('track', fbEventName, params, { eventID: eventId });
  } else {
    (window as any).fbq('trackCustom', event.name, params, { eventID: eventId });
  }
  
  // Enviar via Conversions API (backend) para deduplicação
  sendServerSideEvent(fbEventName, params, eventId, event.userData);
  
  console.log('[Facebook Pixel] Evento:', fbEventName, 'ID:', eventId, params);
}

// Enviar evento via Conversions API (Server-Side)
async function sendServerSideEvent(
  eventName: string, 
  params: Record<string, any>, 
  eventId: string,
  userData?: UserData
): Promise<void> {
  const config = getPixelConfig();
  
  // Verificar se server-side está habilitado
  if (!config.serverSideEnabled || !config.facebookApiToken || !config.facebookPixelId) {
    return;
  }
  
  try {
    const metaData = getMetaTrackingData();
    
    // Preparar dados do evento para a API
    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: window.location.href,
      action_source: 'website',
      user_data: {
        client_ip_address: '', // Será preenchido pelo servidor
        client_user_agent: navigator.userAgent,
        fbc: metaData.fbc || undefined,
        fbp: metaData.fbp || undefined,
        // Dados do usuário se disponíveis
        em: userData?.email ? await hashSHA256(userData.email.toLowerCase().trim()) : undefined,
        ph: userData?.phone ? await hashSHA256(userData.phone.replace(/\D/g, '')) : undefined,
        fn: userData?.firstName ? await hashSHA256(userData.firstName.toLowerCase().trim()) : undefined,
        ln: userData?.lastName ? await hashSHA256(userData.lastName.toLowerCase().trim()) : undefined,
        ct: userData?.city ? await hashSHA256(userData.city.toLowerCase().trim()) : undefined,
        external_id: userData?.externalId || await getVisitorId() || localStorage.getItem('fitprime_user_id') || undefined,
      },
      custom_data: {
        ...params,
        currency: params.currency || 'BRL',
      },
    };
    
    // Enviar para o backend que fará a chamada à API do Meta
    // Usando fetch direto para o endpoint tRPC
    const response = await fetch('/api/trpc/tracking.sendMetaEvent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json: eventData }),
    });
    
    if (response.ok) {
      console.log('[Meta CAPI] Evento enviado:', eventName, eventId);
    } else {
      console.warn('[Meta CAPI] Erro ao enviar evento:', await response.text());
    }
  } catch (error) {
    console.warn('[Meta CAPI] Erro:', error);
  }
}

// Hash SHA256 para dados do usuário (requisito do Meta)
async function hashSHA256(value: string): Promise<string> {
  if (!value) return '';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  
  (window as any).ttq.track(ttEventName, {
    ...event.params,
    event_id: event.eventId,
  });
  
  console.log('[TikTok Pixel] Evento:', ttEventName, event.params);
}

// ==================== FUNÇÕES PÚBLICAS ====================

// Inicializar todos os pixels configurados
export function initializePixels(): void {
  const config = getPixelConfig();
  
  // Capturar fbclid se presente na URL
  captureFbclid();
  
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

// Enviar evento para todos os pixels com deduplicação
export function trackPixelEvent(
  eventName: string, 
  params?: Record<string, any>,
  userData?: UserData
): void {
  const eventId = generateEventId();
  const event: TrackingEvent = { 
    name: eventName, 
    params, 
    eventId,
    userData,
  };
  
  trackGA4Event(event);
  trackFacebookEvent(event);
  trackTikTokEvent(event);
}

// Eventos específicos do funil com dados de usuário para melhor matching
// Seguindo a documentação oficial do Meta: https://developers.facebook.com/docs/meta-pixel/reference
export const pixelEvents = {
  // ==================== EVENTOS PADRÃO DO META ====================
  
  // PageView - Disparado automaticamente ao carregar qualquer página
  pageView: (page: string) => trackPixelEvent('page_view', { 
    page, 
    content_name: page,
    content_category: 'page',
  }),
  
  // ViewContent - Quando visualiza uma página de produto/plano específico
  viewContent: (params: {
    contentId: string;
    contentName: string;
    contentType?: string;
    contentCategory?: string;
    value?: number;
    currency?: string;
  }) => trackPixelEvent('view_content', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: params.contentType || 'product',
    content_category: params.contentCategory || 'plan',
    value: params.value,
    currency: params.currency || 'BRL',
  }),
  
  // Lead - Quando um usuário demonstra interesse (completa quiz, formulário)
  lead: (userData: UserData, params?: {
    contentName?: string;
    contentCategory?: string;
    value?: number;
  }) => trackPixelEvent('lead', {
    content_name: params?.contentName || 'Lead Capture',
    content_category: params?.contentCategory || 'lead',
    value: params?.value || 0,
    currency: 'BRL',
  }, userData),
  
  // CompleteRegistration - Quando cria conta (trial ou paga)
  completeRegistration: (userData: UserData, params?: {
    contentName?: string;
    status?: string;
    value?: number;
  }) => trackPixelEvent('complete_registration', {
    content_name: params?.contentName || 'Registration',
    status: params?.status || 'completed',
    value: params?.value || 0,
    currency: 'BRL',
  }, userData),
  
  // AddToCart - Quando seleciona um plano
  addToCart: (params: {
    contentId: string;
    contentName: string;
    contentType?: string;
    value: number;
    currency?: string;
    numItems?: number;
  }) => trackPixelEvent('add_to_cart', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.numItems || 1,
  }),
  
  // InitiateCheckout - Quando inicia o processo de checkout
  initiateCheckout: (params: {
    contentIds: string[];
    contentName?: string;
    contentType?: string;
    value: number;
    currency?: string;
    numItems?: number;
  }, userData?: UserData) => trackPixelEvent('initiate_checkout', {
    content_ids: params.contentIds,
    content_name: params.contentName || 'Checkout',
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.numItems || 1,
  }, userData),
  
  // AddPaymentInfo - Quando adiciona informações de pagamento
  addPaymentInfo: (params: {
    contentIds?: string[];
    contentCategory?: string;
    value?: number;
    currency?: string;
  }, userData?: UserData) => trackPixelEvent('add_payment_info', {
    content_ids: params.contentIds,
    content_category: params.contentCategory || 'payment',
    value: params.value,
    currency: params.currency || 'BRL',
  }, userData),
  
  // Purchase - Quando completa uma compra
  purchase: (params: {
    contentIds: string[];
    contentName: string;
    contentType?: string;
    value: number;
    currency?: string;
    numItems?: number;
    transactionId?: string;
  }, userData?: UserData) => trackPixelEvent('purchase', {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.numItems || 1,
    transaction_id: params.transactionId || generateEventId(),
  }, userData),
  
  // Subscribe - Quando ativa uma assinatura recorrente
  subscribe: (params: {
    contentId: string;
    contentName: string;
    value: number;
    currency?: string;
    predictedLtv?: number;
  }, userData?: UserData) => trackPixelEvent('subscribe', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || 'BRL',
    predicted_ltv: params.predictedLtv || params.value * 12,
  }, userData),
  
  // StartTrial - Quando inicia período de teste
  startTrial: (params: {
    contentId?: string;
    contentName?: string;
    value?: number;
    currency?: string;
    predictedLtv?: number;
  }, userData?: UserData) => trackPixelEvent('start_trial', {
    content_ids: params.contentId ? [params.contentId] : undefined,
    content_name: params.contentName || 'Trial',
    value: params.value || 0,
    currency: params.currency || 'BRL',
    predicted_ltv: params.predictedLtv,
  }, userData),
  
  // Contact - Quando clica em WhatsApp/contato
  contact: (params?: {
    contentName?: string;
    contentCategory?: string;
  }) => trackPixelEvent('contact', {
    content_name: params?.contentName || 'Contact',
    content_category: params?.contentCategory || 'contact',
  }),
  
  // Search - Quando usa busca no site
  search: (params: {
    searchString: string;
    contentCategory?: string;
  }) => trackPixelEvent('search', {
    search_string: params.searchString,
    content_category: params.contentCategory || 'search',
  }),
  
  // FindLocation - Quando busca localização (se aplicável)
  findLocation: (params?: {
    contentCategory?: string;
  }) => trackPixelEvent('find_location', {
    content_category: params?.contentCategory || 'location',
  }),
  
  // Schedule - Quando agenda algo
  schedule: (params?: {
    contentName?: string;
    contentCategory?: string;
  }, userData?: UserData) => trackPixelEvent('schedule', {
    content_name: params?.contentName || 'Schedule',
    content_category: params?.contentCategory || 'schedule',
  }, userData),
  
  // SubmitApplication - Quando envia formulário de interesse
  submitApplication: (userData: UserData, params?: {
    contentName?: string;
    contentCategory?: string;
  }) => trackPixelEvent('submit_application', {
    content_name: params?.contentName || 'Application',
    content_category: params?.contentCategory || 'application',
  }, userData),
  
  // CustomizeProduct - Quando personaliza um produto/plano
  customizeProduct: (params: {
    contentId: string;
    contentName: string;
    contentType?: string;
  }) => trackPixelEvent('customize_product', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: params.contentType || 'product',
  }),
  
  // Donate - Se houver doação
  donate: (params: {
    value: number;
    currency?: string;
  }, userData?: UserData) => trackPixelEvent('donate', {
    value: params.value,
    currency: params.currency || 'BRL',
  }, userData),
  
  // ==================== EVENTOS PERSONALIZADOS DO FITPRIME ====================
  
  // Quiz Started - Quando inicia o quiz
  quizStarted: (userData?: UserData) => trackPixelEvent('quiz_started', { 
    content_category: 'quiz',
    content_name: 'Qualification Quiz',
  }, userData),
  
  // Quiz Completed - Quando completa o quiz
  quizCompleted: (score: number, userData?: UserData) => trackPixelEvent('quiz_completed', { 
    score,
    content_category: 'quiz',
    content_name: 'Quiz Completed',
  }, userData),
  
  // Lead Captured - Quando captura dados do lead
  leadCaptured: (userData: UserData) => trackPixelEvent('form_submitted', {
    content_category: 'lead',
    content_name: 'Lead Form',
  }, userData),
  
  // Trial Created - Quando cria conta trial (legacy, use startTrial)
  trialCreated: (email: string, userData?: UserData) => trackPixelEvent('trial_created', { 
    email,
    content_category: 'trial',
    content_name: 'Trial Registration',
  }, { ...userData, email }),
  
  // Checkout Started - Quando inicia checkout (legacy, use initiateCheckout)
  checkoutStarted: (planId: string, value: number, userData?: UserData) => trackPixelEvent('checkout_started', { 
    planId, 
    value, 
    currency: 'BRL',
    content_type: 'product',
    content_ids: [planId],
    content_name: planId,
  }, userData),
  
  // Checkout Completed - Quando completa checkout (legacy, use purchase)
  checkoutCompleted: (planId: string, value: number, userData?: UserData) => trackPixelEvent('checkout_completed', { 
    planId, 
    value, 
    currency: 'BRL',
    content_type: 'product',
    content_ids: [planId],
    content_name: planId,
    transaction_id: generateEventId(),
  }, userData),
  
  // Plan Selected - Quando seleciona um plano (legacy, use addToCart)
  planSelected: (planId: string, planName: string, value?: number) => trackPixelEvent('plan_selected', { 
    planId, 
    planName,
    value,
    currency: 'BRL',
    content_type: 'product',
    content_ids: [planId],
  }),
  
  // Exit Intent Shown - Quando mostra popup de saída
  exitIntentShown: (page: string) => trackPixelEvent('exit_intent_shown', { 
    page,
    content_category: 'exit_intent',
  }),
  
  // Exit Intent Converted - Quando converte no popup de saída
  exitIntentConverted: (page: string, userData?: UserData) => trackPixelEvent('exit_intent_converted', { 
    page,
    content_category: 'exit_intent',
  }, userData),
  
  // Subscription Started - Quando inicia assinatura (legacy, use subscribe)
  subscriptionStarted: (planId: string, value: number, userData?: UserData) => trackPixelEvent('subscription_started', {
    planId,
    value,
    currency: 'BRL',
    predicted_ltv: value * 12,
  }, userData),
  
  // WhatsApp Click - Quando clica no botão de WhatsApp
  whatsappClick: (params?: {
    page?: string;
    buttonLocation?: string;
  }) => trackPixelEvent('whatsapp_click', {
    content_category: 'contact',
    content_name: 'WhatsApp',
    page: params?.page,
    button_location: params?.buttonLocation,
  }),
  
  // Video Play - Quando inicia um vídeo
  videoPlay: (params: {
    videoId?: string;
    videoTitle?: string;
    videoDuration?: number;
  }) => trackPixelEvent('video_play', {
    content_category: 'video',
    content_name: params.videoTitle || 'Video',
    video_id: params.videoId,
    video_duration: params.videoDuration,
  }),
  
  // Video Complete - Quando completa um vídeo
  videoComplete: (params: {
    videoId?: string;
    videoTitle?: string;
    videoDuration?: number;
  }) => trackPixelEvent('video_complete', {
    content_category: 'video',
    content_name: params.videoTitle || 'Video',
    video_id: params.videoId,
    video_duration: params.videoDuration,
  }),
  
  // Scroll Depth - Quando atinge profundidade de scroll
  scrollDepth: (params: {
    percentage: number;
    page?: string;
  }) => trackPixelEvent('scroll_depth', {
    content_category: 'engagement',
    scroll_percentage: params.percentage,
    page: params.page,
  }),
  
  // Time on Page - Quando passa tempo na página
  timeOnPage: (params: {
    seconds: number;
    page?: string;
  }) => trackPixelEvent('time_on_page', {
    content_category: 'engagement',
    time_seconds: params.seconds,
    page: params.page,
  }),
  
  // ==================== EVENTOS PERSONALIZADOS FITPRIME PARA PÚBLICOS ====================
  // Use estes eventos para criar públicos customizados no Facebook Ads
  // Cada evento representa uma etapa específica do funil FitPrime
  
  // FP_LeadCapture - Quando preenche dados no /quiz-trial (captura de lead)
  // Público: Leads que demonstraram interesse inicial
  fpLeadCapture: (userData: UserData, source?: string) => trackPixelEvent('FP_LeadCapture', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'lead_capture',
    source: source || 'quiz_trial',
    value: 0,
  }, userData),
  
  // FP_QuizStarted - Quando inicia o quiz
  // Público: Leads engajados que começaram o quiz
  fpQuizStarted: (userData?: UserData) => trackPixelEvent('FP_QuizStarted', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'quiz_started',
  }, userData),
  
  // FP_QuizCompleted - Quando completa o quiz
  // Público: Leads qualificados que completaram o quiz
  fpQuizCompleted: (score: number, recommendedPlan: string, userData?: UserData) => trackPixelEvent('FP_QuizCompleted', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'quiz_completed',
    quiz_score: score,
    recommended_plan: recommendedPlan,
  }, userData),
  
  // FP_TrialPageView - Quando visualiza página de cadastro trial
  // Público: Leads interessados em trial
  fpTrialPageView: (userData?: UserData) => trackPixelEvent('FP_TrialPageView', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'trial_page_view',
    content_name: 'Trial Signup Page',
  }, userData),
  
  // FP_TrialCreated - Quando cria conta trial
  // Público: Usuários em trial (alta intenção de compra)
  fpTrialCreated: (userData: UserData) => trackPixelEvent('FP_TrialCreated', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'trial_created',
    content_name: 'Trial Account Created',
    value: 0,
    predicted_ltv: 97 * 12, // LTV estimado se converter
  }, userData),
  
  // FP_TrialExpiring - Quando trial está para expirar (2 dias)
  // Público: Usuários em trial prestes a expirar (urgência)
  fpTrialExpiring: (daysRemaining: number, userData?: UserData) => trackPixelEvent('FP_TrialExpiring', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'trial_expiring',
    days_remaining: daysRemaining,
  }, userData),
  
  // FP_TrialExpired - Quando trial expirou
  // Público: Usuários com trial expirado (reativação)
  fpTrialExpired: (userData?: UserData) => trackPixelEvent('FP_TrialExpired', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'trial_expired',
  }, userData),
  
  // FP_PricingView - Quando visualiza página de preços
  // Público: Leads avaliando preços (alta intenção)
  fpPricingView: (source?: string, userData?: UserData) => trackPixelEvent('FP_PricingView', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'pricing_view',
    source: source || 'direct',
  }, userData),
  
  // FP_PlanSelected - Quando seleciona um plano
  // Público: Leads que selecionaram plano (muito alta intenção)
  fpPlanSelected: (planId: string, planName: string, value: number, userData?: UserData) => trackPixelEvent('FP_PlanSelected', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'plan_selected',
    content_ids: [planId],
    content_name: planName,
    value: value,
    currency: 'BRL',
  }, userData),
  
  // FP_CheckoutStarted - Quando inicia checkout
  // Público: Leads no checkout (abandonadores de carrinho)
  fpCheckoutStarted: (planId: string, planName: string, value: number, userData?: UserData) => trackPixelEvent('FP_CheckoutStarted', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'checkout_started',
    content_ids: [planId],
    content_name: planName,
    value: value,
    currency: 'BRL',
  }, userData),
  
  // FP_PaymentStarted - Quando adiciona info de pagamento
  // Público: Leads que iniciaram pagamento
  fpPaymentStarted: (planId: string, value: number, userData?: UserData) => trackPixelEvent('FP_PaymentStarted', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'payment_started',
    content_ids: [planId],
    value: value,
    currency: 'BRL',
  }, userData),
  
  // FP_Purchase - Quando finaliza compra
  // Público: Clientes (lookalike de compradores)
  fpPurchase: (planId: string, planName: string, value: number, transactionId: string, userData?: UserData) => trackPixelEvent('FP_Purchase', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'purchase',
    content_ids: [planId],
    content_name: planName,
    value: value,
    currency: 'BRL',
    transaction_id: transactionId,
  }, userData),
  
  // FP_Subscription - Quando ativa assinatura recorrente
  // Público: Assinantes ativos (lookalike de assinantes)
  fpSubscription: (planId: string, planName: string, value: number, userData?: UserData) => trackPixelEvent('FP_Subscription', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'subscription',
    content_ids: [planId],
    content_name: planName,
    value: value,
    currency: 'BRL',
    predicted_ltv: value * 12,
  }, userData),
  
  // FP_Churned - Quando cancela assinatura
  // Público: Ex-clientes (reativação)
  fpChurned: (planId: string, reason?: string, userData?: UserData) => trackPixelEvent('FP_Churned', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'churned',
    content_ids: [planId],
    churn_reason: reason,
  }, userData),
  
  // FP_Reactivated - Quando reativa assinatura
  // Público: Clientes reativados
  fpReactivated: (planId: string, planName: string, value: number, userData?: UserData) => trackPixelEvent('FP_Reactivated', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'reactivated',
    content_ids: [planId],
    content_name: planName,
    value: value,
    currency: 'BRL',
  }, userData),
  
  // FP_Upgraded - Quando faz upgrade de plano
  // Público: Clientes que fizeram upgrade
  fpUpgraded: (fromPlan: string, toPlan: string, newValue: number, userData?: UserData) => trackPixelEvent('FP_Upgraded', {
    content_category: 'fitprime_funnel',
    funnel_stage: 'upgraded',
    from_plan: fromPlan,
    to_plan: toPlan,
    value: newValue,
    currency: 'BRL',
  }, userData),
};

// Identificar usuário para matching avançado
export function identifyUser(userData: UserData): void {
  if (!isBrowser) return;
  
  // Salvar ID do usuário para uso em eventos futuros
  if (userData.externalId) {
    localStorage.setItem('fitprime_user_id', userData.externalId);
  }
  
  // Identificar no Facebook Pixel
  if ((window as any).fbq && userData.email) {
    hashSHA256(userData.email.toLowerCase().trim()).then(hashedEmail => {
      (window as any).fbq('init', getPixelConfig().facebookPixelId, {
        em: hashedEmail,
        external_id: userData.externalId,
      });
    });
  }
  
  // Identificar no TikTok
  if ((window as any).ttq && userData.email) {
    (window as any).ttq.identify({
      email: userData.email,
      phone_number: userData.phone,
    });
  }
  
  console.log('[Tracking] Usuário identificado:', userData.externalId || userData.email);
}

// Inicializar automaticamente ao carregar
if (isBrowser) {
  // Aguardar DOM estar pronto
  const initAll = async () => {
    // Inicializar ID persistente primeiro
    await initPersistentId();
    // Depois inicializar pixels
    initializePixels();
  };
  
  if (document.readyState === 'complete') {
    initAll();
  } else {
    window.addEventListener('load', initAll);
  }
}

// Exportar funções do ID persistente para uso externo
export { getVisitorId, trackJourneyEvent, getMetaTrackingParams } from './persistent-id';
