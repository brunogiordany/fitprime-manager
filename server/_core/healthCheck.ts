import { notifyOwner } from "./notification";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    server: {
      status: 'ok';
      uptime: number;
    };
  };
}

// Track last notification time to avoid spam
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

// Track consecutive failures
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available');
    }
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;
    consecutiveFailures = 0; // Reset on success
    return { status: 'ok', latency };
  } catch (error: any) {
    consecutiveFailures++;
    const errorMessage = error?.message || 'Unknown database error';
    
    // Notify owner if threshold reached and cooldown passed
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      await notifyHealthIssue('database', errorMessage);
    }
    
    return { 
      status: 'error', 
      error: errorMessage,
      latency: Date.now() - start
    };
  }
}

/**
 * Send notification about health issues (with cooldown)
 */
async function notifyHealthIssue(component: string, error: string): Promise<void> {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    console.log('[HealthCheck] Skipping notification due to cooldown');
    return;
  }
  
  lastNotificationTime = now;
  
  const title = `⚠️ FitPrime - Problema Detectado: ${component}`;
  const content = `
**Componente:** ${component}
**Erro:** ${error}
**Falhas consecutivas:** ${consecutiveFailures}
**Horário:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Este é um alerta automático do sistema de monitoramento do FitPrime Manager.
O sistema detectou problemas de conectividade que podem afetar o funcionamento da aplicação.

**Ações recomendadas:**
1. Verificar status do banco de dados no painel do Manus
2. Se o problema persistir, contatar suporte em https://help.manus.im
`.trim();

  try {
    await notifyOwner({ title, content });
    console.log('[HealthCheck] Notification sent to owner');
  } catch (err) {
    console.error('[HealthCheck] Failed to send notification:', err);
  }
}

/**
 * Notify about OAuth failures
 */
export async function notifyOAuthFailure(error: string, userInfo?: string): Promise<void> {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    return;
  }
  
  lastNotificationTime = now;
  
  const title = '⚠️ FitPrime - Falha no Login (OAuth)';
  const content = `
**Erro:** ${error}
**Usuário tentando logar:** ${userInfo || 'Não identificado'}
**Horário:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Um usuário não conseguiu fazer login no sistema devido a um erro.
Isso pode indicar problemas de conectividade com o banco de dados.

**Possíveis causas:**
- Banco de dados temporariamente indisponível
- Problema de rede
- Erro de configuração

**Ação recomendada:**
Verifique o status do banco de dados no painel do Manus.
`.trim();

  try {
    await notifyOwner({ title, content });
  } catch (err) {
    console.error('[HealthCheck] Failed to send OAuth failure notification:', err);
  }
}

/**
 * Get full health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const dbCheck = await checkDatabase();
  
  const status: HealthStatus = {
    status: dbCheck.status === 'ok' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck,
      server: {
        status: 'ok',
        uptime: process.uptime()
      }
    }
  };
  
  return status;
}

/**
 * Log error with details and optionally notify
 */
export function logError(context: string, error: any, shouldNotify: boolean = false): void {
  const errorDetails = {
    context,
    message: error?.message || 'Unknown error',
    code: error?.code,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  };
  
  console.error(`[${context}] Error:`, JSON.stringify(errorDetails, null, 2));
  
  if (shouldNotify) {
    notifyHealthIssue(context, errorDetails.message);
  }
}
