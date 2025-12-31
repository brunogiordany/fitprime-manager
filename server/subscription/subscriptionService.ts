/**
 * FitPrime Manager - Serviço de Gerenciamento de Subscriptions
 * 
 * Gerencia planos, limites de alunos e cobranças automáticas
 * REGRA-MÃE: O usuário paga pelo que escala. Nunca paga para "desbloquear crescimento".
 */

import { getDb } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { personals, students, personalSubscriptions, subscriptionUsageLogs } from "../../drizzle/schema";
import { 
  PLANS_BR, 
  EXTRA_STUDENT_BR, 
  findSuitablePlan, 
  calculateExtraStudentCost, 
  suggestUpgrade,
  formatPrice,
  type PlanConfig,
  type Country
} from "../../shared/pricing";

// ==================== TIPOS ====================

export interface StudentLimitStatus {
  personalId: number;
  currentPlan: PlanConfig | null;
  studentLimit: number;
  currentStudents: number;
  activeStudents: number;
  exceededBy: number;
  status: 'ok' | 'at_limit' | 'exceeded' | 'no_plan';
  extraCost: number;
  currency: 'BRL' | 'USD';
  suggestedUpgrade: {
    shouldUpgrade: boolean;
    suggestedPlan: PlanConfig | null;
    savings: number;
  } | null;
}

export interface SubscriptionInfo {
  personalId: number;
  planId: string;
  planName: string;
  status: string;
  studentLimit: number;
  currentStudents: number;
  extraStudents: number;
  planPrice: number;
  extraStudentPrice: number;
  totalMonthlyPrice: number;
  currency: 'BRL' | 'USD';
  country: Country;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Verifica o status de limite de alunos de um personal
 */
export async function checkStudentLimit(personalId: number): Promise<StudentLimitStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar subscription atual do personal
  const subscriptionResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);
  const subscription = subscriptionResult[0];

  // Contar alunos ativos (não deletados e não cancelados)
  const studentCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(
      and(
        eq(students.personalId, personalId),
        sql`${students.deletedAt} IS NULL`,
        sql`${students.status} != 'inactive'`
      )
    );

  const activeStudents = studentCountResult[0]?.count || 0;

  // Se não tem subscription, está em trial ou precisa criar
  if (!subscription) {
    // Usar plano Starter como padrão para trial
    const starterPlan = PLANS_BR[0];
    
    return {
      personalId,
      currentPlan: starterPlan,
      studentLimit: starterPlan.studentLimit,
      currentStudents: activeStudents,
      activeStudents,
      exceededBy: Math.max(0, activeStudents - starterPlan.studentLimit),
      status: activeStudents > starterPlan.studentLimit ? 'exceeded' : 
              activeStudents === starterPlan.studentLimit ? 'at_limit' : 'ok',
      extraCost: Math.max(0, activeStudents - starterPlan.studentLimit) * EXTRA_STUDENT_BR.pricePerStudent,
      currency: 'BRL',
      suggestedUpgrade: activeStudents > starterPlan.studentLimit 
        ? suggestUpgrade(starterPlan, activeStudents, 'BR')
        : null
    };
  }

  // Encontrar plano atual
  const currentPlan = PLANS_BR.find(p => p.id === subscription.planId) || PLANS_BR[0];
  const studentLimit = subscription.studentLimit || currentPlan.studentLimit;
  const exceededBy = Math.max(0, activeStudents - studentLimit);

  // Calcular custo extra
  const extraCostInfo = calculateExtraStudentCost(currentPlan, activeStudents, 'BR');

  // Verificar se deve sugerir upgrade
  const upgradeInfo = exceededBy > 0 
    ? suggestUpgrade(currentPlan, activeStudents, 'BR')
    : null;

  return {
    personalId,
    currentPlan,
    studentLimit,
    currentStudents: activeStudents,
    activeStudents,
    exceededBy,
    status: exceededBy > 0 ? 'exceeded' : 
            activeStudents === studentLimit ? 'at_limit' : 'ok',
    extraCost: extraCostInfo.extraCost,
    currency: extraCostInfo.currency,
    suggestedUpgrade: upgradeInfo
  };
}

/**
 * Obtém informações completas da subscription de um personal
 */
export async function getSubscriptionInfo(personalId: number): Promise<SubscriptionInfo | null> {
  const db = await getDb();
  if (!db) return null;

  const subscriptionResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);

  const subscription = subscriptionResult[0];
  if (!subscription) {
    return null;
  }

  const currentPlan = PLANS_BR.find(p => p.id === subscription.planId) || PLANS_BR[0];
  const extraStudents = Math.max(0, subscription.currentStudents - subscription.studentLimit);
  const extraCost = extraStudents * Number(subscription.extraStudentPrice);
  const totalMonthlyPrice = Number(subscription.planPrice) + extraCost;

  return {
    personalId,
    planId: subscription.planId,
    planName: subscription.planName,
    status: subscription.status,
    studentLimit: subscription.studentLimit,
    currentStudents: subscription.currentStudents,
    extraStudents,
    planPrice: Number(subscription.planPrice),
    extraStudentPrice: Number(subscription.extraStudentPrice),
    totalMonthlyPrice,
    currency: subscription.currency as 'BRL' | 'USD',
    country: subscription.country as Country,
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodEnd: subscription.currentPeriodEnd
  };
}

