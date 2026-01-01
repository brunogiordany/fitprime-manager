/**
 * FitPrime Manager - Serviço de Cobrança de Alunos Extras
 * 
 * Gerencia cobranças proporcionais de alunos que excedem o limite do plano
 */

import { getDb } from "../db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { personalSubscriptions, subscriptionUsageLogs, personals, users } from "../../drizzle/schema";
import { EXTRA_STUDENT_BR, formatPrice } from "../../shared/pricing";
import Stripe from "stripe";
import { ENV } from "../_core/env";

// Inicializar Stripe apenas se a chave estiver configurada
const stripe = ENV.stripeSecretKey 
  ? new Stripe(ENV.stripeSecretKey, { apiVersion: "2024-06-20" as any })
  : null;

// ==================== TIPOS ====================

export interface ExtraChargeResult {
  success: boolean;
  chargeId?: string;
  amount: number;
  currency: 'BRL' | 'USD';
  extraStudents: number;
  message: string;
}

export interface BillingPeriodSummary {
  personalId: number;
  periodStart: Date;
  periodEnd: Date;
  planPrice: number;
  extraStudents: number;
  extraCharges: number;
  totalAmount: number;
  currency: 'BRL' | 'USD';
  events: Array<{
    date: Date;
    type: string;
    description: string;
    amount?: number;
  }>;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Processa cobrança de alunos extras para um personal
 */
export async function processExtraStudentCharge(personalId: number): Promise<ExtraChargeResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      amount: 0,
      currency: 'BRL',
      extraStudents: 0,
      message: 'Database not available'
    };
  }

  // Buscar subscription
  const subscriptionResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);

  const subscription = subscriptionResult[0];
  if (!subscription) {
    return {
      success: false,
      amount: 0,
      currency: 'BRL',
      extraStudents: 0,
      message: 'Subscription não encontrada'
    };
  }

  const extraStudents = subscription.extraStudents || 0;
  if (extraStudents <= 0) {
    return {
      success: true,
      amount: 0,
      currency: 'BRL',
      extraStudents: 0,
      message: 'Nenhum aluno extra para cobrar'
    };
  }

  const extraAmount = extraStudents * EXTRA_STUDENT_BR.pricePerStudent;

  // Registrar log de cobrança - usando 'extra_charged' que é o valor correto do enum
  await db.insert(subscriptionUsageLogs).values({
    personalId,
    subscriptionId: subscription.id,
    eventType: 'extra_charged',
    previousValue: subscription.currentStudents - extraStudents,
    newValue: subscription.currentStudents,
    chargeAmount: extraAmount.toString(),
    currency: 'BRL',
    details: JSON.stringify({
      extraStudents,
      pricePerStudent: EXTRA_STUDENT_BR.pricePerStudent,
      totalCharge: extraAmount
    })
  });

  // Atualizar lastExtraChargeAt (campo correto da tabela)
  await db
    .update(personalSubscriptions)
    .set({ lastExtraChargeAt: new Date() })
    .where(eq(personalSubscriptions.id, subscription.id));

  // Se Stripe estiver configurado e o personal tiver stripeCustomerId, processar cobrança
  if (stripe && subscription.stripeCustomerId) {
    try {
      // Criar cobrança no Stripe
      const charge = await stripe.charges.create({
        amount: Math.round(extraAmount * 100), // Stripe usa centavos
        currency: 'brl',
        customer: subscription.stripeCustomerId,
        description: `FitPrime - ${extraStudents} aluno(s) extra(s)`,
        metadata: {
          personalId: personalId.toString(),
          subscriptionId: subscription.id.toString(),
          extraStudents: extraStudents.toString()
        }
      });

      return {
        success: true,
        chargeId: charge.id,
        amount: extraAmount,
        currency: 'BRL',
        extraStudents,
        message: `Cobrança de ${formatPrice(extraAmount, 'BRL')} processada com sucesso`
      };
    } catch (error: any) {
      console.error('[Billing] Erro ao processar cobrança Stripe:', error);
      return {
        success: false,
        amount: extraAmount,
        currency: 'BRL',
        extraStudents,
        message: `Erro ao processar cobrança: ${error.message}`
      };
    }
  }

  // Sem Stripe configurado, apenas registrar
  return {
    success: true,
    amount: extraAmount,
    currency: 'BRL',
    extraStudents,
    message: `Cobrança de ${formatPrice(extraAmount, 'BRL')} registrada (pagamento manual necessário)`
  };
}

/**
 * Obtém resumo do período de cobrança atual
 */
