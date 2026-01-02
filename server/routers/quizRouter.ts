import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { quizResponses, quizAnalytics } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

// Schema para salvar resposta do quiz
const saveQuizResponseSchema = z.object({
  visitorId: z.string(),
  sessionId: z.string().optional(),
  
  // Respostas
  studentsCount: z.string().optional(),
  revenue: z.string().optional(),
  managementPain: z.string().optional(),
  timePain: z.string().optional(),
  retentionPain: z.string().optional(),
  billingPain: z.string().optional(),
  priority: z.string().optional(),
  allAnswers: z.record(z.string(), z.any()).optional(),
  
  // Resultado
  recommendedProfile: z.string().optional(),
  recommendedPlan: z.string().optional(),
  totalScore: z.number().optional(),
  identifiedPains: z.array(z.string()).optional(),
  
  // Qualificação
  isQualified: z.boolean().default(true),
  disqualificationReason: z.string().optional(),
  
  // UTM
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  
  // Dispositivo
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

export const quizRouter = router({
  // Salvar resposta do quiz (público)
  saveResponse: publicProcedure
    .input(saveQuizResponseSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(quizResponses).values({
        visitorId: input.visitorId,
        sessionId: input.sessionId,
        studentsCount: input.studentsCount,
        revenue: input.revenue,
        managementPain: input.managementPain,
        timePain: input.timePain,
        retentionPain: input.retentionPain,
        billingPain: input.billingPain,
        priority: input.priority,
        allAnswers: input.allAnswers ? JSON.stringify(input.allAnswers) : null,
        recommendedProfile: input.recommendedProfile,
        recommendedPlan: input.recommendedPlan,
        totalScore: input.totalScore,
        identifiedPains: input.identifiedPains ? JSON.stringify(input.identifiedPains) : null,
        isQualified: input.isQualified,
        disqualificationReason: input.disqualificationReason,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        referrer: input.referrer,
        landingPage: input.landingPage,
        userAgent: input.userAgent,
        deviceType: input.deviceType,
        browser: input.browser,
        os: input.os,
        completedAt: new Date(),
      });
      
      return { success: true, id: result.insertId };
    }),

  // Atualizar conversão (público)
  updateConversion: publicProcedure
    .input(z.object({
      visitorId: z.string(),
      viewedPricing: z.boolean().optional(),
      clickedCta: z.boolean().optional(),
      selectedPlan: z.string().optional(),
      convertedToTrial: z.boolean().optional(),
      convertedToPaid: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, any> = {};
      
      if (input.viewedPricing !== undefined) updateData.viewedPricing = input.viewedPricing;
      if (input.clickedCta !== undefined) updateData.clickedCta = input.clickedCta;
      if (input.selectedPlan !== undefined) updateData.selectedPlan = input.selectedPlan;
      if (input.convertedToTrial !== undefined) updateData.convertedToTrial = input.convertedToTrial;
      if (input.convertedToPaid !== undefined) updateData.convertedToPaid = input.convertedToPaid;
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(quizResponses)
        .set(updateData)
        .where(eq(quizResponses.visitorId, input.visitorId));
      
      return { success: true };
    }),

  // Listar respostas (admin)
  listResponses: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      profile: z.string().optional(),
      isQualified: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      let whereConditions = [];
      
      if (input.startDate) {
        whereConditions.push(gte(quizResponses.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        whereConditions.push(lte(quizResponses.createdAt, new Date(input.endDate)));
      }
      if (input.profile) {
        whereConditions.push(eq(quizResponses.recommendedProfile, input.profile));
      }
      if (input.isQualified !== undefined) {
        whereConditions.push(eq(quizResponses.isQualified, input.isQualified));
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const responses = await db.select()
        .from(quizResponses)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(quizResponses.createdAt))
        .limit(input.limit)
        .offset(offset);
      
      const [totalResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
      
      return {
        responses,
        total: totalResult.count,
        page: input.page,
        totalPages: Math.ceil(totalResult.count / input.limit),
      };
    }),

  // Estatísticas do funil (admin)
  getFunnelStats: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let whereConditions = [];
      
      if (input.startDate) {
        whereConditions.push(gte(quizResponses.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        whereConditions.push(lte(quizResponses.createdAt, new Date(input.endDate)));
      }
      
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Total de respostas
      const [totalResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause);
      
      // Qualificados
      const [qualifiedResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.isQualified, true)) : eq(quizResponses.isQualified, true));
      
      // Desqualificados
      const [disqualifiedResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.isQualified, false)) : eq(quizResponses.isQualified, false));
      
      // Viram preços
      const [viewedPricingResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.viewedPricing, true)) : eq(quizResponses.viewedPricing, true));
      
      // Clicaram CTA
      const [clickedCtaResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.clickedCta, true)) : eq(quizResponses.clickedCta, true));
      
      // Converteram trial
      const [trialResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.convertedToTrial, true)) : eq(quizResponses.convertedToTrial, true));
      
      // Converteram pago
      const [paidResult] = await db.select({ count: count() })
        .from(quizResponses)
        .where(whereClause ? and(whereClause, eq(quizResponses.convertedToPaid, true)) : eq(quizResponses.convertedToPaid, true));
      
      // Distribuição por perfil
      const profileDistribution = await db.select({
        profile: quizResponses.recommendedProfile,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.recommendedProfile);
      
      // Distribuição por dor (priority)
      const painDistribution = await db.select({
        pain: quizResponses.priority,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.priority);
      
      // Distribuição por quantidade de alunos
      const studentsDistribution = await db.select({
        students: quizResponses.studentsCount,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.studentsCount);
      
      // Distribuição por renda
      const revenueDistribution = await db.select({
        revenue: quizResponses.revenue,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.revenue);
      
      // Distribuição por dispositivo
      const deviceDistribution = await db.select({
        device: quizResponses.deviceType,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.deviceType);
      
      // Distribuição por fonte UTM
      const sourceDistribution = await db.select({
        source: quizResponses.utmSource,
        count: count(),
      })
        .from(quizResponses)
        .where(whereClause)
        .groupBy(quizResponses.utmSource);
      
      return {
        funnel: {
          total: totalResult.count,
          qualified: qualifiedResult.count,
          disqualified: disqualifiedResult.count,
          viewedPricing: viewedPricingResult.count,
          clickedCta: clickedCtaResult.count,
          convertedTrial: trialResult.count,
          convertedPaid: paidResult.count,
        },
        conversionRates: {
          qualificationRate: totalResult.count > 0 ? (qualifiedResult.count / totalResult.count * 100).toFixed(1) : "0",
          pricingViewRate: qualifiedResult.count > 0 ? (viewedPricingResult.count / qualifiedResult.count * 100).toFixed(1) : "0",
          ctaClickRate: viewedPricingResult.count > 0 ? (clickedCtaResult.count / viewedPricingResult.count * 100).toFixed(1) : "0",
          trialConversionRate: clickedCtaResult.count > 0 ? (trialResult.count / clickedCtaResult.count * 100).toFixed(1) : "0",
          paidConversionRate: trialResult.count > 0 ? (paidResult.count / trialResult.count * 100).toFixed(1) : "0",
        },
        distributions: {
          profile: profileDistribution,
          pain: painDistribution,
          students: studentsDistribution,
          revenue: revenueDistribution,
          device: deviceDistribution,
          source: sourceDistribution,
        },
      };
    }),

  // Respostas por dia (admin) - para gráfico de tendência
  getResponsesByDay: adminProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const responses = await db.select({
        date: sql<string>`DATE(${quizResponses.createdAt})`,
        total: count(),
        qualified: sql<number>`SUM(CASE WHEN ${quizResponses.isQualified} = true THEN 1 ELSE 0 END)`,
        converted: sql<number>`SUM(CASE WHEN ${quizResponses.convertedToTrial} = true THEN 1 ELSE 0 END)`,
      })
        .from(quizResponses)
        .where(gte(quizResponses.createdAt, startDate))
        .groupBy(sql`DATE(${quizResponses.createdAt})`)
        .orderBy(sql`DATE(${quizResponses.createdAt})`);
      
      return responses;
    }),
});
