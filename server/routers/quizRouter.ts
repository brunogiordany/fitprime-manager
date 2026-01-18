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
  leadInstagram: z.string().optional(),
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
          leadName, leadEmail, leadPhone, leadInstagram, leadCity,
          studentsCount, revenue, managementPain, timePain, retentionPain, billingPain, priority,
          allAnswers, recommendedProfile, recommendedPlan, totalScore, identifiedPains,
          isQualified, disqualificationReason,
          utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer, landingPage,
          userAgent, deviceType, browser, os, completedAt, createdAt
        ) VALUES (
          ${input.visitorId}, ${input.sessionId}, ${JSON.stringify(input.allAnswers || {})},
          ${input.leadName || null}, ${input.leadEmail || null}, ${input.leadPhone || null}, ${input.leadInstagram || null}, ${input.leadCity || null},
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
      
      // Verificar e mesclar leads duplicados automaticamente
      if (input.leadEmail || input.leadPhone) {
        try {
          // Buscar leads existentes com mesmo email ou telefone
          let existingLeads: any[] = [];
          
          if (input.leadEmail) {
            const emailMatches = await db.execute(sql`
              SELECT id FROM quiz_responses 
              WHERE leadEmail = ${input.leadEmail} 
              AND id != ${insertId} 
              AND mergedIntoId IS NULL
              ORDER BY createdAt ASC
            `);
            existingLeads = [...existingLeads, ...((emailMatches as any)[0] || [])];
          }
          
          if (input.leadPhone) {
            const phoneMatches = await db.execute(sql`
              SELECT id FROM quiz_responses 
              WHERE leadPhone = ${input.leadPhone} 
              AND id != ${insertId} 
              AND mergedIntoId IS NULL
              AND id NOT IN (${sql.raw(existingLeads.map((l: any) => l.id).join(',') || '0')})
              ORDER BY createdAt ASC
            `);
            existingLeads = [...existingLeads, ...((phoneMatches as any)[0] || [])];
          }
          
          if (existingLeads.length > 0) {
            // O lead mais antigo é o principal
            const primaryId = existingLeads[0].id;
            const secondaryIds = [insertId, ...existingLeads.slice(1).map((l: any) => l.id)];
            
            // Buscar dados do lead principal para mesclar
            const [primaryResult] = await db.execute(sql`
              SELECT * FROM quiz_responses WHERE id = ${primaryId}
            `);
            const primary = (primaryResult as any)[0];
            
            // Buscar dados dos leads secundários
            const secondaryResult = await db.execute(sql`
              SELECT * FROM quiz_responses WHERE id IN (${sql.raw(secondaryIds.join(','))})
            `);
            const secondaries = (secondaryResult as any)[0] || [];
            
            // Mesclar dados - preencher campos vazios do principal
            const fieldsToMerge = [
              'leadName', 'leadPhone', 'leadCity', 'studentsCount', 'revenue',
              'utmSource', 'utmMedium', 'utmCampaign', 'landingPage', 'deviceType', 'browser', 'os'
            ];
            
            const updates: string[] = [];
            for (const field of fieldsToMerge) {
              if (!primary[field]) {
                for (const secondary of secondaries) {
                  if (secondary[field]) {
                    const value = String(secondary[field]).replace(/'/g, "''");
                    updates.push(`${field} = '${value}'`);
                    break;
                  }
                }
              }
            }
            
            // Se algum secundário é qualificado ou convertido
            const anyQualified = secondaries.some((s: any) => s.isQualified);
            const anyConverted = secondaries.some((s: any) => s.converted);
            const anyPersonalId = secondaries.find((s: any) => s.personalId)?.personalId;
            
            if (anyQualified && !primary.isQualified) updates.push('isQualified = 1');
            if (anyConverted && !primary.converted) updates.push('converted = 1');
            if (anyPersonalId && !primary.personalId) updates.push(`personalId = ${anyPersonalId}`);
            
            // Atualizar o lead principal
            if (updates.length > 0) {
              await db.execute(sql`
                UPDATE quiz_responses 
                SET ${sql.raw(updates.join(', '))}, updatedAt = NOW()
                WHERE id = ${primaryId}
              `);
            }
            
            // Marcar leads secundários como mesclados
            await db.execute(sql`
              UPDATE quiz_responses 
              SET mergedIntoId = ${primaryId}, mergedAt = NOW(), updatedAt = NOW()
              WHERE id IN (${sql.raw(secondaryIds.join(','))})
            `);
            
            console.log(`[Quiz] Lead ${insertId} mesclado automaticamente com lead principal ${primaryId}`);
          }
        } catch (mergeError) {
          console.error('[Quiz] Erro ao mesclar leads duplicados:', mergeError);
          // Não falhar o salvamento por causa do merge
        }
      }
      
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
      tagIds: z.array(z.number()).optional(), // Filtro por tags
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
      
      // Se tiver filtro por tags, fazer subquery
      let tagFilterJoin = "";
      let tagFilterCondition = "";
      if (input.tagIds && input.tagIds.length > 0) {
        const tagIdsList = input.tagIds.join(",");
        tagFilterJoin = `INNER JOIN lead_tag_assignments lta ON qr.id = lta.leadId AND lta.tagId IN (${tagIdsList})`;
      }
      
      // Query principal - inclui info de personal vinculado, status de email e tags
      const leadsQuery = input.tagIds && input.tagIds.length > 0
        ? sql`
          SELECT DISTINCT
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
            u.name as personalName,
            es.status as emailStatus,
            es.sentAt as emailSentAt,
            es.id as emailSendId
          FROM quiz_responses qr
          INNER JOIN lead_tag_assignments lta ON qr.id = lta.leadId AND lta.tagId IN (${sql.raw(input.tagIds.join(","))})
          LEFT JOIN users u ON LOWER(qr.leadEmail) = LOWER(u.email)
          LEFT JOIN personals p ON u.id = p.userId
          LEFT JOIN (
            SELECT lead_email, status, sent_at as sentAt, id,
              ROW_NUMBER() OVER (PARTITION BY lead_email ORDER BY created_at DESC) as rn
            FROM email_sends
          ) es ON LOWER(qr.leadEmail) = LOWER(es.lead_email) AND es.rn = 1
          ORDER BY qr.createdAt DESC
          LIMIT ${input.limit} OFFSET ${offset}
        `
        : sql`
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
            u.name as personalName,
            es.status as emailStatus,
            es.sentAt as emailSentAt,
            es.id as emailSendId
          FROM quiz_responses qr
          LEFT JOIN users u ON LOWER(qr.leadEmail) = LOWER(u.email)
          LEFT JOIN personals p ON u.id = p.userId
          LEFT JOIN (
            SELECT lead_email, status, sent_at as sentAt, id,
              ROW_NUMBER() OVER (PARTITION BY lead_email ORDER BY created_at DESC) as rn
            FROM email_sends
          ) es ON LOWER(qr.leadEmail) = LOWER(es.lead_email) AND es.rn = 1
          ORDER BY qr.createdAt DESC
          LIMIT ${input.limit} OFFSET ${offset}
        `;
      
      const leads = await db.execute(leadsQuery);
      const leadsArray = (leads as any)?.[0] || [];
      
      // Buscar tags de cada lead
      const leadIds = leadsArray.map((l: any) => l.id);
      let leadTagsMap: Record<number, Array<{id: number, name: string, color: string}>> = {};
      
      if (leadIds.length > 0) {
        const tagsResult = await db.execute(sql`
          SELECT lta.leadId, lt.id, lt.name, lt.color
          FROM lead_tag_assignments lta
          INNER JOIN lead_tags lt ON lta.tagId = lt.id
          WHERE lta.leadId IN (${sql.raw(leadIds.join(","))})
        `);
        
        const tagsArray = (tagsResult as any)?.[0] || [];
        for (const tag of tagsArray) {
          if (!leadTagsMap[tag.leadId]) {
            leadTagsMap[tag.leadId] = [];
          }
          leadTagsMap[tag.leadId].push({ id: tag.id, name: tag.name, color: tag.color });
        }
      }
      
      // Adicionar tags a cada lead
      const leadsWithTags = leadsArray.map((lead: any) => ({
        ...lead,
        tags: leadTagsMap[lead.id] || []
      }));
      
      // Contagem total (com ou sem filtro de tags)
      const countQuery = input.tagIds && input.tagIds.length > 0
        ? sql`SELECT COUNT(DISTINCT qr.id) as count FROM quiz_responses qr INNER JOIN lead_tag_assignments lta ON qr.id = lta.leadId AND lta.tagId IN (${sql.raw(input.tagIds.join(","))})`
        : sql`SELECT COUNT(*) as count FROM quiz_responses`;
      
      const [countResult] = await db.execute(countQuery);
      const total = (countResult as any)?.count || 0;
      
      return {
        leads: leadsWithTags,
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

  // Detectar leads duplicados por email ou telefone (admin)
  getDuplicateLeads: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar duplicados por email
      const emailDuplicates = await db.execute(sql`
        SELECT 
          leadEmail as identifier,
          'email' as type,
          COUNT(*) as count,
          GROUP_CONCAT(id ORDER BY createdAt DESC) as ids,
          MIN(createdAt) as firstSeen,
          MAX(createdAt) as lastSeen
        FROM quiz_responses 
        WHERE leadEmail IS NOT NULL AND leadEmail != ''
        GROUP BY leadEmail
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `);
      
      // Buscar duplicados por telefone
      const phoneDuplicates = await db.execute(sql`
        SELECT 
          leadPhone as identifier,
          'phone' as type,
          COUNT(*) as count,
          GROUP_CONCAT(id ORDER BY createdAt DESC) as ids,
          MIN(createdAt) as firstSeen,
          MAX(createdAt) as lastSeen
        FROM quiz_responses 
        WHERE leadPhone IS NOT NULL AND leadPhone != ''
        GROUP BY leadPhone
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `);
      
      const emailDups = (emailDuplicates as any)[0] || [];
      const phoneDups = (phoneDuplicates as any)[0] || [];
      
      // Combinar e remover duplicatas (mesmo lead pode aparecer em ambas as listas)
      const allDuplicates = [...emailDups, ...phoneDups];
      
      return {
        duplicates: allDuplicates,
        stats: {
          totalEmailDuplicates: emailDups.length,
          totalPhoneDuplicates: phoneDups.length,
          totalAffectedLeads: allDuplicates.reduce((sum: number, d: any) => sum + parseInt(d.count), 0),
        },
      };
    }),

  // Obter detalhes de um grupo de leads duplicados (admin)
  getDuplicateDetails: adminProcedure
    .input(z.object({
      identifier: z.string(),
      type: z.enum(["email", "phone"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const field = input.type === "email" ? "leadEmail" : "leadPhone";
      
      const leads = await db.execute(sql`
        SELECT 
          id, leadName, leadEmail, leadPhone, leadCity,
          studentsCount, revenue, priority, isQualified, converted,
          utmSource, utmMedium, utmCampaign, landingPage,
          deviceType, browser, os, personalId,
          createdAt, updatedAt
        FROM quiz_responses 
        WHERE ${sql.raw(field)} = ${input.identifier}
        ORDER BY createdAt DESC
      `);
      
      return (leads as any)[0] || [];
    }),

  // Mesclar leads duplicados (admin)
  mergeLeads: adminProcedure
    .input(z.object({
      primaryId: z.number(),
      secondaryIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar o lead primário
      const [primaryResult] = await db.execute(sql`
        SELECT * FROM quiz_responses WHERE id = ${input.primaryId}
      `);
      const primary = (primaryResult as any)[0];
      
      if (!primary) {
        throw new Error("Lead primário não encontrado");
      }
      
      // Buscar leads secundários
      const secondaryResult = await db.execute(sql`
        SELECT * FROM quiz_responses WHERE id IN (${sql.raw(input.secondaryIds.join(","))})
      `);
      const secondaries = (secondaryResult as any)[0] || [];
      
      // Mesclar dados - preencher campos vazios do primário com dados dos secundários
      const fieldsToMerge = [
        'leadName', 'leadEmail', 'leadPhone', 'leadCity',
        'studentsCount', 'revenue', 'utmSource', 'utmMedium', 'utmCampaign',
        'landingPage', 'deviceType', 'browser', 'os'
      ];
      
      const updates: string[] = [];
      
      for (const field of fieldsToMerge) {
        if (!primary[field]) {
          // Buscar primeiro valor não nulo dos secundários
          for (const secondary of secondaries) {
            if (secondary[field]) {
              updates.push(`${field} = '${secondary[field]}'`);
              break;
            }
          }
        }
      }
      
      // Se algum secundário é qualificado ou convertido, marcar o primário também
      const anyQualified = secondaries.some((s: any) => s.isQualified);
      const anyConverted = secondaries.some((s: any) => s.converted);
      const anyPersonalId = secondaries.find((s: any) => s.personalId)?.personalId;
      
      if (anyQualified && !primary.isQualified) {
        updates.push("isQualified = 1");
      }
      if (anyConverted && !primary.converted) {
        updates.push("converted = 1");
      }
      if (anyPersonalId && !primary.personalId) {
        updates.push(`personalId = ${anyPersonalId}`);
      }
      
      // Atualizar o lead primário com os dados mesclados
      if (updates.length > 0) {
        await db.execute(sql`
          UPDATE quiz_responses 
          SET ${sql.raw(updates.join(", "))}, updatedAt = NOW()
          WHERE id = ${input.primaryId}
        `);
      }
      
      // Marcar os leads secundários como mesclados (soft delete)
      await db.execute(sql`
        UPDATE quiz_responses 
        SET 
          mergedIntoId = ${input.primaryId},
          mergedAt = NOW(),
          updatedAt = NOW()
        WHERE id IN (${sql.raw(input.secondaryIds.join(","))})
      `);
      
      return {
        success: true,
        message: `${input.secondaryIds.length} lead(s) mesclado(s) com sucesso`,
        primaryId: input.primaryId,
        mergedCount: input.secondaryIds.length,
      };
    }),

  // Unificar automaticamente todos os leads duplicados (admin)
  autoMergeAllDuplicates: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let totalMerged = 0;
      let groupsMerged = 0;
      
      // Buscar duplicados por email
      const emailDuplicates = await db.execute(sql`
        SELECT 
          leadEmail as identifier,
          GROUP_CONCAT(id ORDER BY createdAt ASC) as ids
        FROM quiz_responses 
        WHERE leadEmail IS NOT NULL AND leadEmail != '' AND mergedIntoId IS NULL
        GROUP BY leadEmail
        HAVING COUNT(*) > 1
      `);
      
      const emailDups = (emailDuplicates as any)[0] || [];
      
      for (const dup of emailDups) {
        const ids = dup.ids.split(",").map((id: string) => parseInt(id));
        const primaryId = ids[0]; // O mais antigo é o primário
        const secondaryIds = ids.slice(1);
        
        if (secondaryIds.length > 0) {
          // Buscar o lead primário
          const [primaryResult] = await db.execute(sql`
            SELECT * FROM quiz_responses WHERE id = ${primaryId}
          `);
          const primary = (primaryResult as any)[0];
          
          // Buscar leads secundários
          const secondaryResult = await db.execute(sql`
            SELECT * FROM quiz_responses WHERE id IN (${sql.raw(secondaryIds.join(","))})
          `);
          const secondaries = (secondaryResult as any)[0] || [];
          
          // Mesclar dados
          const fieldsToMerge = [
            'leadName', 'leadPhone', 'leadCity',
            'studentsCount', 'revenue', 'utmSource', 'utmMedium', 'utmCampaign',
            'landingPage', 'deviceType', 'browser', 'os'
          ];
          
          const updates: string[] = [];
          
          for (const field of fieldsToMerge) {
            if (!primary[field]) {
              for (const secondary of secondaries) {
                if (secondary[field]) {
                  updates.push(`${field} = '${secondary[field]}'`);
                  break;
                }
              }
            }
          }
          
          const anyQualified = secondaries.some((s: any) => s.isQualified);
          const anyConverted = secondaries.some((s: any) => s.converted);
          const anyPersonalId = secondaries.find((s: any) => s.personalId)?.personalId;
          
          if (anyQualified && !primary.isQualified) updates.push("isQualified = 1");
          if (anyConverted && !primary.converted) updates.push("converted = 1");
          if (anyPersonalId && !primary.personalId) updates.push(`personalId = ${anyPersonalId}`);
          
          if (updates.length > 0) {
            await db.execute(sql`
              UPDATE quiz_responses 
              SET ${sql.raw(updates.join(", "))}, updatedAt = NOW()
              WHERE id = ${primaryId}
            `);
          }
          
          // Marcar secundários como mesclados
          await db.execute(sql`
            UPDATE quiz_responses 
            SET mergedIntoId = ${primaryId}, mergedAt = NOW(), updatedAt = NOW()
            WHERE id IN (${sql.raw(secondaryIds.join(","))})
          `);
          
          totalMerged += secondaryIds.length;
          groupsMerged++;
        }
      }
      
      // Buscar duplicados por telefone (que ainda não foram mesclados)
      const phoneDuplicates = await db.execute(sql`
        SELECT 
          leadPhone as identifier,
          GROUP_CONCAT(id ORDER BY createdAt ASC) as ids
        FROM quiz_responses 
        WHERE leadPhone IS NOT NULL AND leadPhone != '' AND mergedIntoId IS NULL
        GROUP BY leadPhone
        HAVING COUNT(*) > 1
      `);
      
      const phoneDups = (phoneDuplicates as any)[0] || [];
      
      for (const dup of phoneDups) {
        const ids = dup.ids.split(",").map((id: string) => parseInt(id));
        const primaryId = ids[0];
        const secondaryIds = ids.slice(1);
        
        if (secondaryIds.length > 0) {
          const [primaryResult] = await db.execute(sql`
            SELECT * FROM quiz_responses WHERE id = ${primaryId}
          `);
          const primary = (primaryResult as any)[0];
          
          const secondaryResult = await db.execute(sql`
            SELECT * FROM quiz_responses WHERE id IN (${sql.raw(secondaryIds.join(","))})
          `);
          const secondaries = (secondaryResult as any)[0] || [];
          
          const fieldsToMerge = [
            'leadName', 'leadEmail', 'leadCity',
            'studentsCount', 'revenue', 'utmSource', 'utmMedium', 'utmCampaign',
            'landingPage', 'deviceType', 'browser', 'os'
          ];
          
          const updates: string[] = [];
          
          for (const field of fieldsToMerge) {
            if (!primary[field]) {
              for (const secondary of secondaries) {
                if (secondary[field]) {
                  updates.push(`${field} = '${secondary[field]}'`);
                  break;
                }
              }
            }
          }
          
          const anyQualified = secondaries.some((s: any) => s.isQualified);
          const anyConverted = secondaries.some((s: any) => s.converted);
          const anyPersonalId = secondaries.find((s: any) => s.personalId)?.personalId;
          
          if (anyQualified && !primary.isQualified) updates.push("isQualified = 1");
          if (anyConverted && !primary.converted) updates.push("converted = 1");
          if (anyPersonalId && !primary.personalId) updates.push(`personalId = ${anyPersonalId}`);
          
          if (updates.length > 0) {
            await db.execute(sql`
              UPDATE quiz_responses 
              SET ${sql.raw(updates.join(", "))}, updatedAt = NOW()
              WHERE id = ${primaryId}
            `);
          }
          
          await db.execute(sql`
            UPDATE quiz_responses 
            SET mergedIntoId = ${primaryId}, mergedAt = NOW(), updatedAt = NOW()
            WHERE id IN (${sql.raw(secondaryIds.join(","))})
          `);
          
          totalMerged += secondaryIds.length;
          groupsMerged++;
        }
      }
      
      return {
        success: true,
        message: `${totalMerged} lead(s) mesclado(s) em ${groupsMerged} grupo(s)`,
        totalMerged,
        groupsMerged,
      };
    }),

  // Reenviar email para um lead específico
  resendEmail: adminProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar dados do lead
      const leadResult = await db.execute(sql`
        SELECT id, leadName, leadEmail, recommendedPlan
        FROM quiz_responses
        WHERE id = ${input.leadId}
      `);
      
      const leads = (leadResult as any)?.[0] as any[];
      if (!leads || leads.length === 0) {
        throw new Error("Lead não encontrado");
      }
      
      const lead = leads[0];
      if (!lead.leadEmail) {
        throw new Error("Lead não possui email cadastrado");
      }
      
      // Buscar sequência de boas-vindas ativa
      const sequenceResult = await db.execute(sql`
        SELECT id FROM email_sequences
        WHERE trigger = 'quiz_completed' AND is_active = 1
        ORDER BY priority DESC
        LIMIT 1
      `);
      
      const sequences = (sequenceResult as any)?.[0] as any[];
      if (!sequences || sequences.length === 0) {
        throw new Error("Nenhuma sequência de email ativa encontrada");
      }
      
      const sequenceId = sequences[0].id;
      
      // Buscar primeiro template da sequência
      const templateResult = await db.execute(sql`
        SELECT id, subject, html_content as htmlContent
        FROM lead_email_templates
        WHERE sequence_id = ${sequenceId} AND is_active = 1
        ORDER BY position ASC
        LIMIT 1
      `);
      
      const templates = (templateResult as any)?.[0] as any[];
      if (!templates || templates.length === 0) {
        throw new Error("Nenhum template de email encontrado");
      }
      
      const template = templates[0];
      
      // Substituir variáveis no subject e conteúdo
      const firstName = lead.leadName?.split(' ')[0] || 'Olá';
      const subject = template.subject
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{name}}/g, lead.leadName || 'Olá')
        .replace(/{{plan}}/g, lead.recommendedPlan || 'starter');
      
      // Agendar envio imediato
      const scheduledAt = new Date();
      
      await db.execute(sql`
        INSERT INTO email_sends (lead_email, sequence_id, template_id, subject, scheduled_at, status, created_at, updated_at)
        VALUES (${lead.leadEmail}, ${sequenceId}, ${template.id}, ${subject}, ${scheduledAt}, 'pending', NOW(), NOW())
      `);
      
      return {
        success: true,
        message: `Email agendado para ${lead.leadEmail}`,
      };
    }),

  // Reenviar emails para todos os leads que falharam
  resendFailedEmails: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar todos os emails que falharam ou não foram enviados
      const failedResult = await db.execute(sql`
        SELECT DISTINCT es.lead_email, es.sequence_id, es.template_id, es.subject
        FROM email_sends es
        WHERE es.status IN ('failed', 'bounced')
        AND es.lead_email NOT IN (
          SELECT lead_email FROM email_sends WHERE status = 'sent'
        )
      `);
      
      const failedEmails = (failedResult as any)?.[0] as any[] || [];
      let reenqueued = 0;
      
      for (const email of failedEmails) {
        await db.execute(sql`
          INSERT INTO email_sends (lead_email, sequence_id, template_id, subject, scheduled_at, status, created_at, updated_at)
          VALUES (${email.lead_email}, ${email.sequence_id}, ${email.template_id}, ${email.subject}, NOW(), 'pending', NOW(), NOW())
        `);
        reenqueued++;
      }
      
      return {
        success: true,
        message: `${reenqueued} email(s) reagendado(s) para envio`,
        count: reenqueued,
      };
    }),

  // Listar emails com falha
  listFailedEmails: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.execute(sql`
        SELECT 
          es.id,
          es.lead_email as leadEmail,
          es.subject,
          es.status,
          es.scheduled_at as scheduledAt,
          es.sent_at as sentAt,
          es.created_at as createdAt,
          qr.leadName,
          qr.recommendedPlan
        FROM email_sends es
        LEFT JOIN quiz_responses qr ON LOWER(es.lead_email) = LOWER(qr.leadEmail)
        WHERE es.status IN ('failed', 'bounced')
        AND es.lead_email NOT IN (
          SELECT lead_email FROM email_sends WHERE status = 'sent'
        )
        ORDER BY es.created_at DESC
      `);
      
      return (result as any)?.[0] as any[] || [];
    }),
});