/**
 * Cria ou atualiza a subscription de um personal
 */
export async function createOrUpdateSubscription(
  personalId: number,
  planId: string,
  country: Country = 'BR'
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const plans = country === 'BR' ? PLANS_BR : PLANS_BR; // TODO: adicionar PLANS_US
  const plan = plans.find(p => p.id === planId);
  
  if (!plan) {
    throw new Error(`Plano não encontrado: ${planId}`);
  }

  const extraConfig = country === 'BR' ? EXTRA_STUDENT_BR : EXTRA_STUDENT_BR; // TODO: adicionar EXTRA_STUDENT_US

  // Contar alunos ativos
  const studentCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(
      and(
        eq(students.personalId, personalId),
        sql`${students.deletedAt} IS NULL`,
        sql`${students.status} != 'inactive'`
      )
    );

  const currentStudents = studentCountResult[0]?.count || 0;
  const extraStudents = Math.max(0, currentStudents - plan.studentLimit);

  // Verificar se já existe subscription
  const existingResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);

  const existing = existingResult[0];

  if (existing) {
    // Atualizar subscription existente
    await db
      .update(personalSubscriptions)
      .set({
        planId: plan.id,
        planName: plan.name,
        country,
        studentLimit: plan.studentLimit,
        currentStudents,
        extraStudents,
        planPrice: plan.price.toString(),
        extraStudentPrice: extraConfig.pricePerStudent.toString(),
        currency: plan.currency,
        updatedAt: new Date()
      })
      .where(eq(personalSubscriptions.id, existing.id));

    // Registrar log de upgrade/downgrade
    const eventType = plan.price > Number(existing.planPrice) ? 'plan_upgraded' : 'plan_downgraded';
    await logSubscriptionEvent(db, personalId, existing.id, eventType, {
      previousPlan: existing.planId,
      newPlan: plan.id,
      previousPrice: Number(existing.planPrice),
      newPrice: plan.price
    });
  } else {
    // Criar nova subscription (trial de 14 dias)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await db.insert(personalSubscriptions).values({
      personalId,
      planId: plan.id,
      planName: plan.name,
      country,
      studentLimit: plan.studentLimit,
      currentStudents,
      extraStudents,
      planPrice: plan.price.toString(),
      extraStudentPrice: extraConfig.pricePerStudent.toString(),
      currency: plan.currency,
      status: 'trial',
      trialEndsAt
    });
  }
}

/**
 * Atualiza a contagem de alunos na subscription
 * Chamado quando um aluno é adicionado ou removido
 */
export async function updateStudentCount(personalId: number): Promise<StudentLimitStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Contar alunos ativos
  const studentCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(
      and(
        eq(students.personalId, personalId),
        sql`${students.deletedAt} IS NULL`,
        sql`${students.status} != 'inactive'`
      )
    );

  const currentStudents = studentCountResult[0]?.count || 0;

  // Buscar subscription
  const subscriptionResult = await db
    .select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);

  const subscription = subscriptionResult[0];

  if (subscription) {
    const previousCount = subscription.currentStudents;
    const extraStudents = Math.max(0, currentStudents - subscription.studentLimit);

    // Atualizar contagem
    await db
      .update(personalSubscriptions)
      .set({
        currentStudents,
        extraStudents,
        updatedAt: new Date()
      })
      .where(eq(personalSubscriptions.id, subscription.id));

    // Registrar evento
    if (currentStudents > previousCount) {
      await logSubscriptionEvent(db, personalId, subscription.id, 'student_added', {
        previousCount,
        newCount: currentStudents
      });

      // Se excedeu o limite, registrar
      if (currentStudents > subscription.studentLimit && previousCount <= subscription.studentLimit) {
        await logSubscriptionEvent(db, personalId, subscription.id, 'limit_exceeded', {
          limit: subscription.studentLimit,
          current: currentStudents,
          exceeded: currentStudents - subscription.studentLimit
        });
      }
    } else if (currentStudents < previousCount) {
      await logSubscriptionEvent(db, personalId, subscription.id, 'student_removed', {
        previousCount,
        newCount: currentStudents
      });
    }
  }

  // Retornar status atualizado
  return checkStudentLimit(personalId);
}

/**
 * Verifica se o personal pode adicionar mais alunos
 * Retorna true se pode adicionar (mesmo que seja cobrado extra)
 */