export async function getBillingPeriodSummary(personalId: number): Promise<BillingPeriodSummary | null> {
  const db = await getDb();
  if (!db) return null;

  // Buscar subscription
  const subscriptionResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);

  const subscription = subscriptionResult[0];
  if (!subscription) {
    return null;
  }

  // Definir período atual (último mês)
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - 1);

  // Buscar eventos do período
  const eventsResult = await db
    .select()
    .from(subscriptionUsageLogs)
    .where(
      and(
        eq(subscriptionUsageLogs.personalId, personalId),
        gte(subscriptionUsageLogs.createdAt, periodStart),
        lte(subscriptionUsageLogs.createdAt, periodEnd)
      )
    );

  // Calcular totais - usando 'extra_charged' que é o valor correto do enum
  const extraCharges = eventsResult
    .filter(e => e.eventType === 'extra_charged')
    .reduce((sum, e) => sum + Number(e.chargeAmount || 0), 0);

  const events = eventsResult.map(e => ({
    date: e.createdAt,
    type: e.eventType,
    description: getEventDescription(e.eventType, e.details),
    amount: e.chargeAmount ? Number(e.chargeAmount) : undefined
  }));

  return {
    personalId,
    periodStart,
    periodEnd,
    planPrice: Number(subscription.planPrice),
    extraStudents: subscription.extraStudents || 0,
    extraCharges,
    totalAmount: Number(subscription.planPrice) + extraCharges,
    currency: subscription.currency as 'BRL' | 'USD',
    events
  };
}

/**
 * Processa cobranças mensais para todos os personals com alunos extras
 * Esta função deve ser chamada por um cron job mensal
 */
export async function processMonthlyExtraCharges(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  totalAmount: number;
}> {
  const db = await getDb();
  if (!db) {
    return { processed: 0, successful: 0, failed: 0, totalAmount: 0 };
  }

  // Buscar todas as subscriptions com alunos extras
  const subscriptionsResult = await db
    .select()
    .from(personalSubscriptions)
    .where(
      and(
        sql`${personalSubscriptions.extraStudents} > 0`,
        eq(personalSubscriptions.status, 'active')
      )
    );

  let processed = 0;
  let successful = 0;
  let failed = 0;
  let totalAmount = 0;

  for (const subscription of subscriptionsResult) {
    processed++;
    const result = await processExtraStudentCharge(subscription.personalId);
    
    if (result.success) {
      successful++;
      totalAmount += result.amount;
    } else {
      failed++;
    }
  }

  return { processed, successful, failed, totalAmount };
}

/**
 * Gera descrição legível para um evento
 */
function getEventDescription(eventType: string, detailsJson: string | null): string {
  const details = detailsJson ? JSON.parse(detailsJson) : {};

  switch (eventType) {
    case 'student_added':
      return `Aluno adicionado (${details.previousCount} → ${details.newCount})`;
    case 'student_removed':
      return `Aluno removido (${details.previousCount} → ${details.newCount})`;
    case 'limit_exceeded':
      return `Limite excedido: ${details.exceeded} aluno(s) extra(s)`;
    case 'extra_charged':
      return `Cobrança de ${details.extraStudents} aluno(s) extra(s)`;
    case 'plan_upgraded':
      return `Upgrade de plano: ${details.previousPlan} → ${details.newPlan}`;
    case 'plan_downgraded':
      return `Downgrade de plano: ${details.previousPlan} → ${details.newPlan}`;
    case 'upgrade_suggested':
      return `Sugestão de upgrade enviada`;
    case 'payment_failed':
      return `Falha no pagamento`;
    case 'subscription_renewed':
      return `Assinatura renovada`;
    default:
      return eventType;
  }
}

/**
 * Cria sessão de checkout do Stripe para upgrade de plano
 */
export async function createUpgradeCheckoutSession(
  personalId: number,
  newPlanId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    console.warn('[Billing] Stripe não configurado');
    return null;
  }

  const db = await getDb();
  if (!db) return null;

  // Buscar personal com email do user
  const personalResult = await db
    .select({
      personal: personals,
      user: users
    })
    .from(personals)
    .innerJoin(users, eq(personals.userId, users.id))
    .where(eq(personals.id, personalId))
    .limit(1);

  const result = personalResult[0];
  if (!result) {
    return null;
  }

  const userEmail = result.user.email;
  if (!userEmail) {
    console.warn('[Billing] Personal sem email cadastrado');
    return null;
  }

  // Criar sessão de checkout
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: newPlanId, // Usar o priceId do Stripe
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        personalId: personalId.toString(),
        planId: newPlanId
      }
    });

    return {
      sessionId: session.id,
      url: session.url || ''
    };
  } catch (error: any) {
    console.error('[Billing] Erro ao criar sessão de checkout:', error);
    return null;
  }
}
