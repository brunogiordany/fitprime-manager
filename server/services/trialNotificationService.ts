/**
 * Trial Notification Service
 * Serviço para enviar notificações automáticas quando o período de teste está expirando
 */

import { sql } from 'drizzle-orm';
import { getDb } from '../db';
import { sendTrialExpiringEmail } from '../email';

interface TrialUser {
  id: number;
  userId: number;
  email: string;
  name: string;
  trialEndsAt: Date;
  lastTrialNotificationSent: Date | null;
}

/**
 * Busca usuários com trial expirando nas próximas horas
 */
export async function getExpiringTrials(hoursAhead: number): Promise<TrialUser[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Buscar personals com trial expirando entre agora e o tempo futuro
    const [rows] = await db.execute(sql`
      SELECT 
        p.id,
        p.userId,
        u.email,
        u.name,
        p.trialEndsAt,
        p.lastTrialNotificationSent
      FROM personals p
      JOIN users u ON u.id = p.userId
      WHERE p.subscriptionStatus = 'trial'
        AND p.trialEndsAt IS NOT NULL
        AND p.trialEndsAt > NOW()
        AND p.trialEndsAt <= ${futureTime.toISOString()}
        AND u.email IS NOT NULL
        AND p.deletedAt IS NULL
        AND u.deletedAt IS NULL
    `);

    return ((rows as unknown) as any[]).map(row => ({
      id: row.id,
      userId: row.userId,
      email: row.email,
      name: row.name || 'Personal',
      trialEndsAt: new Date(row.trialEndsAt),
      lastTrialNotificationSent: row.lastTrialNotificationSent ? new Date(row.lastTrialNotificationSent) : null,
    }));
  } catch (error) {
    console.error('[TrialNotification] Erro ao buscar trials expirando:', error);
    return [];
  }
}

/**
 * Verifica se já enviamos notificação para este usuário recentemente
 * Evita envio duplicado de emails
 */
function shouldSendNotification(user: TrialUser, notificationType: '24h' | '2h'): boolean {
  const now = new Date();
  const hoursUntilExpiry = (user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Se não tem registro de última notificação, pode enviar
  if (!user.lastTrialNotificationSent) {
    return true;
  }

  const hoursSinceLastNotification = (now.getTime() - user.lastTrialNotificationSent.getTime()) / (1000 * 60 * 60);

  // Para notificação de 24h: enviar se não enviou nas últimas 20h
  if (notificationType === '24h' && hoursUntilExpiry <= 24 && hoursUntilExpiry > 2) {
    return hoursSinceLastNotification >= 20;
  }

  // Para notificação de 2h: enviar se não enviou nas últimas 4h e está nas últimas 2h
  if (notificationType === '2h' && hoursUntilExpiry <= 2) {
    return hoursSinceLastNotification >= 4;
  }

  return false;
}

/**
 * Atualiza o registro de última notificação enviada
 */
async function updateLastNotificationSent(personalId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql`
      UPDATE personals 
      SET lastTrialNotificationSent = NOW()
      WHERE id = ${personalId}
    `);
  } catch (error) {
    console.error('[TrialNotification] Erro ao atualizar última notificação:', error);
  }
}

/**
 * Processa e envia notificações de trial expirando
 */
export async function processTrialNotifications(): Promise<{ sent: number; errors: number }> {
  console.log('[TrialNotification] Iniciando processamento de notificações de trial...');
  
  let sent = 0;
  let errors = 0;

  try {
    // Buscar trials expirando nas próximas 24 horas
    const expiringTrials = await getExpiringTrials(24);
    console.log(`[TrialNotification] Encontrados ${expiringTrials.length} trials expirando nas próximas 24h`);

    for (const user of expiringTrials) {
      const now = new Date();
      const hoursRemaining = (user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Determinar tipo de notificação
      const notificationType: '24h' | '2h' = hoursRemaining <= 2 ? '2h' : '24h';

      // Verificar se deve enviar
      if (!shouldSendNotification(user, notificationType)) {
        console.log(`[TrialNotification] Pulando ${user.email} - notificação já enviada recentemente`);
        continue;
      }

      try {
        // Enviar email
        const upgradeLink = `https://fitprimemanager.com/pricing?utm_source=trial_expiring&utm_medium=email&utm_campaign=${notificationType}`;
        
        const success = await sendTrialExpiringEmail(
          user.email,
          user.name,
          hoursRemaining,
          upgradeLink
        );

        if (success) {
          await updateLastNotificationSent(user.id);
          sent++;
          console.log(`[TrialNotification] ✅ Email enviado para ${user.email} (${hoursRemaining.toFixed(1)}h restantes)`);
        } else {
          errors++;
          console.error(`[TrialNotification] ❌ Falha ao enviar email para ${user.email}`);
        }
      } catch (error) {
        errors++;
        console.error(`[TrialNotification] ❌ Erro ao processar ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('[TrialNotification] Erro geral no processamento:', error);
  }

  console.log(`[TrialNotification] Processamento concluído: ${sent} enviados, ${errors} erros`);
  return { sent, errors };
}

/**
 * Adiciona a coluna lastTrialNotificationSent se não existir
 */
export async function ensureTrialNotificationColumn(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se a coluna existe
    const [columns] = await db.execute(sql`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'personals' 
      AND COLUMN_NAME = 'lastTrialNotificationSent'
    `);

    if (((columns as unknown) as any[]).length === 0) {
      console.log('[TrialNotification] Adicionando coluna lastTrialNotificationSent...');
      await db.execute(sql`
        ALTER TABLE personals 
        ADD COLUMN lastTrialNotificationSent TIMESTAMP NULL
      `);
      console.log('[TrialNotification] Coluna adicionada com sucesso');
    }
  } catch (error) {
    console.error('[TrialNotification] Erro ao verificar/criar coluna:', error);
  }
}