export async function canAddStudent(personalId: number): Promise<{
  canAdd: boolean;
  willBeCharged: boolean;
  extraCost: number;
  message: string;
}> {
  const status = await checkStudentLimit(personalId);

  // Verificar se está no limite máximo do maior plano
  const maxPlan = PLANS_BR[PLANS_BR.length - 1];
  if (status.currentStudents >= maxPlan.studentLimit + 50) {
    // Limite absoluto: plano máximo + 50 extras
    return {
      canAdd: false,
      willBeCharged: false,
      extraCost: 0,
      message: `Você atingiu o limite máximo de ${maxPlan.studentLimit + 50} alunos. Entre em contato para um plano Enterprise personalizado.`
    };
  }

  // Pode adicionar, verificar se será cobrado
  const willBeCharged = status.currentStudents >= status.studentLimit;
  const extraCost = willBeCharged ? EXTRA_STUDENT_BR.pricePerStudent : 0;

  let message = '';
  if (willBeCharged) {
    message = `Você excedeu o limite de ${status.studentLimit} alunos do seu plano. ` +
              `Será cobrado ${formatPrice(extraCost, 'BRL')} por este aluno adicional.`;
    
    if (status.suggestedUpgrade?.shouldUpgrade) {
      message += ` Considere fazer upgrade para o plano ${status.suggestedUpgrade.suggestedPlan?.name} ` +
                 `e economize ${formatPrice(status.suggestedUpgrade.savings, 'BRL')}/mês.`;
    }
  }

  return {
    canAdd: true,
    willBeCharged,
    extraCost,
    message
  };
}

/**
 * Registra um evento de uso/cobrança na subscription
 */
async function logSubscriptionEvent(
  db: any,
  personalId: number,
  subscriptionId: number,
  eventType: string,
  details: Record<string, any>,
  chargeAmount?: number
): Promise<void> {
  await db.insert(subscriptionUsageLogs).values({
    personalId,
    subscriptionId,
    eventType: eventType as any,
    previousValue: details.previousCount || details.previousPrice || null,
    newValue: details.newCount || details.newPrice || null,
    chargeAmount: chargeAmount?.toString() || null,
    currency: 'BRL',
    details: JSON.stringify(details)
  });
}

/**
 * Obtém sugestão de upgrade para o personal
 */
export async function getUpgradeSuggestion(personalId: number): Promise<{
  shouldUpgrade: boolean;
  currentPlan: PlanConfig | null;
  suggestedPlan: PlanConfig | null;
  currentCost: number;
  newCost: number;
  savings: number;
  message: string;
} | null> {
  const status = await checkStudentLimit(personalId);

  if (!status.suggestedUpgrade?.shouldUpgrade || !status.currentPlan) {
    return null;
  }

  const currentTotalCost = status.currentPlan.price + status.extraCost;
  const newCost = status.suggestedUpgrade.suggestedPlan?.price || 0;

  return {
    shouldUpgrade: true,
    currentPlan: status.currentPlan,
    suggestedPlan: status.suggestedUpgrade.suggestedPlan,
    currentCost: currentTotalCost,
    newCost,
    savings: status.suggestedUpgrade.savings,
    message: `Você está pagando ${formatPrice(currentTotalCost, 'BRL')}/mês ` +
             `(${formatPrice(status.currentPlan.price, 'BRL')} do plano + ` +
             `${formatPrice(status.extraCost, 'BRL')} de ${status.exceededBy} alunos extras). ` +
             `Fazendo upgrade para o plano ${status.suggestedUpgrade.suggestedPlan?.name}, ` +
             `você pagaria apenas ${formatPrice(newCost, 'BRL')}/mês e economizaria ` +
             `${formatPrice(status.suggestedUpgrade.savings, 'BRL')}/mês!`
  };
}

/**
 * Lista todos os planos disponíveis para um país
 */
export function getAvailablePlans(country: Country = 'BR'): PlanConfig[] {
  return country === 'BR' ? PLANS_BR : PLANS_BR; // TODO: adicionar PLANS_US
}

/**
 * Calcula o preço total mensal baseado no número de alunos
 */
export function calculateMonthlyPrice(
  planId: string,
  studentCount: number,
  country: Country = 'BR'
): {
  planPrice: number;
  extraStudents: number;
  extraCost: number;
  totalPrice: number;
  currency: 'BRL' | 'USD';
} {
  const plans = country === 'BR' ? PLANS_BR : PLANS_BR;
  const plan = plans.find(p => p.id === planId) || plans[0];
  const extraConfig = country === 'BR' ? EXTRA_STUDENT_BR : EXTRA_STUDENT_BR;

  const extraStudents = Math.max(0, studentCount - plan.studentLimit);
  const extraCost = extraStudents * extraConfig.pricePerStudent;

  return {
    planPrice: plan.price,
    extraStudents,
    extraCost,
    totalPrice: plan.price + extraCost,
    currency: plan.currency
  };
}
