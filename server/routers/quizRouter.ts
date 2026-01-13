import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, desc, and, gte, lte, count, eq } from "drizzle-orm";

// Schema para salvar resposta do quiz - usando campos da tabela existente
const saveQuizResponseSchema = z.object({
  visitorId: z.string(),
  sessionId: z.string(),
  
  // Dados de contato do lead (capturados antes do quiz)
  leadName: z.string().optional(),
  leadEmail: z.string().optional(),
  leadPhone: z.string().optional(),
  leadCity: z.string().optional(),
  
  // Respostas individuais
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
      
      // Inserir usando SQL direto para garantir compatibilidade com a tabela existente
      const result = await db.execute(sql`
        INSERT INTO quiz_responses (
          visitorId, sessionId, answers, 
          leadName, leadEmail, leadPhone, leadCity,
          studentsCount, revenue, managementPain, timePain, retentionPain, billingPain, priority,
          allAnswers, recommendedProfile, recommendedPlan, totalScore, identifiedPains,
          isQualified, disqualificationReason,
          utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer, landingPage,
          userAgent, deviceType, browser, os, completedAt, createdAt
        ) VALUES (
          ${input.visitorId}, ${input.sessionId}, ${JSON.stringify(input.allAnswers || {})},
          ${input.leadName || null}, ${input.leadEmail || null}, ${input.leadPhone || null}, ${input.leadCity || null},
          ${input.studentsCount || null}, ${input.revenue || null}, ${input.managementPain || null}, 
          ${input.timePain || null}, ${input.retentionPain || null}, ${input.billingPain || null}, ${input.priority || null},
          ${JSON.stringify(input.allAnswers || {})}, ${input.recommendedProfile || null}, ${input.recommendedPlan || null}, 
          ${input.totalScore || null}, ${JSON.stringify(input.identifiedPains || [])},
          ${input.isQualified ? 1 : 0}, ${input.disqualificationReason || null},
          ${input.utmSource || null}, ${input.utmMedium || null}, ${input.utmCampaign || null}, 
          ${input.utmContent || null}, ${input.utmTerm || null}, ${input.referrer || null}, ${input.landingPage || null},
          ${input.userAgent || null}, ${input.deviceType || null}, ${input.browser || null}, ${input.os || null},
          NOW(), NOW()
        )
      `);
      
      return { success: true, id: (result as any)[0]?.insertId };
    }),

  // Atualizar conversão (público)
  updateConversion: publicProcedure
    .input(z.object({
      visitorId: z.string(),
      converted: z.boolean().optional(),
      conversionType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.execute(sql`
        UPDATE quiz_responses 
        SET converted = ${input.converted ? 1 : 0}, 
            conversionType = ${input.conversionType || null},
            convertedAt = ${input.converted ? sql`NOW()` : sql`NULL`}
        WHERE visitorId = ${input.visitorId}
      `);
      
      return { success: true };
    }),

  // Buscar resposta por ID (admin)
  getResponseById: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [response] = await db.execute(sql`
        SELECT * FROM quiz_responses WHERE id = ${input.id}
      `);
      
      return (response as any)[0] || null;
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let whereClause = sql`1=1`;
      
      if (input.startDate) {
        whereClause = sql`${whereClause} AND createdAt >= ${input.startDate}`;
      }
      if (input.endDate) {
        whereClause = sql`${whereClause} AND createdAt <= ${input.endDate}`;
      }
      if (input.profile) {
        whereClause = sql`${whereClause} AND recommendedProfile = ${input.profile}`;
      }
      if (input.isQualified !== undefined) {
        whereClause = sql`${whereClause} AND isQualified = ${input.isQualified ? 1 : 0}`;
      }
      
      const responses = await db.execute(sql`
        SELECT * FROM quiz_responses 
        WHERE ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      
      const [totalResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM quiz_responses WHERE ${whereClause}
      `);
      
      const total = (totalResult as any)?.count || 0;
      
      return {
        responses: (responses as any)[0] || [],
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Estatísticas do funil (admin)
  getFunnelStats: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let whereClause = sql`1=1`;
      
      if (input.startDate) {
        whereClause = sql`${whereClause} AND createdAt >= ${input.startDate}`;
      }
      if (input.endDate) {
        whereClause = sql`${whereClause} AND createdAt <= ${input.endDate}`;
      }
      
      // Total de respostas
      const [totalResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM quiz_responses WHERE ${whereClause}
      `);
      const total = (totalResult as any)?.count || 0;
      
      // Qualificados
      const [qualifiedResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM quiz_responses WHERE ${whereClause} AND isQualified = 1
      `);
      const qualified = (qualifiedResult as any)?.count || 0;
      
      // Desqualificados
      const disqualified = total - qualified;
      
      // Convertidos
      const [convertedResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM quiz_responses WHERE ${whereClause} AND converted = 1
      `);
      const converted = (convertedResult as any)?.count || 0;
      
      // Distribuição por perfil
      const profileDistribution = await db.execute(sql`
        SELECT recommendedProfile as profile, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND recommendedProfile IS NOT NULL
        GROUP BY recommendedProfile
      `);
      
      // Distribuição por prioridade
      const painDistribution = await db.execute(sql`
        SELECT priority as pain, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND priority IS NOT NULL
        GROUP BY priority
      `);
      
      // Distribuição por quantidade de alunos
      const studentsDistribution = await db.execute(sql`
        SELECT studentsCount as students, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND studentsCount IS NOT NULL
        GROUP BY studentsCount
      `);
      
      // Distribuição por renda
      const revenueDistribution = await db.execute(sql`
        SELECT revenue, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND revenue IS NOT NULL
        GROUP BY revenue
      `);
      
      // Distribuição por dispositivo
      const deviceDistribution = await db.execute(sql`
        SELECT deviceType as device, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND deviceType IS NOT NULL
        GROUP BY deviceType
      `);
      
      // Distribuição por fonte UTM
      const sourceDistribution = await db.execute(sql`
        SELECT utmSource as source, COUNT(*) as count 
        FROM quiz_responses 
        WHERE ${whereClause} AND utmSource IS NOT NULL
        GROUP BY utmSource
      `);
      
      return {
        funnel: {
          total,
          qualified,
          disqualified,
          converted,
        },
        conversionRates: {
          qualificationRate: total > 0 ? (qualified / total * 100).toFixed(1) : "0",
          conversionRate: qualified > 0 ? (converted / qualified * 100).toFixed(1) : "0",
        },
        distributions: {
          profile: (profileDistribution as any)[0] || [],
          pain: (painDistribution as any)[0] || [],
          students: (studentsDistribution as any)[0] || [],
          revenue: (revenueDistribution as any)[0] || [],
          device: (deviceDistribution as any)[0] || [],
          source: (sourceDistribution as any)[0] || [],
        },
      };
    }),

  // Respostas por dia (admin) - para gráfico de tendência
  getResponsesByDay: adminProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const responses = await db.execute(sql`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as total,
          SUM(CASE WHEN isQualified = 1 THEN 1 ELSE 0 END) as qualified,
          SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted
        FROM quiz_responses 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt)
      `);
      
      return (responses as any)[0] || [];
    }),
});
