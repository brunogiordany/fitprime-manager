/**
 * FitPrime Manager - Router de Subscription
 * 
 * Endpoints para gerenciamento de planos e limites de alunos
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import * as dbFunctions from "../db";
import {
  checkStudentLimit,
  getSubscriptionInfo,
  createOrUpdateSubscription,
  updateStudentCount,
  canAddStudent,
  getUpgradeSuggestion,
  getAvailablePlans,
  calculateMonthlyPrice,
} from "./subscriptionService";
import {
  calculateProration,
  getAvailableUpgrades,
  validateUpgrade,
  type BillingPeriod,
} from "./prorationService";
import { PLANS } from "../../shared/plans";
import {
  processExtraStudentCharge,
  getBillingPeriodSummary,
} from "./billingService";
import { PLANS_BR, EXTRA_STUDENT_BR, formatPrice } from "../../shared/pricing";

// Helper to get personal
async function getPersonal(userId: number) {
  const personal = await dbFunctions.getPersonalByUserId(userId);
  if (!personal) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Perfil de personal não encontrado' });
  }
  return personal;
}

export const subscriptionRouter = router({
  /**
   * Verifica se o pagamento está em dia (com 1 dia de tolerância)
   * Considera: trial de 1 dia, acesso de teste (30 dias), e assinatura paga
   */
  paymentStatus: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const now = new Date();
    
    // 1. Verificar acesso de teste (liberado pelo owner - 30 dias)
    if (personal.testAccessEndsAt) {
      const testEndsAt = new Date(personal.testAccessEndsAt);
      if (now <= testEndsAt) {
        const daysRemaining = Math.ceil((testEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          isValid: true,
          status: 'test_access' as const,
          daysOverdue: 0,
          expiresAt: personal.testAccessEndsAt,
          daysRemaining,
          grantedBy: personal.testAccessGrantedBy,
          message: `Acesso de teste ativo. ${daysRemaining} dia(s) restante(s).`,
        };
      }
    }
    
    // 2. Verificar trial de 1 dia (novos usuários)
    if (personal.subscriptionStatus === 'trial') {
      // Verificar se tem data de término do trial
      if (personal.trialEndsAt) {
        const trialEndsAt = new Date(personal.trialEndsAt);
        if (now <= trialEndsAt) {
          const hoursRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60));
          return {
            isValid: true,
            status: 'trial' as const,
            daysOverdue: 0,
            expiresAt: personal.trialEndsAt,
            hoursRemaining,
            message: hoursRemaining > 24 
              ? `Período de teste ativo. ${Math.ceil(hoursRemaining / 24)} dia(s) restante(s).`
              : `Período de teste ativo. ${hoursRemaining} hora(s) restante(s).`,
          };
        } else {
          // Trial expirou
          return {
            isValid: false,
            status: 'trial_expired' as const,
            daysOverdue: Math.floor((now.getTime() - trialEndsAt.getTime()) / (1000 * 60 * 60 * 24)),
            expiresAt: personal.trialEndsAt,
            message: 'Período de teste expirado. Assine para continuar usando.',
          };
        }
      }
      // Trial sem data definida (legado) - considerar válido por 1 dia a partir do cadastro
      const createdAt = new Date(personal.createdAt);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 1); // 1 dia de trial
      
      if (now <= trialEnd) {
        const hoursRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
        return {
          isValid: true,
          status: 'trial' as const,
          daysOverdue: 0,
          expiresAt: trialEnd,
          hoursRemaining,
          message: `Período de teste ativo. ${hoursRemaining} hora(s) restante(s).`,
        };
      } else {
        return {
          isValid: false,
          status: 'trial_expired' as const,
          daysOverdue: Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24)),
          expiresAt: trialEnd,
          message: 'Período de teste expirado. Assine para continuar usando.',
        };
      }
    }
    
    // 3. Cancelado ou expirado
    if (personal.subscriptionStatus === 'cancelled' || personal.subscriptionStatus === 'expired') {
      return {
        isValid: false,
        status: personal.subscriptionStatus as 'cancelled' | 'expired',
        daysOverdue: 999,
        expiresAt: personal.subscriptionExpiresAt,
        message: personal.subscriptionStatus === 'cancelled' 
          ? 'Assinatura cancelada. Renove para continuar usando.' 
          : 'Assinatura expirada. Renove para continuar usando.',
      };
    }
    
    // 4. Verificar data de expiração com 1 dia de tolerância (assinatura ativa)
    if (personal.subscriptionExpiresAt) {
      const expiresAt = new Date(personal.subscriptionExpiresAt);
      const gracePeriodEnd = new Date(expiresAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // 1 dia de tolerância
      
      if (now > gracePeriodEnd) {
        const daysOverdue = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
        return {
          isValid: false,
          status: 'overdue' as const,
          daysOverdue,
          expiresAt: personal.subscriptionExpiresAt,
          message: `Pagamento em atraso há ${daysOverdue} dia(s). Renove para continuar usando.`,
        };
      }
    }
    
    return {
      isValid: true,
      status: 'active' as const,
      daysOverdue: 0,
      expiresAt: personal.subscriptionExpiresAt,
      message: 'Assinatura ativa',
    };
  }),

  /**
   * Obtém o status atual do limite de alunos
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    return checkStudentLimit(personal.id);
  }),

  /**
   * Obtém informações completas da subscription
   */
  info: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const info = await getSubscriptionInfo(personal.id);
    
    if (!info) {
      // Se não tem subscription, retornar info do trial
      const status = await checkStudentLimit(personal.id);
      return {
        personalId: personal.id,
        planId: 'fitprime_br_starter',
        planName: 'Starter (Trial)',
        status: 'trial',
        studentLimit: status.studentLimit,
        currentStudents: status.currentStudents,
        extraStudents: status.exceededBy,
        planPrice: 97,
        extraStudentPrice: EXTRA_STUDENT_BR.pricePerStudent,
        totalMonthlyPrice: 97 + (status.exceededBy * EXTRA_STUDENT_BR.pricePerStudent),
        currency: 'BRL' as const,
        country: 'BR' as const,
        trialEndsAt: null,
        currentPeriodEnd: null,
        isTrial: true,
      };
    }
    
    return { ...info, isTrial: info.status === 'trial' };
  }),

  /**
   * Verifica se pode adicionar um novo aluno
   */
  canAddStudent: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    return canAddStudent(personal.id);
  }),

  /**
   * Obtém sugestão de upgrade de plano
   */
  upgradeSuggestion: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    return getUpgradeSuggestion(personal.id);
  }),

  /**
   * Lista todos os planos disponíveis
   */
  plans: protectedProcedure
    .input(z.object({
      country: z.enum(['BR', 'US']).default('BR'),
    }).optional())
    .query(({ input }) => {
      const country = input?.country || 'BR';
      return getAvailablePlans(country);
    }),

  /**
   * Calcula o preço mensal baseado no número de alunos
   */
  calculatePrice: protectedProcedure
    .input(z.object({
      planId: z.string(),
      studentCount: z.number(),
      country: z.enum(['BR', 'US']).default('BR'),
    }))
    .query(({ input }) => {
      return calculateMonthlyPrice(input.planId, input.studentCount, input.country);
    }),

  /**
   * Atualiza o plano do personal (upgrade/downgrade)
   */
  updatePlan: protectedProcedure
    .input(z.object({
      planId: z.string(),
      country: z.enum(['BR', 'US']).default('BR'),
    }))
    .mutation(async ({ ctx, input }) => {
      const personal = await getPersonal(ctx.user.id);
      
      // Verificar se o plano existe
      const plan = PLANS_BR.find(p => p.id === input.planId);
      if (!plan) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Plano não encontrado' });
      }
      
      // Verificar se o plano comporta os alunos atuais
      const status = await checkStudentLimit(personal.id);
      if (status.currentStudents > plan.studentLimit) {
        // Permitir downgrade mas avisar sobre cobrança extra
        const extraCost = (status.currentStudents - plan.studentLimit) * EXTRA_STUDENT_BR.pricePerStudent;
        console.log(`Personal ${personal.id} fazendo downgrade com ${status.currentStudents - plan.studentLimit} alunos extras. Custo extra: ${formatPrice(extraCost, 'BRL')}`);
      }
      
      await createOrUpdateSubscription(personal.id, input.planId, input.country);
      
      return {
        success: true,
        message: `Plano atualizado para ${plan.name}`,
        newPlan: plan,
      };
    }),

  /**
   * Sincroniza a contagem de alunos (chamado após adicionar/remover aluno)
   */
  syncStudentCount: protectedProcedure.mutation(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    return updateStudentCount(personal.id);
  }),

  /**
   * Obtém o resumo de uso para exibir no dashboard
   */
  usageSummary: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const status = await checkStudentLimit(personal.id);
    const info = await getSubscriptionInfo(personal.id);
    
    const usagePercentage = status.studentLimit > 0 
      ? Math.round((status.currentStudents / status.studentLimit) * 100)
      : 0;
    
    let statusMessage = '';
    let statusType: 'success' | 'warning' | 'error' = 'success';
    
    if (status.status === 'exceeded') {
      statusType = 'warning';
      statusMessage = `Você tem ${status.exceededBy} aluno(s) acima do limite. ` +
                      `Custo adicional: ${formatPrice(status.extraCost, 'BRL')}/mês`;
    } else if (status.status === 'at_limit') {
      statusType = 'warning';
      statusMessage = 'Você atingiu o limite de alunos do seu plano. ' +
                      'Novos alunos serão cobrados como extras.';
    } else {
      statusMessage = `Você pode adicionar mais ${status.studentLimit - status.currentStudents} aluno(s) sem custo adicional.`;
    }
    
    return {
      planName: status.currentPlan?.name || 'Trial',
      studentLimit: status.studentLimit,
      currentStudents: status.currentStudents,
      extraStudents: status.exceededBy,
      usagePercentage,
      extraCost: status.extraCost,
      totalMonthlyCost: (status.currentPlan?.price || 97) + status.extraCost,
      currency: 'BRL' as const,
      statusType,
      statusMessage,
      suggestedUpgrade: status.suggestedUpgrade,
    };
  }),

  /**
   * Obtém resumo de cobrança do período atual
   */
  billingSummary: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    return getBillingPeriodSummary(personal.id);
  }),

  /**
   * Calcula cobranças de alunos extras (para preview)
   */
  calculateExtraCharges: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const status = await checkStudentLimit(personal.id);
    
    return {
      extraStudents: status.exceededBy,
      pricePerStudent: EXTRA_STUDENT_BR.pricePerStudent,
      totalExtraCost: status.extraCost,
      currency: 'BRL' as const,
    };
  }),

  /**
   * Calcula o proration para upgrade de plano
   */
  calculateUpgradeProration: protectedProcedure
    .input(z.object({
      newPlanId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const personal = await getPersonal(ctx.user.id);
      const info = await getSubscriptionInfo(personal.id);
      
      if (!info) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Assinatura não encontrada' });
      }
      
      // Determinar período de cobrança baseado no status atual
      const billingPeriod: BillingPeriod = personal.subscriptionPeriod === 'annual' ? 'annual' : 'monthly';
      
      // Mapear planId do pricing.ts para plans.ts
      const planMapping: Record<string, string> = {
        'fitprime_br_starter': 'starter',
        'fitprime_br_growth': 'pro',
        'fitprime_br_pro': 'business',
        'fitprime_br_scale': 'premium',
        'fitprime_br_advanced': 'enterprise',
      };
      
      const currentPlanId = planMapping[info.planId] || 'starter';
      
      // Validar upgrade
      const validation = validateUpgrade(currentPlanId, input.newPlanId, info.currentStudents);
      if (!validation.valid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: validation.reason });
      }
      
      // Calcular proration
      const subscriptionStart = info.currentPeriodEnd 
        ? new Date(new Date(info.currentPeriodEnd).getTime() - (billingPeriod === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
        : new Date(personal.createdAt);
      
      const calculation = calculateProration(
        currentPlanId,
        input.newPlanId,
        billingPeriod,
        subscriptionStart,
        info.currentPeriodEnd || undefined
      );
      
      if (!calculation) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não foi possível calcular o upgrade' });
      }
      
      return {
        ...calculation,
        currentPlan: {
          id: calculation.currentPlan.id,
          name: calculation.currentPlan.name,
          price: calculation.currentPlan.price,
          studentLimit: calculation.currentPlan.studentLimit,
        },
        newPlan: {
          id: calculation.newPlan.id,
          name: calculation.newPlan.name,
          price: calculation.newPlan.price,
          studentLimit: calculation.newPlan.studentLimit,
          checkoutUrl: calculation.newPlan.checkoutUrl,
        },
      };
    }),

  /**
   * Lista todos os upgrades disponíveis com proration calculado
   */
  availableUpgrades: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const info = await getSubscriptionInfo(personal.id);
    
    if (!info) {
      // Se não tem subscription, retornar todos os planos
      return Object.values(PLANS).map(plan => ({
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        studentLimit: plan.studentLimit,
        checkoutUrl: plan.checkoutUrl,
        prorationAmount: plan.price, // Valor cheio
        priceDifference: plan.price,
        daysRemaining: 0,
        percentageRemaining: 0,
        additionalStudents: plan.studentLimit,
        isProrated: false,
        billingPeriod: 'monthly' as BillingPeriod,
      }));
    }
    
    const billingPeriod: BillingPeriod = personal.subscriptionPeriod === 'annual' ? 'annual' : 'monthly';
    
    // Mapear planId
    const planMapping: Record<string, string> = {
      'fitprime_br_starter': 'starter',
      'fitprime_br_growth': 'pro',
      'fitprime_br_pro': 'business',
      'fitprime_br_scale': 'premium',
      'fitprime_br_advanced': 'enterprise',
    };
    
    const currentPlanId = planMapping[info.planId] || 'starter';
    
    const subscriptionStart = info.currentPeriodEnd 
      ? new Date(new Date(info.currentPeriodEnd).getTime() - (billingPeriod === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
      : new Date(personal.createdAt);
    
    const upgrades = getAvailableUpgrades(
      currentPlanId,
      billingPeriod,
      subscriptionStart,
      info.currentPeriodEnd || undefined
    );
    
    return upgrades.map(calc => ({
      planId: calc.newPlan.id,
      planName: calc.newPlan.name,
      price: calc.newPlan.price,
      studentLimit: calc.newPlan.studentLimit,
      checkoutUrl: calc.newPlan.checkoutUrl,
      prorationAmount: calc.prorationAmount,
      priceDifference: calc.priceDifference,
      daysRemaining: calc.daysRemaining,
      percentageRemaining: calc.percentageRemaining,
      additionalStudents: calc.additionalStudents,
      isProrated: true,
      billingPeriod: calc.billingPeriod,
    }));
  }),

  /**
   * Obtém informações do plano atual para exibição
   */
  currentPlanDetails: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    const info = await getSubscriptionInfo(personal.id);
    
    const billingPeriod: BillingPeriod = personal.subscriptionPeriod === 'annual' ? 'annual' : 'monthly';
    
    // Mapear planId
    const planMapping: Record<string, string> = {
      'fitprime_br_starter': 'starter',
      'fitprime_br_growth': 'pro',
      'fitprime_br_pro': 'business',
      'fitprime_br_scale': 'premium',
      'fitprime_br_advanced': 'enterprise',
    };
    
    const currentPlanId = info ? (planMapping[info.planId] || 'starter') : 'starter';
    const currentPlan = PLANS[currentPlanId];
    
    if (!currentPlan) {
      return null;
    }
    
    // Calcular dias restantes
    let daysRemaining = 0;
    let currentPeriodEnd: Date | null = null;
    
    if (info?.currentPeriodEnd) {
      currentPeriodEnd = new Date(info.currentPeriodEnd);
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / msPerDay));
    }
    
    return {
      planId: currentPlan.id,
      planName: currentPlan.name,
      price: billingPeriod === 'annual' ? currentPlan.annualPrice : currentPlan.price,
      monthlyPrice: billingPeriod === 'annual' ? currentPlan.annualMonthlyPrice : currentPlan.price,
      studentLimit: billingPeriod === 'annual' ? currentPlan.annualStudentLimit : currentPlan.studentLimit,
      billingPeriod,
      daysRemaining,
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      features: currentPlan.features,
      checkoutUrl: currentPlan.checkoutUrl,
      annualCheckoutUrl: currentPlan.annualCheckoutUrl,
    };
  }),
});

export type SubscriptionRouter = typeof subscriptionRouter;
