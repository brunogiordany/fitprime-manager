import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, desc, and, gte, lte, count, eq } from "drizzle-orm";
import { sendEmail, EMAIL_SENDERS } from "../email";

// Função para enviar notificação de novo lead para o admin
async function sendNewLeadNotification(leadData: {
  id: number;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadCity?: string;
  studentsCount?: string;
  revenue?: string;
  landingPage?: string;
  isQualified: boolean;
}) {
  // Email do admin - você pode configurar isso em uma variável de ambiente
  const adminEmail = process.env.ADMIN_EMAIL || "contato@fitprimemanager.online";
  
  const studentsLabels: Record<string, string> = {
    "1-5": "1-5 alunos", "6-15": "6-15 alunos", "16-30": "16-30 alunos",
    "31-50": "31-50 alunos", "51-100": "51-100 alunos", "100+": "100+ alunos",
    "15": "6-15 alunos", "30": "16-30 alunos", "50": "31-50 alunos", "100": "51-100 alunos"
  };
  
  const revenueLabels: Record<string, string> = {
    "no_income": "Sem renda", "2k": "Até R$ 2k", "5k": "R$ 2k-5k",
    "10k": "R$ 5k-10k", "10k+": "Mais de R$ 10k", "15k+": "Mais de R$ 15k",
    "2000": "Até R$ 2k", "5000": "R$ 2k-5k", "10000": "R$ 5k-10k", "15000": "Mais de R$ 10k"
  };
  
  const subject = `🎯 Novo Lead do Quiz: ${leadData.leadName || "Anônimo"} - ${leadData.isQualified ? "QUALIFICADO" : "Não Qualificado"}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: ${leadData.isQualified ? "linear-gradient(135deg, #10b981, #14b8a6)" : "linear-gradient(135deg, #f59e0b, #f97316)"}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🎯</span>
        </div>
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Novo Lead do Quiz!</h1>
        <p style="color: ${leadData.isQualified ? "#10b981" : "#f59e0b"}; font-size: 14px; margin-top: 8px;">
          ${leadData.isQualified ? "✅ Lead Qualificado" : "⚠️ Lead Não Qualificado"}
        </p>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">Dados do Lead</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nome:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${leadData.leadName || "Não informado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${leadData.leadEmail || "Não informado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">WhatsApp:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${leadData.leadPhone || "Não informado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cidade:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${leadData.leadCity || "Não informado"}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #166534; margin: 0 0 16px 0; font-size: 16px;">Dados Financeiros</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #166534; font-size: 14px;">Quantidade de Alunos:</td>
            <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600;">${studentsLabels[leadData.studentsCount || ""] || leadData.studentsCount || "Não informado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #166534; font-size: 14px;">Renda Atual:</td>
            <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600;">${revenueLabels[leadData.revenue || ""] || leadData.revenue || "Não informado"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #166534; font-size: 14px;">Origem:</td>
            <td style="padding: 8px 0; color: #166534; font-size: 14px;">${leadData.landingPage || "Não informado"}</td>
          </tr>
        </table>
      </div>
      
      ${leadData.leadPhone ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/55${leadData.leadPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Vi que você fez o quiz do FitPrime e gostaria de conversar sobre como podemos ajudar seu negócio de personal trainer.")}" style="display: inline-block; background: linear-gradient(135deg, #25d366, #128c7e); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          📱 Enviar WhatsApp
        </a>
      </div>
      ` : ""}
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://fitprimemanager.com/admin/quiz/${leadData.id}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver Anamnese Completa
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Este email foi enviado automaticamente pelo FitPrime Manager.
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  try {
    await sendEmail({
      to: adminEmail,
      subject,
      html,
      from: EMAIL_SENDERS.sistema,
    });
    console.log(`[Quiz] Notificação de novo lead enviada para ${adminEmail}`);
  } catch (error) {
    console.error("[Quiz] Erro ao enviar notificação de novo lead:", error);
  }
}

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
      
      const insertId = (result as any)[0]?.insertId;
      
      // Enviar notificação por email para o admin (assíncrono, não bloqueia)
      sendNewLeadNotification({
        id: insertId,
        leadName: input.leadName,
        leadEmail: input.leadEmail,
        leadPhone: input.leadPhone,
        leadCity: input.leadCity,
        studentsCount: input.studentsCount,
        revenue: input.revenue,
        landingPage: input.landingPage,
        isQualified: input.isQualified,
      }).catch(err => console.error("[Quiz] Erro ao enviar notificação:", err));
      
      return { success: true, id: insertId };
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

  // Listar todos os leads com filtros avançados (admin)
  listLeads: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(25),
      search: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isQualified: z.enum(["all", "qualified", "disqualified"]).default("all"),
      converted: z.enum(["all", "converted", "not_converted"]).default("all"),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      landingPage: z.string().optional(),
      studentsCount: z.string().optional(),
      revenue: z.string().optional(),
      city: z.string().optional(),
      sortBy: z.enum(["createdAt", "leadName", "leadEmail", "studentsCount", "revenue"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Construir condições WHERE dinamicamente
      const conditions: string[] = ["1=1"];
      const params: any[] = [];
      
      if (input.search) {
        conditions.push("(leadName LIKE ? OR leadEmail LIKE ? OR leadPhone LIKE ?)");
        const searchTerm = `%${input.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (input.startDate) {
        conditions.push("createdAt >= ?");
        params.push(input.startDate);
      }
      
      if (input.endDate) {
        conditions.push("createdAt <= ?");
        params.push(input.endDate + " 23:59:59");
      }
      
      if (input.isQualified === "qualified") {
        conditions.push("isQualified = 1");
      } else if (input.isQualified === "disqualified") {
        conditions.push("isQualified = 0");
      }
      
      if (input.converted === "converted") {
        conditions.push("converted = 1");
      } else if (input.converted === "not_converted") {
        conditions.push("(converted = 0 OR converted IS NULL)");
      }
      
      if (input.utmSource) {
        conditions.push("utmSource = ?");
        params.push(input.utmSource);
      }
      
      if (input.utmMedium) {
        conditions.push("utmMedium = ?");
        params.push(input.utmMedium);
      }
      
      if (input.utmCampaign) {
        conditions.push("utmCampaign = ?");
        params.push(input.utmCampaign);
      }
      
      if (input.landingPage) {
        conditions.push("landingPage LIKE ?");
        params.push(`%${input.landingPage}%`);
      }
      
      if (input.studentsCount) {
        conditions.push("studentsCount = ?");
        params.push(input.studentsCount);
      }
      
      if (input.revenue) {
        conditions.push("revenue = ?");
        params.push(input.revenue);
      }
      
      if (input.city) {
        conditions.push("leadCity LIKE ?");
        params.push(`%${input.city}%`);
      }
      
      const whereClause = conditions.join(" AND ");
      const orderClause = `${input.sortBy} ${input.sortOrder.toUpperCase()}`;
      
      // Query principal - inclui info de personal vinculado
      const leads = await db.execute(sql`
        SELECT 
          qr.id, qr.visitorId, qr.sessionId,
          qr.leadName, qr.leadEmail, qr.leadPhone, qr.leadCity,
          qr.studentsCount, qr.revenue, qr.priority,
          qr.managementPain, qr.timePain, qr.retentionPain, qr.billingPain,
          qr.recommendedProfile, qr.recommendedPlan, qr.totalScore,
          qr.isQualified, qr.disqualificationReason,
          qr.converted, qr.conversionType, qr.convertedAt,
          qr.utmSource, qr.utmMedium, qr.utmCampaign, qr.utmContent, qr.utmTerm,
          qr.referrer, qr.landingPage,
          qr.deviceType, qr.browser, qr.os,
          qr.createdAt, qr.completedAt,
          p.id as personalId,
          p.subscriptionStatus as personalStatus,
          u.name as personalName
        FROM quiz_responses qr
        LEFT JOIN users u ON LOWER(qr.leadEmail) = LOWER(u.email)
        LEFT JOIN personals p ON u.id = p.userId
        ORDER BY qr.createdAt DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      
      // Contagem total
      const [countResult] = await db.execute(sql`SELECT COUNT(*) as count FROM quiz_responses`);
      const total = (countResult as any)?.count || 0;
      
      return {
        leads: (leads as any)?.[0] || [],
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Obter opções de filtro disponíveis (admin)
  getFilterOptions: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // UTM Sources
      const [sources] = await db.execute(sql`
        SELECT DISTINCT utmSource as value FROM quiz_responses 
        WHERE utmSource IS NOT NULL AND utmSource != ''
        ORDER BY utmSource
      `);
      
      // UTM Mediums
      const [mediums] = await db.execute(sql`
        SELECT DISTINCT utmMedium as value FROM quiz_responses 
        WHERE utmMedium IS NOT NULL AND utmMedium != ''
        ORDER BY utmMedium
      `);
      
      // UTM Campaigns
      const [campaigns] = await db.execute(sql`
        SELECT DISTINCT utmCampaign as value FROM quiz_responses 
        WHERE utmCampaign IS NOT NULL AND utmCampaign != ''
        ORDER BY utmCampaign
      `);
      
      // Landing Pages
      const [landingPages] = await db.execute(sql`
        SELECT DISTINCT landingPage as value FROM quiz_responses 
        WHERE landingPage IS NOT NULL AND landingPage != ''
        ORDER BY landingPage
      `);
      
      // Cidades
      const [cities] = await db.execute(sql`
        SELECT DISTINCT leadCity as value FROM quiz_responses 
        WHERE leadCity IS NOT NULL AND leadCity != ''
        ORDER BY leadCity
      `);
      
      return {
        sources: ((sources as any)?.[0] || []).map((s: any) => s.value) || [],
        mediums: ((mediums as any)?.[0] || []).map((m: any) => m.value) || [],
        campaigns: ((campaigns as any)?.[0] || []).map((c: any) => c.value) || [],
        landingPages: ((landingPages as any)?.[0] || []).map((l: any) => l.value) || [],
        cities: ((cities as any)?.[0] || []).map((c: any) => c.value) || [],
      };
    }),

  // Exportar leads para CSV (admin)
  exportLeads: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isQualified: z.enum(["all", "qualified", "disqualified"]).default("all"),
      converted: z.enum(["all", "converted", "not_converted"]).default("all"),
      utmSource: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions: string[] = ["1=1"];
      
      if (input.startDate) {
        conditions.push(`createdAt >= '${input.startDate}'`);
      }
      if (input.endDate) {
        conditions.push(`createdAt <= '${input.endDate} 23:59:59'`);
      }
      if (input.isQualified === "qualified") {
        conditions.push("isQualified = 1");
      } else if (input.isQualified === "disqualified") {
        conditions.push("isQualified = 0");
      }
      if (input.converted === "converted") {
        conditions.push("converted = 1");
      } else if (input.converted === "not_converted") {
        conditions.push("(converted = 0 OR converted IS NULL)");
      }
      if (input.utmSource) {
        conditions.push(`utmSource = '${input.utmSource}'`);
      }
      
      // Query simples para exportar todos os leads
      const leads = await db.execute(sql`
        SELECT 
          id, leadName, leadEmail, leadPhone, leadCity,
          studentsCount, revenue, priority,
          isQualified, converted,
          utmSource, utmMedium, utmCampaign,
          landingPage, deviceType,
          createdAt
        FROM quiz_responses 
        ORDER BY createdAt DESC
      `);
      
      return (leads as any)?.[0] || [];
    }),
});
