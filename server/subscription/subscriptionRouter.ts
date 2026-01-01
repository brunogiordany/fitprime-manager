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
   */
  paymentStatus: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getPersonal(ctx.user.id);
    
    // Trial sempre é válido
    if (personal.subscriptionStatus === 'trial') {
      return {
        isValid: true,
        status: 'trial' as const,
        daysOverdue: 0,
        expiresAt: null,
        message: 'Período de teste ativo',
      };
    }
    
    // Cancelado ou expirado
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
    
    // Verificar data de expiração com 1 dia de tolerância
    if (personal.subscriptionExpiresAt) {
      const now = new Date();
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
});

export type SubscriptionRouter = typeof subscriptionRouter;
