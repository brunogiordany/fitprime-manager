import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Planos e limites de alunos
 * Baseado na estratégia de precificação
 */
const PLAN_CONFIG = {
  fitprime_br_starter: { limit: 15, extraPrice: 6.47, name: "Starter" },
  fitprime_br_pro: { limit: 25, extraPrice: 5.88, name: "Pro" },
  fitprime_br_business: { limit: 40, extraPrice: 4.93, name: "Business" },
  fitprime_br_premium: { limit: 70, extraPrice: 4.24, name: "Premium" },
  fitprime_br_enterprise: { limit: 150, extraPrice: 3.31, name: "Enterprise" },
} as const;

type PlanId = keyof typeof PLAN_CONFIG;

function getPlanConfig(planId: string): (typeof PLAN_CONFIG)[PlanId] | null {
  const normalized = planId.toLowerCase() as PlanId;
  return PLAN_CONFIG[normalized] || null;
}

export const extraChargesRouter = router({
  /**
   * Calcular cobranças extras baseado no número de alunos
   */
  calculate: protectedProcedure.query(async ({ ctx }) => {
    try {
      const personal = await db.getPersonalByUserId(ctx.user.id);
      if (!personal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personal não encontrado",
        });
      }

      const subscription = await db.getPersonalSubscription(personal.id);
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assinatura não encontrada",
        });
      }

      const planConfig = getPlanConfig(subscription.planId);
      if (!planConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Plano inválido: ${subscription.planId}`,
        });
      }

      // Contar alunos ativos
      const activeStudents = await db.getActiveStudentsCount(personal.id);

      // Calcular alunos excedentes
      const extraStudents = Math.max(0, activeStudents - planConfig.limit);
      const newExtraCharge = extraStudents * planConfig.extraPrice;
      const accumulatedCharge = subscription.accumulatedExtraCharge ? Number(subscription.accumulatedExtraCharge) : 0;
      const totalAccumulated = accumulatedCharge + newExtraCharge;

      // Próxima data de cobrança
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      return {
        currentStudents: activeStudents,
        studentLimit: planConfig.limit,
        extraStudents,
        extraStudentPrice: planConfig.extraPrice,
        totalExtraCharge: newExtraCharge,
        accumulatedCharge: totalAccumulated,
        nextBillingDate,
        planName: planConfig.name,
      };
    } catch (error) {
      console.error("[extraChargesRouter.calculate]", error);
      throw error;
    }
  }),

  /**
   * Obter relatório completo de cobranças extras
   */
  getReport: protectedProcedure.query(async ({ ctx }) => {
    try {
      const personal = await db.getPersonalByUserId(ctx.user.id);
      if (!personal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personal não encontrado",
        });
      }

      const subscription = await db.getPersonalSubscription(personal.id);
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assinatura não encontrada",
        });
      }

      const planConfig = getPlanConfig(subscription.planId);
      if (!planConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Plano inválido: ${subscription.planId}`,
        });
      }

      const activeStudents = await db.getActiveStudentsCount(personal.id);
      const extraStudents = Math.max(0, activeStudents - planConfig.limit);
      const newExtraCharge = extraStudents * planConfig.extraPrice;
      const accumulatedCharge = subscription.accumulatedExtraCharge ? Number(subscription.accumulatedExtraCharge) : 0;
      const totalAccumulated = accumulatedCharge + newExtraCharge;

      // Determinar se deve recomendar upgrade
      const percentageOverLimit = (extraStudents / planConfig.limit) * 100;
      const planPrice = Number(subscription.planPrice);
      const accumulatedPercentageOfPlan = (totalAccumulated / planPrice) * 100;
      const shouldRecommendUpgrade = percentageOverLimit > 10 || accumulatedPercentageOfPlan > 50;

      // Sugerir próximo plano
      let upgradeSuggestion = null;
      if (shouldRecommendUpgrade) {
        const planOrder: PlanId[] = [
          "fitprime_br_starter",
          "fitprime_br_pro",
          "fitprime_br_business",
          "fitprime_br_premium",
          "fitprime_br_enterprise",
        ];
        const currentIndex = planOrder.indexOf(subscription.planId as PlanId);

        if (currentIndex !== -1 && currentIndex < planOrder.length - 1) {
          const nextPlanId = planOrder[currentIndex + 1];
          const nextPlanConfig = getPlanConfig(nextPlanId);

          if (nextPlanConfig) {
            const newExtraStudentsIfUpgrade = Math.max(0, activeStudents - nextPlanConfig.limit);
            const newExtraChargeIfUpgrade = newExtraStudentsIfUpgrade * nextPlanConfig.extraPrice;
            const savings = newExtraCharge - newExtraChargeIfUpgrade;

            upgradeSuggestion = {
              nextPlanId,
              nextPlanName: nextPlanConfig.name,
              savings: Math.max(0, savings),
              savingsPercentage: savings > 0 ? ((savings / newExtraCharge) * 100).toFixed(0) : "0",
            };
          }
        }
      }

      // Gerar resumo
      let summary = "";
      if (extraStudents === 0) {
        summary = `✅ Nenhum aluno excedente. Você tem ${activeStudents}/${planConfig.limit} alunos.`;
      } else {
        summary = `⚠️ ALUNOS EXCEDENTES DETECTADOS\n\nLimite do plano: ${planConfig.limit} alunos\nAlunos ativos: ${activeStudents}\nAlunos excedentes: ${extraStudents}\n\nPreço por aluno extra: R$ ${planConfig.extraPrice.toFixed(2)}\nCobrança desta vez: R$ ${newExtraCharge.toFixed(2)}\nAcumulado para próxima fatura: R$ ${accumulatedCharge.toFixed(2)}`;
      }

      return {
        currentStudents: activeStudents,
        studentLimit: planConfig.limit,
        extraStudents,
        extraStudentPrice: planConfig.extraPrice,
        totalExtraCharge: newExtraCharge,
        accumulatedCharge,
        planName: planConfig.name,
        summary,
        shouldRecommendUpgrade,
        upgradeSuggestion,
      };
    } catch (error) {
      console.error("[extraChargesRouter.getReport]", error);
      throw error;
    }
  }),

  /**
   * Atualizar acúmulo de cobranças (chamado quando aluno é adicionado/removido)
   */
  updateAccumulation: protectedProcedure
    .input(
      z.object({
        extraCharge: z.number().min(0),
        extraStudents: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const personal = await db.getPersonalByUserId(ctx.user.id);
        if (!personal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Personal não encontrado",
          });
        }

        const subscription = await db.getPersonalSubscription(personal.id);
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assinatura não encontrada",
          });
        }

        // Atualizar acúmulo
        await db.updatePersonalSubscriptionExtra(personal.id, {
          accumulatedExtraCharge: input.extraCharge.toString(),
          accumulatedExtraStudents: input.extraStudents,
        });

        // Registrar no log de uso
        await db.logSubscriptionUsage({
          personalId: personal.id,
          subscriptionId: subscription.id,
          eventType: "extra_charged",
          newValue: input.extraStudents,
          chargeAmount: input.extraCharge.toString(),
          currency: subscription.currency,
          details: JSON.stringify({
            accumulatedCharge: input.extraCharge,
            accumulatedStudents: input.extraStudents,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error("[extraChargesRouter.updateAccumulation]", error);
        throw error;
      }
    }),

  /**
   * Resetar acúmulo (chamado após cobrança na renovação)
   */
  resetAccumulation: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const personal = await db.getPersonalByUserId(ctx.user.id);
      if (!personal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personal não encontrado",
        });
      }

      const subscription = await db.getPersonalSubscription(personal.id);
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assinatura não encontrada",
        });
      }

      // Resetar acúmulo
      await db.updatePersonalSubscriptionExtra(personal.id, {
        accumulatedExtraCharge: "0",
        accumulatedExtraStudents: 0,
        lastAccumulationReset: new Date(),
      });

      // Registrar no log
      await db.logSubscriptionUsage({
        personalId: personal.id,
        subscriptionId: subscription.id,
        eventType: "extra_charged",
        newValue: 0,
        chargeAmount: "0",
        currency: subscription.currency,
        details: JSON.stringify({
          action: "reset_accumulation",
          resetAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (error) {
      console.error("[extraChargesRouter.resetAccumulation]", error);
      throw error;
    }
  }),

  /**
   * Obter histórico de cobranças extras
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const personal = await db.getPersonalByUserId(ctx.user.id);
        if (!personal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Personal não encontrado",
          });
        }

        const logs = await db.getSubscriptionUsageLogs(personal.id, input.limit);

        return logs
          .filter((log) => log.eventType === "extra_charged")
          .map((log) => ({
            id: log.id,
            date: log.createdAt,
            chargeAmount: log.chargeAmount,
            extraStudents: log.newValue,
            details: log.details ? JSON.parse(log.details) : null,
          }));
      } catch (error) {
        console.error("[extraChargesRouter.getHistory]", error);
        throw error;
      }
    }),
});
