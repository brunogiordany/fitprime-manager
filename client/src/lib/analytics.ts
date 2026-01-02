// Analytics e Tracking de Conversão para o Funil FitPrime

// Tipos de eventos do funil
export type FunnelEvent = 
  | 'page_view'
  | 'quiz_started'
  | 'quiz_step_completed'
  | 'quiz_completed'
  | 'quiz_abandoned'
  | 'pricing_viewed'
  | 'plan_selected'
  | 'trial_form_opened'
  | 'trial_form_submitted'
  | 'trial_created'
  | 'checkout_started'
  | 'checkout_completed'
  | 'exit_intent_shown'
  | 'exit_intent_converted';

// Propriedades do evento
export interface EventProperties {
  page?: string;
  step?: number;
  totalSteps?: number;
  planId?: string;
  planName?: string;
  planPrice?: number;
  source?: string;
  quizScore?: number;
  quizAnswers?: Record<string, any>;
  userId?: string;
  personalId?: string;
  timestamp?: number;
  sessionId?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  [key: string]: any;
}

// Gerar ID de sessão único
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('fp_session_id');
  if (!sessionId) {
    sessionId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('fp_session_id', sessionId);
  }
  return sessionId;
};

// Obter parâmetros UTM da URL
const getUtmParams = (): Record<string, string> => {
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = params.get(param);
    if (value) {
      utmParams[param] = value;
      // Salvar UTM params para uso posterior
      sessionStorage.setItem(param, value);
    } else {
      // Tentar recuperar de sessão anterior
      const stored = sessionStorage.getItem(param);
      if (stored) utmParams[param] = stored;
    }
  });
  
  return utmParams;
};

// Função principal de tracking
export const trackEvent = (event: FunnelEvent, properties: EventProperties = {}): void => {
  const sessionId = getSessionId();
  const utmParams = getUtmParams();
  
  const eventData = {
    event,
    properties: {
      ...properties,
      sessionId,
      timestamp: Date.now(),
      page: window.location.pathname,
      referrer: document.referrer || undefined,
      ...utmParams,
    },
  };
  
  // Log para desenvolvimento
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventData);
  }
  
  // Salvar evento localmente para análise
  saveEventLocally(eventData);
  
  // Enviar para o backend (se configurado)
  sendEventToBackend(eventData);
};

// Salvar evento no localStorage para análise local
const saveEventLocally = (eventData: any): void => {
  try {
    const events = JSON.parse(localStorage.getItem('fp_analytics_events') || '[]');
    events.push(eventData);
    
    // Manter apenas os últimos 100 eventos
    if (events.length > 100) {
      events.shift();
    }
    
    localStorage.setItem('fp_analytics_events', JSON.stringify(events));
  } catch (e) {
    console.error('[Analytics] Error saving event locally:', e);
  }
};

// Enviar evento para o backend
const sendEventToBackend = async (eventData: any): Promise<void> => {
  try {
    // Usar beacon API para garantir envio mesmo ao sair da página
    const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/track', blob);
  } catch (e) {
    // Fallback para fetch
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true,
      });
    } catch (fetchError) {
      console.error('[Analytics] Error sending event:', fetchError);
    }
  }
};

// Funções de conveniência para eventos específicos do funil

export const trackPageView = (page?: string): void => {
  trackEvent('page_view', { page: page || window.location.pathname });
};

export const trackQuizStarted = (source?: string): void => {
  trackEvent('quiz_started', { source });
};

export const trackQuizStep = (step: number, totalSteps: number, answers?: Record<string, any>): void => {
  trackEvent('quiz_step_completed', { step, totalSteps, quizAnswers: answers });
};

export const trackQuizCompleted = (score?: number, answers?: Record<string, any>): void => {
  trackEvent('quiz_completed', { quizScore: score, quizAnswers: answers });
};

export const trackQuizAbandoned = (step: number, totalSteps: number): void => {
  trackEvent('quiz_abandoned', { step, totalSteps });
};

export const trackPricingViewed = (source?: string): void => {
  trackEvent('pricing_viewed', { source });
};

export const trackPlanSelected = (planId: string, planName: string, planPrice: number): void => {
  trackEvent('plan_selected', { planId, planName, planPrice });
};

export const trackTrialFormOpened = (source?: string): void => {
  trackEvent('trial_form_opened', { source });
};

export const trackTrialFormSubmitted = (): void => {
  trackEvent('trial_form_submitted');
};

export const trackTrialCreated = (userId?: string): void => {
  trackEvent('trial_created', { userId });
};

export const trackCheckoutStarted = (planId: string, planName: string, planPrice: number): void => {
  trackEvent('checkout_started', { planId, planName, planPrice });
};

export const trackCheckoutCompleted = (planId: string, planName: string, planPrice: number): void => {
  trackEvent('checkout_completed', { planId, planName, planPrice });
};

export const trackExitIntentShown = (page?: string): void => {
  trackEvent('exit_intent_shown', { page });
};

export const trackExitIntentConverted = (): void => {
  trackEvent('exit_intent_converted');
};

// Obter eventos salvos localmente (para debug/análise)
export const getLocalEvents = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('fp_analytics_events') || '[]');
  } catch {
    return [];
  }
};

// Limpar eventos locais
export const clearLocalEvents = (): void => {
  localStorage.removeItem('fp_analytics_events');
};

// Obter métricas do funil
export const getFunnelMetrics = (): Record<string, number> => {
  const events = getLocalEvents();
  const metrics: Record<string, number> = {};
  
  events.forEach(e => {
    metrics[e.event] = (metrics[e.event] || 0) + 1;
  });
  
  return metrics;
};
