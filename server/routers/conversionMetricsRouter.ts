import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, eq, desc, and, gte, lte, inArray } from "drizzle-orm";
import { leadTags, leadTagAssignments, quizResponses } from "../../drizzle/schema";

export const conversionMetricsRouter = router({
  // ==================== MÉTRICAS DE CONVERSÃO DO FUNIL ====================
  
  // Dashboard completo de métricas de conversão
  getConversionMetrics: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calcular datas baseado no período
      let dateFilter = sql`1=1`;
      if (input.startDate && input.endDate) {
        dateFilter = sql`qr.createdAt >= ${input.startDate} AND qr.createdAt <= ${input.endDate}`;
      } else if (input.period !== "all") {
        const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
        dateFilter = sql`qr.createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
      }
      
      // Total de leads do quiz
      const [leadsResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM quiz_responses qr WHERE ${dateFilter}
      `);
      const totalLeads = (leadsResult as any)?.total || 0;
      
      // Leads qualificados
      const [qualifiedResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM quiz_responses qr 
        WHERE ${dateFilter} AND isQualified = 1
      `);
      const qualifiedLeads = (qualifiedResult as any)?.total || 0;
      
      // Trials criados (personals com status trial)
      const [trialsResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM personals p
        WHERE subscriptionStatus = 'trial'
        ${input.startDate && input.endDate 
          ? sql`AND p.createdAt >= ${input.startDate} AND p.createdAt <= ${input.endDate}`
          : input.period !== "all" 
            ? sql`AND p.createdAt >= DATE_SUB(NOW(), INTERVAL ${input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90} DAY)`
            : sql``}
      `);
      const totalTrials = (trialsResult as any)?.total || 0;
      
      // Assinantes pagos (personals com status active)
      const [paidResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM personals p
        WHERE subscriptionStatus = 'active'
        ${input.startDate && input.endDate 
          ? sql`AND p.createdAt >= ${input.startDate} AND p.createdAt <= ${input.endDate}`
          : input.period !== "all" 
            ? sql`AND p.createdAt >= DATE_SUB(NOW(), INTERVAL ${input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90} DAY)`
            : sql``}
      `);
      const totalPaid = (paidResult as any)?.total || 0;
      
      // Leads convertidos para trial (quiz -> trial)
      const [convertedToTrialResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM quiz_responses qr 
        WHERE ${dateFilter} AND convertedToTrial = 1
      `);
      const convertedToTrial = (convertedToTrialResult as any)?.total || 0;
      
      // Leads convertidos para pago (quiz -> paid)
      const [convertedToPaidResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM quiz_responses qr 
        WHERE ${dateFilter} AND convertedToPaid = 1
      `);
      const convertedToPaid = (convertedToPaidResult as any)?.total || 0;
      
      // Calcular taxas de conversão
      const leadToTrialRate = totalLeads > 0 ? ((convertedToTrial / totalLeads) * 100).toFixed(2) : "0.00";
      const trialToPaidRate = totalTrials > 0 ? ((totalPaid / totalTrials) * 100).toFixed(2) : "0.00";
      const overallConversionRate = totalLeads > 0 ? ((totalPaid / totalLeads) * 100).toFixed(2) : "0.00";
      
      // Dados por dia para gráfico de tendência
      const dailyData = await db.execute(sql`
        SELECT 
          DATE(qr.createdAt) as date,
          COUNT(*) as leads,
          SUM(CASE WHEN isQualified = 1 THEN 1 ELSE 0 END) as qualified,
          SUM(CASE WHEN convertedToTrial = 1 THEN 1 ELSE 0 END) as trials,
          SUM(CASE WHEN convertedToPaid = 1 THEN 1 ELSE 0 END) as paid
        FROM quiz_responses qr
        WHERE ${dateFilter}
        GROUP BY DATE(qr.createdAt)
        ORDER BY DATE(qr.createdAt)
      `);
      
      // Distribuição por perfil recomendado
      const profileDistribution = await db.execute(sql`
        SELECT 
          recommendedProfile as profile,
          COUNT(*) as count,
          SUM(CASE WHEN convertedToTrial = 1 THEN 1 ELSE 0 END) as converted
        FROM quiz_responses qr
        WHERE ${dateFilter}
        GROUP BY recommendedProfile
        ORDER BY count DESC
      `);
      
      // Distribuição por origem (UTM Source)
      const sourceDistribution = await db.execute(sql`
        SELECT 
          COALESCE(utmSource, 'Direto') as source,
          COUNT(*) as count,
          SUM(CASE WHEN convertedToTrial = 1 THEN 1 ELSE 0 END) as converted
        FROM quiz_responses qr
        WHERE ${dateFilter}
        GROUP BY utmSource
        ORDER BY count DESC
        LIMIT 10
      `);
      
      return {
        summary: {
          totalLeads,
          qualifiedLeads,
          totalTrials,
          totalPaid,
          convertedToTrial,
          convertedToPaid,
        },
        rates: {
          leadToTrialRate,
          trialToPaidRate,
          overallConversionRate,
          qualificationRate: totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(2) : "0.00",
        },
        funnel: [
          { stage: "Leads do Quiz", count: totalLeads, percentage: 100 },
          { stage: "Qualificados", count: qualifiedLeads, percentage: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0 },
          { stage: "Trials Criados", count: convertedToTrial, percentage: totalLeads > 0 ? (convertedToTrial / totalLeads) * 100 : 0 },
          { stage: "Assinantes Pagos", count: convertedToPaid, percentage: totalLeads > 0 ? (convertedToPaid / totalLeads) * 100 : 0 },
        ],
        trends: (dailyData as any)[0] || [],
        profileDistribution: (profileDistribution as any)[0] || [],
        sourceDistribution: (sourceDistribution as any)[0] || [],
      };
    }),

  // ==================== SISTEMA DE TAGS PARA LEADS ====================
  
  // Listar todas as tags
  listTags: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const tags = await db
      .select()
      .from(leadTags)
      .orderBy(leadTags.name);
    
    // Contar leads por tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(leadTagAssignments)
          .where(eq(leadTagAssignments.tagId, tag.id));
        
        return {
          ...tag,
          leadCount: countResult?.count || 0,
        };
      })
    );
    
    return tagsWithCount;
  }),
  
  // Criar tag
  createTag: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      color: z.string().default("#6b7280"),
      description: z.string().optional(),
      isAutomatic: z.boolean().default(false),
      autoRule: z.object({
        field: z.string(),
        operator: z.enum(["eq", "neq", "contains", "gt", "lt"]),
        value: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(leadTags).values({
        name: input.name,
        color: input.color,
        description: input.description,
        isAutomatic: input.isAutomatic,
        autoRule: input.autoRule ? JSON.stringify(input.autoRule) : null,
      });
      
      return { id: result.insertId, ...input };
    }),
  
  // Atualizar tag
  updateTag: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      color: z.string().optional(),
      description: z.string().optional(),
      isAutomatic: z.boolean().optional(),
      autoRule: z.object({
        field: z.string(),
        operator: z.enum(["eq", "neq", "contains", "gt", "lt"]),
        value: z.string(),
      }).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, autoRule, ...data } = input;
      const updateData: any = { ...data };
      if (autoRule !== undefined) {
        updateData.autoRule = autoRule ? JSON.stringify(autoRule) : null;
      }
      
      await db.update(leadTags).set(updateData).where(eq(leadTags.id, id));
      return { success: true };
    }),
  
  // Deletar tag
  deleteTag: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Deletar atribuições primeiro
      await db.delete(leadTagAssignments).where(eq(leadTagAssignments.tagId, input.id));
      // Deletar tag
      await db.delete(leadTags).where(eq(leadTags.id, input.id));
      
      return { success: true };
    }),
  
  // Atribuir tag a um lead
  assignTag: adminProcedure
    .input(z.object({
      leadId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar se já existe
      const [existing] = await db
        .select()
        .from(leadTagAssignments)
        .where(and(
          eq(leadTagAssignments.leadId, input.leadId),
          eq(leadTagAssignments.tagId, input.tagId)
        ));
      
      if (existing) {
        return { success: true, message: "Tag já atribuída" };
      }
      
      await db.insert(leadTagAssignments).values({
        leadId: input.leadId,
        tagId: input.tagId,
        assignedBy: "admin",
      });
      
      return { success: true };
    }),
  
  // Remover tag de um lead
  removeTag: adminProcedure
    .input(z.object({
      leadId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(leadTagAssignments).where(and(
        eq(leadTagAssignments.leadId, input.leadId),
        eq(leadTagAssignments.tagId, input.tagId)
      ));
      
      return { success: true };
    }),
  
  // Obter tags de um lead
  getLeadTags: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const assignments = await db
        .select({
          id: leadTagAssignments.id,
          tagId: leadTagAssignments.tagId,
          tagName: leadTags.name,
          tagColor: leadTags.color,
          assignedAt: leadTagAssignments.assignedAt,
          assignedBy: leadTagAssignments.assignedBy,
        })
        .from(leadTagAssignments)
        .innerJoin(leadTags, eq(leadTagAssignments.tagId, leadTags.id))
        .where(eq(leadTagAssignments.leadId, input.leadId));
      
      return assignments;
    }),
  
  // Listar leads por tag
  getLeadsByTag: adminProcedure
    .input(z.object({
      tagId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(25),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const offset = (input.page - 1) * input.limit;
      
      const leads = await db.execute(sql`
        SELECT 
          qr.id, qr.leadName, qr.leadEmail, qr.leadPhone, qr.leadCity,
          qr.studentsCount, qr.revenue, qr.recommendedProfile,
          qr.isQualified, qr.convertedToTrial, qr.convertedToPaid,
          qr.createdAt
        FROM quiz_responses qr
        INNER JOIN lead_tag_assignments lta ON qr.id = lta.leadId
        WHERE lta.tagId = ${input.tagId}
        ORDER BY qr.createdAt DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      
      const [countResult] = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM lead_tag_assignments
        WHERE tagId = ${input.tagId}
      `);
      
      return {
        leads: (leads as any)[0] || [],
        total: (countResult as any)?.count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(((countResult as any)?.count || 0) / input.limit),
      };
    }),
  
  // Aplicar tags automáticas a todos os leads
  applyAutomaticTags: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Buscar tags automáticas
    const autoTags = await db
      .select()
      .from(leadTags)
      .where(eq(leadTags.isAutomatic, true));
    
    let totalAssigned = 0;
    
    for (const tag of autoTags) {
      if (!tag.autoRule) continue;
      
      try {
        const rule = JSON.parse(tag.autoRule);
        const { field, operator, value } = rule;
        
        // Construir condição SQL baseada na regra
        let condition: any;
        switch (operator) {
          case "eq":
            condition = sql`${sql.identifier(field)} = ${value}`;
            break;
          case "neq":
            condition = sql`${sql.identifier(field)} != ${value}`;
            break;
          case "contains":
            condition = sql`${sql.identifier(field)} LIKE ${`%${value}%`}`;
            break;
          case "gt":
            condition = sql`${sql.identifier(field)} > ${value}`;
            break;
          case "lt":
            condition = sql`${sql.identifier(field)} < ${value}`;
            break;
          default:
            continue;
        }
        
        // Buscar leads que correspondem à regra e ainda não têm a tag
        const matchingLeads = await db.execute(sql`
          SELECT qr.id
          FROM quiz_responses qr
          LEFT JOIN lead_tag_assignments lta ON qr.id = lta.leadId AND lta.tagId = ${tag.id}
          WHERE ${condition} AND lta.id IS NULL
        `);
        
        const leadIds = ((matchingLeads as any)[0] || []).map((l: any) => l.id);
        
        // Atribuir tag aos leads
        for (const leadId of leadIds) {
          await db.insert(leadTagAssignments).values({
            leadId,
            tagId: tag.id,
            assignedBy: "system",
          });
          totalAssigned++;
        }
      } catch (error) {
        console.error(`Erro ao processar tag automática ${tag.id}:`, error);
      }
    }
    
    return { success: true, totalAssigned };
  }),
  
  // Criar tags padrão baseadas nas respostas do quiz
  createDefaultTags: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Verificar se já existem tags
    const [existing] = await db.select({ count: sql<number>`COUNT(*)` }).from(leadTags);
    if ((existing?.count || 0) > 0) {
      return { message: "Tags já existem" };
    }
    
    const defaultTags = [
      // Tags por quantidade de alunos
      { name: "Iniciante (0-5 alunos)", color: "#10b981", isAutomatic: true, autoRule: { field: "studentsCount", operator: "eq", value: "1-5" } },
      { name: "Crescimento (6-15 alunos)", color: "#3b82f6", isAutomatic: true, autoRule: { field: "studentsCount", operator: "eq", value: "6-15" } },
      { name: "Estabelecido (16-30 alunos)", color: "#8b5cf6", isAutomatic: true, autoRule: { field: "studentsCount", operator: "eq", value: "16-30" } },
      { name: "Negócio (30+ alunos)", color: "#f59e0b", isAutomatic: true, autoRule: { field: "studentsCount", operator: "eq", value: "31-50" } },
      
      // Tags por faturamento
      { name: "Sem renda", color: "#ef4444", isAutomatic: true, autoRule: { field: "revenue", operator: "eq", value: "no_income" } },
      { name: "Até R$ 2k", color: "#f97316", isAutomatic: true, autoRule: { field: "revenue", operator: "eq", value: "2k" } },
      { name: "R$ 2k-5k", color: "#eab308", isAutomatic: true, autoRule: { field: "revenue", operator: "eq", value: "5k" } },
      { name: "R$ 5k-10k", color: "#22c55e", isAutomatic: true, autoRule: { field: "revenue", operator: "eq", value: "10k" } },
      { name: "R$ 10k+", color: "#14b8a6", isAutomatic: true, autoRule: { field: "revenue", operator: "eq", value: "10k+" } },
      
      // Tags por perfil recomendado
      { name: "Perfil Beginner", color: "#6366f1", isAutomatic: true, autoRule: { field: "recommendedProfile", operator: "eq", value: "beginner" } },
      { name: "Perfil Starter", color: "#8b5cf6", isAutomatic: true, autoRule: { field: "recommendedProfile", operator: "eq", value: "starter" } },
      { name: "Perfil Pro", color: "#a855f7", isAutomatic: true, autoRule: { field: "recommendedProfile", operator: "eq", value: "pro" } },
      { name: "Perfil Business", color: "#d946ef", isAutomatic: true, autoRule: { field: "recommendedProfile", operator: "eq", value: "business" } },
      
      // Tags manuais
      { name: "Hot Lead", color: "#ef4444", isAutomatic: false, description: "Lead com alta probabilidade de conversão" },
      { name: "Precisa Follow-up", color: "#f59e0b", isAutomatic: false, description: "Lead que precisa de acompanhamento" },
      { name: "Interessado em Demo", color: "#3b82f6", isAutomatic: false, description: "Lead que solicitou demonstração" },
      { name: "Objeção de Preço", color: "#6b7280", isAutomatic: false, description: "Lead com objeção relacionada a preço" },
    ];
    
    for (const tag of defaultTags) {
      await db.insert(leadTags).values({
        name: tag.name,
        color: tag.color,
        description: tag.description || null,
        isAutomatic: tag.isAutomatic,
        autoRule: tag.autoRule ? JSON.stringify(tag.autoRule) : null,
      });
    }
    
    return { message: "Tags padrão criadas com sucesso", count: defaultTags.length };
  }),
});
