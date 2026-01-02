import { z } from "zod";
import { ownerProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { eq, desc, gte, lte, and } from "drizzle-orm";

export const adminExtraChargesRouter = router({
  /**
   * Listar todas as cobranças extras com filtros
   */
  listCharges: ownerProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        personalId: z.number().optional(),
        minAmount: z.number().min(0).optional(),
        maxAmount: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await db.getAllSubscriptionUsageLogs(1000); // Pegar muitos para filtrar

        // Filtrar por tipo de evento
        let filtered = logs.filter((log) => log.eventType === "extra_charged");

        // Filtrar por período
        if (input.startDate) {
          filtered = filtered.filter((log) => log.createdAt >= input.startDate!);
        }
        if (input.endDate) {
          filtered = filtered.filter((log) => {
            const endOfDay = new Date(input.endDate!);
            endOfDay.setHours(23, 59, 59, 999);
            return log.createdAt <= endOfDay;
          });
        }

        // Filtrar por personal
        if (input.personalId) {
          filtered = filtered.filter((log) => log.personalId === input.personalId);
        }

        // Filtrar por valor
        if (input.minAmount !== undefined) {
          filtered = filtered.filter((log) => {
            const amount = log.chargeAmount ? Number(log.chargeAmount) : 0;
            return amount >= input.minAmount!;
          });
        }
        if (input.maxAmount !== undefined) {
          filtered = filtered.filter((log) => {
            const amount = log.chargeAmount ? Number(log.chargeAmount) : 0;
            return amount <= input.maxAmount!;
          });
        }

        // Aplicar paginação
        const total = filtered.length;
        const charges = filtered.slice(input.offset, input.offset + input.limit);

        // Enriquecer com dados do personal
        const allPersonals = await db.getAllPersonals();
        const enriched = await Promise.all(
          charges.map(async (charge) => {
            const personal = allPersonals.find((p) => p.id === charge.personalId);
            const subscription = await db.getPersonalSubscription(charge.personalId);

            return {
              id: charge.id,
              personalId: charge.personalId,
              personalName: personal?.businessName || `Personal #${charge.personalId}`,
              planName: subscription?.planName || "N/A",
              chargeAmount: charge.chargeAmount ? Number(charge.chargeAmount) : 0,
              extraStudents: charge.newValue || 0,
              createdAt: charge.createdAt,
              details: charge.details ? JSON.parse(charge.details) : null,
            };
          })
        );

        return {
          charges: enriched,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[adminExtraChargesRouter.listCharges]", error);
        throw error;
      }
    }),

  /**
   * Obter estatísticas de cobranças extras
   */
  getStats: ownerProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await db.getAllSubscriptionUsageLogs(10000);

        // Filtrar por tipo e período
        let filtered = logs.filter((log) => log.eventType === "extra_charged");

        if (input.startDate) {
          filtered = filtered.filter((log) => log.createdAt >= input.startDate!);
        }
        if (input.endDate) {
          filtered = filtered.filter((log) => {
            const endOfDay = new Date(input.endDate!);
            endOfDay.setHours(23, 59, 59, 999);
            return log.createdAt <= endOfDay;
          });
        }

        // Calcular estatísticas
        const totalCharges = filtered.length;
        const totalAmount = filtered.reduce((sum, log) => sum + (log.chargeAmount ? Number(log.chargeAmount) : 0), 0);
        const averageCharge = totalCharges > 0 ? totalAmount / totalCharges : 0;

        // Agrupar por personal
        const byPersonal = new Map<number, { count: number; amount: number }>();
        filtered.forEach((log) => {
          const current = byPersonal.get(log.personalId) || { count: 0, amount: 0 };
          byPersonal.set(log.personalId, {
            count: current.count + 1,
            amount: current.amount + (log.chargeAmount ? Number(log.chargeAmount) : 0),
          });
        });

        // Top 10 personals por valor cobrado
        const allPersonals = await db.getAllPersonals();
        const topPersonals = await Promise.all(
          Array.from(byPersonal.entries())
            .sort((a, b) => b[1].amount - a[1].amount)
            .slice(0, 10)
            .map(async ([personalId, stats]) => {
              const personal = allPersonals.find((p) => p.id === personalId);
            return {
              personalId,
              personalName: personal?.businessName || `Personal #${personalId}` || "N/A",
              chargesCount: stats.count,
              totalAmount: stats.amount,
              averageCharge: stats.amount / stats.count,
            };
            })
        );

        // Agrupar por mês
        const byMonth = new Map<string, { count: number; amount: number }>();
        filtered.forEach((log) => {
          const month = log.createdAt.toISOString().substring(0, 7); // YYYY-MM
          const current = byMonth.get(month) || { count: 0, amount: 0 };
          byMonth.set(month, {
            count: current.count + 1,
            amount: current.amount + (log.chargeAmount ? Number(log.chargeAmount) : 0),
          });
        });

        const chargesByMonth = Array.from(byMonth.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, stats]) => ({
            month,
            chargesCount: stats.count,
            totalAmount: stats.amount,
            averageCharge: stats.amount / stats.count,
          }));

        return {
          totalCharges,
          totalAmount,
          averageCharge,
          uniquePersonals: byPersonal.size,
          topPersonals,
          chargesByMonth,
        };
      } catch (error) {
        console.error("[adminExtraChargesRouter.getStats]", error);
        throw error;
      }
    }),

  /**
   * Obter detalhes de cobranças de um personal específico
   */
  getPersonalCharges: ownerProcedure
    .input(
      z.object({
        personalId: z.number(),
        limit: z.number().min(1).max(1000).default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await db.getAllSubscriptionUsageLogs(input.limit);

        const filtered = logs
          .filter((log) => log.personalId === input.personalId && log.eventType === "extra_charged")
          .slice(0, input.limit);

        const allPersonals = await db.getAllPersonals();
        const personal = allPersonals.find((p) => p.id === input.personalId);
        const subscription = await db.getPersonalSubscription(input.personalId);
        const user = personal?.userId ? await db.getUserById(personal.userId) : null;

        return {
          personal: {
            id: personal?.id,
            name: personal?.businessName || `Personal #${input.personalId}`,
            email: user?.email || "N/A",
          },
          subscription: {
            planName: subscription?.planName,
            planPrice: subscription?.planPrice,
            currentStudents: subscription?.currentStudents,
            studentLimit: subscription?.studentLimit,
            accumulatedExtraCharge: subscription?.accumulatedExtraCharge,
          },
          charges: filtered.map((log) => ({
            id: log.id,
            chargeAmount: log.chargeAmount ? Number(log.chargeAmount) : 0,
            extraStudents: log.newValue || 0,
            createdAt: log.createdAt,
            details: log.details ? JSON.parse(log.details) : null,
          })),
        };
      } catch (error) {
        console.error("[adminExtraChargesRouter.getPersonalCharges]", error);
        throw error;
      }
    }),

  /**
   * Exportar relatório de cobranças extras (CSV)
   */
  exportReport: ownerProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await db.getAllSubscriptionUsageLogs(10000);

        let filtered = logs.filter((log) => log.eventType === "extra_charged");

        if (input.startDate) {
          filtered = filtered.filter((log) => log.createdAt >= input.startDate!);
        }
        if (input.endDate) {
          filtered = filtered.filter((log) => {
            const endOfDay = new Date(input.endDate!);
            endOfDay.setHours(23, 59, 59, 999);
            return log.createdAt <= endOfDay;
          });
        }

        // Enriquecer dados
        const allPersonals = await db.getAllPersonals();
        const data = await Promise.all(
          filtered.map(async (log) => {
            const personal = allPersonals.find((p) => p.id === log.personalId);
            const subscription = await db.getPersonalSubscription(log.personalId);

            return {
              date: log.createdAt.toISOString(),
              personalName: personal?.businessName || `Personal #${log.personalId}`,
              planName: subscription?.planName || "N/A",
              extraStudents: log.newValue || 0,
              chargeAmount: log.chargeAmount ? Number(log.chargeAmount) : 0,
            };
          })
        );

        // Gerar CSV
        const headers = ["Data", "Personal", "Plano", "Alunos Extras", "Valor Cobrado"];
        const rows = data.map((row) => [
          new Date(row.date).toLocaleDateString("pt-BR"),
          row.personalName,
          row.planName,
          row.extraStudents.toString(),
          `R$ ${row.chargeAmount.toFixed(2)}`,
        ]);

        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

        return {
          csv,
          filename: `cobranças-extras-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("[adminExtraChargesRouter.exportReport]", error);
        throw error;
      }
    }),
});
