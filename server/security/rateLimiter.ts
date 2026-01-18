/**
 * Rate Limiter para endpoints sensíveis
 * 
 * Protege contra ataques de força bruta e abuso de recursos
 */

// Armazenamento em memória para rate limiting
// Em produção, considerar usar Redis para persistência entre instâncias
const rateLimitStore = new Map<string, {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}>();

export interface RateLimitConfig {
  maxAttempts: number;      // Número máximo de tentativas
  windowMs: number;         // Janela de tempo em ms
  blockDurationMs: number;  // Duração do bloqueio após exceder limite
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  blockedUntil?: Date;
  message?: string;
}

// Configurações padrão para diferentes tipos de endpoints
export const RATE_LIMIT_CONFIGS = {
  // Recuperação de senha - mais restritivo
  passwordReset: {
    maxAttempts: 3,           // 3 tentativas
    windowMs: 15 * 60 * 1000, // por 15 minutos
    blockDurationMs: 30 * 60 * 1000, // bloqueio de 30 minutos
  },
  // Login - moderadamente restritivo
  login: {
    maxAttempts: 5,           // 5 tentativas
    windowMs: 15 * 60 * 1000, // por 15 minutos
    blockDurationMs: 15 * 60 * 1000, // bloqueio de 15 minutos
  },
  // Verificação de código - restritivo
  codeVerification: {
    maxAttempts: 5,           // 5 tentativas
    windowMs: 15 * 60 * 1000, // por 15 minutos
    blockDurationMs: 60 * 60 * 1000, // bloqueio de 1 hora
  },
  // Webhook - menos restritivo
  webhook: {
    maxAttempts: 100,         // 100 requisições
    windowMs: 60 * 1000,      // por minuto
    blockDurationMs: 5 * 60 * 1000, // bloqueio de 5 minutos
  },
};

/**
 * Verifica e aplica rate limiting
 * @param key Identificador único (ex: email, IP, combinação)
 * @param config Configuração de rate limiting
 * @returns Resultado indicando se a requisição é permitida
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Verificar se está bloqueado
  if (record?.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      blockedUntil: new Date(record.blockedUntil),
      message: `Muitas tentativas. Tente novamente em ${Math.ceil((record.blockedUntil - now) / 60000)} minutos.`,
    };
  }
  
  // Se não há registro ou a janela expirou, criar novo
  if (!record || now - record.firstRequest > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
    };
  }
  
  // Incrementar contador
  record.count++;
  
  // Verificar se excedeu o limite
  if (record.count > config.maxAttempts) {
    record.blockedUntil = now + config.blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      blockedUntil: new Date(record.blockedUntil),
      message: `Muitas tentativas. Tente novamente em ${Math.ceil(config.blockDurationMs / 60000)} minutos.`,
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxAttempts - record.count,
  };
}

/**
 * Reseta o rate limit para uma chave específica
 * Útil após login bem-sucedido
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Limpa registros antigos de rate limiting
 * Deve ser chamado periodicamente
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 horas
  
  for (const [key, record] of Array.from(rateLimitStore.entries())) {
    // Remover se a janela expirou e não está bloqueado
    if (now - record.firstRequest > maxAge && (!record.blockedUntil || now > record.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpar a cada 10 minutos
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);

/**
 * Gera uma chave de rate limit combinando múltiplos identificadores
 */
export function generateRateLimitKey(...parts: string[]): string {
  return parts.filter(Boolean).join(':');
}
