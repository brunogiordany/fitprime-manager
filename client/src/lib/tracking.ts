/**
 * Utilitários para captura de dados de tracking (UTM, dispositivo, etc.)
 */

// Capturar parâmetros UTM da URL
export function getUtmParams() {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
    utmTerm: params.get('utm_term') || undefined,
  };
}

// Capturar referrer
export function getReferrer() {
  if (typeof document === 'undefined') return undefined;
  return document.referrer || undefined;
}

// Capturar landing page
export function getLandingPage() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

// Detectar tipo de dispositivo
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Tablets
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  // Mobile
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// Detectar navegador
export function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Edg')) return 'Edge Chromium';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  
  return 'Unknown';
}

// Detectar sistema operacional
export function getOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows NT 10.0')) return 'Windows 10';
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (ua.includes('Windows NT 6.2')) return 'Windows 8';
  if (ua.includes('Windows NT 6.1')) return 'Windows 7';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  
  return 'Unknown';
}

// Obter User Agent
export function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

// Obter todos os dados de tracking
export function getTrackingData() {
  return {
    ...getUtmParams(),
    referrer: getReferrer(),
    landingPage: getLandingPage(),
    userAgent: getUserAgent(),
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
  };
}

// Salvar UTM params no localStorage para persistir entre páginas
export function saveUtmParams() {
  if (typeof window === 'undefined') return;
  
  const utmParams = getUtmParams();
  const hasUtm = Object.values(utmParams).some(v => v);
  
  if (hasUtm) {
    localStorage.setItem('utm_params', JSON.stringify(utmParams));
  }
}

// Recuperar UTM params do localStorage
export function getSavedUtmParams() {
  if (typeof localStorage === 'undefined') return {};
  
  try {
    const saved = localStorage.getItem('utm_params');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Obter UTM params (da URL ou localStorage)
export function getUtmParamsWithFallback() {
  const currentUtm = getUtmParams();
  const hasCurrentUtm = Object.values(currentUtm).some(v => v);
  
  if (hasCurrentUtm) {
    saveUtmParams();
    return currentUtm;
  }
  
  return getSavedUtmParams();
}
