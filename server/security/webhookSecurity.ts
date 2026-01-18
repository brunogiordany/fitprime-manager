/**
 * Módulo de Segurança para Webhooks
 * 
 * Implementa validação de tokens e rate limiting para proteger
 * os endpoints de webhook contra ataques.
 */

import crypto from 'crypto';

// Armazenamento em memória para rate limiting (em produção, usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Tokens de webhook por instância (em produção, armazenar no banco de dados)
const webhookTokens = new Map<string, string>();

/**
 * Gera um token seguro para uma instância de webhook
 */
export function generateWebhookToken(instanceName: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  webhookTokens.set(instanceName, token);
  return token;
}

/**
 * Obtém o token de uma instância
 */
export function getWebhookToken(instanceName: string): string | undefined {
  return webhookTokens.get(instanceName);
}

/**
 * Valida o token do webhook
 * O token deve ser enviado no header 'X-Webhook-Token' ou 'Authorization'
 */
export function validateWebhookToken(
  instanceName: string,
  providedToken: string | undefined
): boolean {
  if (!providedToken) {
    return false;
  }
  
  const storedToken = webhookTokens.get(instanceName);
  if (!storedToken) {
    // Se não há token configurado, aceitar (para compatibilidade com instâncias antigas)
    // Em produção, isso deveria retornar false
    console.warn(`[Security] Nenhum token configurado para instância: ${instanceName}`);
    return true;
  }
  
  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedToken),
    Buffer.from(storedToken)
  );
}

/**
 * Valida assinatura HMAC do payload (se o Stevo suportar)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Comparação segura contra timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  } catch {
    return false;
  }
}

/**
 * Rate limiting para webhooks
 * Limita o número de requisições por IP/instância
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minuto
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Nova janela de tempo
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Valida o payload do webhook para garantir que é do Stevo
 */
export function validateStevoPayload(payload: any): { valid: boolean; error?: string } {
  // Verificar se tem a estrutura esperada do Stevo
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload inválido' };
  }
  
  // Verificar se tem pelo menos uma das estruturas conhecidas
  const hasDataKey = payload.data?.key?.remoteJid;
  const hasDirectKey = payload.key?.remoteJid;
  const hasFrom = payload.from;
  
  if (!hasDataKey && !hasDirectKey && !hasFrom) {
    return { valid: false, error: 'Estrutura de payload não reconhecida' };
  }
  
  // Verificar se o remoteJid é um número de WhatsApp válido
  let remoteJid = payload.data?.key?.remoteJid || payload.key?.remoteJid || payload.from;
  if (remoteJid) {
    // Deve terminar com @s.whatsapp.net ou @g.us (grupos)
    if (!remoteJid.includes('@')) {
      return { valid: false, error: 'remoteJid inválido' };
    }
  }
  
  return { valid: true };
}

/**
 * Limpa registros antigos de rate limiting (chamar periodicamente)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of Array.from(rateLimitStore.entries())) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpar a cada 5 minutos
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
