import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  emailSequences, 
  leadEmailTemplates, 
  emailSends, 
  emailTracking,
  leadEmailSubscriptions,
  quizResponses
} from "../../drizzle/schema";
import { eq, desc, and, sql, gte, lte, isNull } from "drizzle-orm";
import { Resend } from "resend";

// Inicialização segura do Resend - só cria instância se API key existir
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const leadEmailRouter = router({
  // ==================== SEQUÊNCIAS ====================
  
  // Listar todas as sequências
  listSequences: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const sequences = await db
      .select()
      .from(emailSequences)
      .orderBy(desc(emailSequences.priority), emailSequences.name);
    
    // Buscar contagem de templates por sequência
    const sequencesWithCount = await Promise.all(
      sequences.map(async (seq) => {
        const [templateCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(leadEmailTemplates)
          .where(eq(leadEmailTemplates.sequenceId, seq.id));
        
        const [sendCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(emailSends)
          .where(eq(emailSends.sequenceId, seq.id));
        
        return {
          ...seq,
          templateCount: templateCount?.count || 0,
          totalSends: sendCount?.count || 0,
        };
      })
    );
    
    return sequencesWithCount;
  }),
  
  // Criar sequência
  createSequence: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      trigger: z.enum(["quiz_completed", "quiz_qualified", "quiz_disqualified", "days_without_conversion", "manual"]),
      triggerDays: z.number().default(0),
      isActive: z.boolean().default(true),
      priority: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(emailSequences).values(input);
      return { id: result.insertId, ...input };
    }),
  
  // Atualizar sequência
  updateSequence: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      trigger: z.enum(["quiz_completed", "quiz_qualified", "quiz_disqualified", "days_without_conversion", "manual"]).optional(),
      triggerDays: z.number().optional(),
      isActive: z.boolean().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(emailSequences).set(data).where(eq(emailSequences.id, id));
      return { success: true };
    }),
  
  // Deletar sequência
  deleteSequence: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Deletar templates associados
      await db.delete(leadEmailTemplates).where(eq(leadEmailTemplates.sequenceId, input.id));
      // Deletar sequência
      await db.delete(emailSequences).where(eq(emailSequences.id, input.id));
      return { success: true };
    }),
  
  // ==================== TEMPLATES ====================
  
  // Listar templates de uma sequência
  listTemplates: adminProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const templates = await db
        .select()
        .from(leadEmailTemplates)
        .where(eq(leadEmailTemplates.sequenceId, input.sequenceId))
        .orderBy(leadEmailTemplates.position);
      
      return templates;
    }),
  
  // Criar template
  createTemplate: adminProcedure
    .input(z.object({
      sequenceId: z.number(),
      name: z.string().min(1),
      subject: z.string().min(1),
      htmlContent: z.string().min(1),
      textContent: z.string().optional(),
      delayDays: z.number().default(0),
      delayHours: z.number().default(0),
      position: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(leadEmailTemplates).values(input);
      return { id: result.insertId, ...input };
    }),
  
  // Atualizar template
  updateTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      subject: z.string().min(1).optional(),
      htmlContent: z.string().min(1).optional(),
      textContent: z.string().optional(),
      delayDays: z.number().optional(),
      delayHours: z.number().optional(),
      position: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(leadEmailTemplates).set(data).where(eq(leadEmailTemplates.id, id));
      return { success: true };
    }),
  
  // Deletar template
  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(leadEmailTemplates).where(eq(leadEmailTemplates.id, input.id));
      return { success: true };
    }),
  
  // ==================== MÉTRICAS ====================
  
  // Dashboard de métricas de email
  getEmailMetrics: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      sequenceId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Total de envios
      const [totalSends] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailSends);
      
      // Envios por status
      const sendsByStatus = await db
        .select({
          status: emailSends.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(emailSends)
        .groupBy(emailSends.status);
      
      // Total de aberturas
      const [totalOpens] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailTracking)
        .where(eq(emailTracking.eventType, "open"));
      
      // Total de cliques
      const [totalClicks] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailTracking)
        .where(eq(emailTracking.eventType, "click"));
      
      // Emails enviados com sucesso
      const sentCount = sendsByStatus.find(s => s.status === "sent")?.count || 0;
      
      // Calcular taxas
      const openRate = sentCount > 0 ? ((totalOpens?.count || 0) / sentCount) * 100 : 0;
      const clickRate = sentCount > 0 ? ((totalClicks?.count || 0) / sentCount) * 100 : 0;
      
      // Métricas por sequência
      const metricsBySequence = await db
        .select({
          sequenceId: emailSends.sequenceId,
          sequenceName: emailSequences.name,
          totalSends: sql<number>`COUNT(*)`,
          sentCount: sql<number>`SUM(CASE WHEN ${emailSends.status} = 'sent' THEN 1 ELSE 0 END)`,
        })
        .from(emailSends)
        .leftJoin(emailSequences, eq(emailSends.sequenceId, emailSequences.id))
        .groupBy(emailSends.sequenceId, emailSequences.name);
      
      return {
        totalSends: totalSends?.count || 0,
        sentCount,
        pendingCount: sendsByStatus.find(s => s.status === "pending")?.count || 0,
        failedCount: sendsByStatus.find(s => s.status === "failed")?.count || 0,
        bouncedCount: sendsByStatus.find(s => s.status === "bounced")?.count || 0,
        totalOpens: totalOpens?.count || 0,
        totalClicks: totalClicks?.count || 0,
        openRate: openRate.toFixed(1),
        clickRate: clickRate.toFixed(1),
        metricsBySequence,
      };
    }),
  
  // Métricas históricas para gráficos de tendências
  getEmailTrends: adminProcedure
    .input(z.object({
      days: z.number().default(30), // Últimos N dias
      sequenceId: z.number().optional(), // Filtro por campanha/sequência
      templateId: z.number().optional(), // Filtro por tipo de email/template
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);
      
      // Construir condições de filtro para envios
      const sendConditions = [
        eq(emailSends.status, "sent"),
        gte(emailSends.sentAt, startDate)
      ];
      if (input.sequenceId) {
        sendConditions.push(eq(emailSends.sequenceId, input.sequenceId));
      }
      if (input.templateId) {
        sendConditions.push(eq(emailSends.templateId, input.templateId));
      }
      
      // Buscar envios por dia com filtros
      const sendsByDay = await db
        .select({
          date: sql<string>`DATE(${emailSends.sentAt})`,
          sent: sql<number>`COUNT(*)`,
        })
        .from(emailSends)
        .where(and(...sendConditions))
        .groupBy(sql`DATE(${emailSends.sentAt})`)
        .orderBy(sql`DATE(${emailSends.sentAt})`);
      
      // Para aberturas e cliques, precisamos fazer join com emailSends para aplicar os filtros
      const trackingConditionsOpen = [
        eq(emailTracking.eventType, "open"),
        gte(emailTracking.createdAt, startDate)
      ];
      const trackingConditionsClick = [
        eq(emailTracking.eventType, "click"),
        gte(emailTracking.createdAt, startDate)
      ];
      
      // Se há filtros, precisamos fazer join com emailSends
      let opensByDay;
      let clicksByDay;
      
      if (input.sequenceId || input.templateId) {
        // Com filtros - fazer join
        const joinConditions = [];
        if (input.sequenceId) {
          joinConditions.push(eq(emailSends.sequenceId, input.sequenceId));
        }
        if (input.templateId) {
          joinConditions.push(eq(emailSends.templateId, input.templateId));
        }
        
        opensByDay = await db
          .select({
            date: sql<string>`DATE(${emailTracking.createdAt})`,
            opens: sql<number>`COUNT(*)`,
          })
          .from(emailTracking)
          .innerJoin(emailSends, eq(emailTracking.emailSendId, emailSends.id))
          .where(and(
            eq(emailTracking.eventType, "open"),
            gte(emailTracking.createdAt, startDate),
            ...joinConditions
          ))
          .groupBy(sql`DATE(${emailTracking.createdAt})`)
          .orderBy(sql`DATE(${emailTracking.createdAt})`);
        
        clicksByDay = await db
          .select({
            date: sql<string>`DATE(${emailTracking.createdAt})`,
            clicks: sql<number>`COUNT(*)`,
          })
          .from(emailTracking)
          .innerJoin(emailSends, eq(emailTracking.emailSendId, emailSends.id))
          .where(and(
            eq(emailTracking.eventType, "click"),
            gte(emailTracking.createdAt, startDate),
            ...joinConditions
          ))
          .groupBy(sql`DATE(${emailTracking.createdAt})`)
          .orderBy(sql`DATE(${emailTracking.createdAt})`);
      } else {
        // Sem filtros - query simples
        opensByDay = await db
          .select({
            date: sql<string>`DATE(${emailTracking.createdAt})`,
            opens: sql<number>`COUNT(*)`,
          })
          .from(emailTracking)
          .where(and(...trackingConditionsOpen))
          .groupBy(sql`DATE(${emailTracking.createdAt})`)
          .orderBy(sql`DATE(${emailTracking.createdAt})`);
        
        clicksByDay = await db
          .select({
            date: sql<string>`DATE(${emailTracking.createdAt})`,
            clicks: sql<number>`COUNT(*)`,
          })
          .from(emailTracking)
          .where(and(...trackingConditionsClick))
          .groupBy(sql`DATE(${emailTracking.createdAt})`)
          .orderBy(sql`DATE(${emailTracking.createdAt})`);
      }
      
      // Criar array de datas para preencher dias sem dados
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      while (currentDate <= today) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Mapear dados por data
      const sendsMap = new Map(sendsByDay.map(s => [s.date, s.sent]));
      const opensMap = new Map(opensByDay.map(o => [o.date, o.opens]));
      const clicksMap = new Map(clicksByDay.map(c => [c.date, c.clicks]));
      
      // Combinar dados
      const trends = dates.map(date => ({
        date,
        sent: sendsMap.get(date) || 0,
        opens: opensMap.get(date) || 0,
        clicks: clicksMap.get(date) || 0,
      }));
      
      // Calcular totais do período
      const totalSent = trends.reduce((sum, t) => sum + t.sent, 0);
      const totalOpens = trends.reduce((sum, t) => sum + t.opens, 0);
      const totalClicks = trends.reduce((sum, t) => sum + t.clicks, 0);
      
      return {
        trends,
        summary: {
          totalSent,
          totalOpens,
          totalClicks,
          openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0",
          clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0",
        },
        period: {
          start: startDate.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0],
          days: input.days,
        },
        filters: {
          sequenceId: input.sequenceId || null,
          templateId: input.templateId || null,
        },
      };
    }),
  
  // Histórico de envios
  listSends: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.enum(["all", "pending", "sent", "failed", "bounced", "cancelled"]).default("all"),
      sequenceId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const offset = (input.page - 1) * input.limit;
      
      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq(emailSends.status, input.status));
      }
      if (input.sequenceId) {
        conditions.push(eq(emailSends.sequenceId, input.sequenceId));
      }
      
      const sendsRaw = await db
        .select({
          id: emailSends.id,
          leadEmail: emailSends.leadEmail,
          subject: emailSends.subject,
          status: emailSends.status,
          scheduledAt: emailSends.scheduledAt,
          sentAt: emailSends.sentAt,
          sequenceName: emailSequences.name,
          templateName: leadEmailTemplates.name,
        })
        .from(emailSends)
        .leftJoin(emailSequences, eq(emailSends.sequenceId, emailSequences.id))
        .leftJoin(leadEmailTemplates, eq(emailSends.templateId, leadEmailTemplates.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailSends.createdAt))
        .limit(input.limit)
        .offset(offset);
      
      // Buscar contagem de opens e clicks para cada email
      const sends = await Promise.all(
        sendsRaw.map(async (send) => {
          const [openCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(emailTracking)
            .where(and(
              eq(emailTracking.emailSendId, send.id),
              eq(emailTracking.eventType, "open")
            ));
          
          const [clickCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(emailTracking)
            .where(and(
              eq(emailTracking.emailSendId, send.id),
              eq(emailTracking.eventType, "click")
            ));
          
          return {
            ...send,
            opens: openCount?.count || 0,
            clicks: clickCount?.count || 0,
          };
        })
      );
      
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailSends)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      return {
        sends,
        total: countResult?.count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((countResult?.count || 0) / input.limit),
      };
    }),
  
  // Buscar detalhes de um email enviado (incluindo conteúdo)
  getEmailSendDetails: adminProcedure
    .input(z.object({
      sendId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar o email enviado com todos os detalhes
      const [send] = await db
        .select({
          id: emailSends.id,
          leadEmail: emailSends.leadEmail,
          subject: emailSends.subject,
          htmlContent: emailSends.htmlContent,
          status: emailSends.status,
          scheduledAt: emailSends.scheduledAt,
          sentAt: emailSends.sentAt,
          errorMessage: emailSends.errorMessage,
          sequenceId: emailSends.sequenceId,
          templateId: emailSends.templateId,
          sequenceName: emailSequences.name,
          templateName: leadEmailTemplates.name,
          createdAt: emailSends.createdAt,
        })
        .from(emailSends)
        .leftJoin(emailSequences, eq(emailSends.sequenceId, emailSequences.id))
        .leftJoin(leadEmailTemplates, eq(emailSends.templateId, leadEmailTemplates.id))
        .where(eq(emailSends.id, input.sendId));
      
      if (!send) {
        throw new Error("Email não encontrado");
      }
      
      // Buscar eventos de tracking
      const trackingEvents = await db
        .select({
          id: emailTracking.id,
          eventType: emailTracking.eventType,
          linkUrl: emailTracking.linkUrl,
          userAgent: emailTracking.userAgent,
          ipAddress: emailTracking.ipAddress,
          createdAt: emailTracking.createdAt,
        })
        .from(emailTracking)
        .where(eq(emailTracking.emailSendId, input.sendId))
        .orderBy(desc(emailTracking.createdAt));
      
      // Contar opens e clicks
      const opens = trackingEvents.filter(e => e.eventType === "open").length;
      const clicks = trackingEvents.filter(e => e.eventType === "click").length;
      
      return {
        ...send,
        opens,
        clicks,
        trackingEvents,
      };
    }),
  
  // ==================== ENVIO MANUAL ====================
  
  // Enviar email manual para um lead
  sendManualEmail: adminProcedure
    .input(z.object({
      leadId: z.number(),
      templateId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar lead
      const [lead] = await db
        .select()
        .from(quizResponses)
        .where(eq(quizResponses.id, input.leadId));
      
      if (!lead || !lead.leadEmail) {
        throw new Error("Lead não encontrado ou sem email");
      }
      
      // Buscar template
      const [template] = await db
        .select()
        .from(leadEmailTemplates)
        .where(eq(leadEmailTemplates.id, input.templateId));
      
      if (!template) {
        throw new Error("Template não encontrado");
      }
      
      // Substituir variáveis no template
      const htmlContent = replaceTemplateVariables(template.htmlContent, lead);
      const subject = replaceTemplateVariables(template.subject, lead);
      
      // Enviar email via Resend
      try {
        if (!resend) {
          throw new Error("Resend API not configured");
        }
        const result = await resend.emails.send({
          from: "FitPrime <noreply@fitprime.com.br>",
          to: lead.leadEmail,
          subject,
          html: htmlContent,
        });
        
        // Registrar envio
        await db.insert(emailSends).values({
          leadId: lead.id,
          leadEmail: lead.leadEmail,
          sequenceId: template.sequenceId,
          templateId: template.id,
          subject,
          status: "sent",
          scheduledAt: new Date(),
          sentAt: new Date(),
          resendId: result.data?.id,
        });
        
        return { success: true, emailId: result.data?.id };
      } catch (error: any) {
        // Registrar falha
        await db.insert(emailSends).values({
          leadId: lead.id,
          leadEmail: lead.leadEmail,
          sequenceId: template.sequenceId,
          templateId: template.id,
          subject,
          status: "failed",
          scheduledAt: new Date(),
          errorMessage: error.message,
        });
        
        throw new Error(`Falha ao enviar email: ${error.message}`);
      }
    }),
  
  // ==================== TRACKING ====================
  
  // Registrar abertura de email (chamado via pixel)
  trackOpen: adminProcedure
    .input(z.object({
      emailSendId: z.number(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(emailTracking).values({
        emailSendId: input.emailSendId,
        eventType: "open",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      
      return { success: true };
    }),
  
  // Registrar clique em link
  trackClick: adminProcedure
    .input(z.object({
      emailSendId: z.number(),
      linkUrl: z.string(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(emailTracking).values({
        emailSendId: input.emailSendId,
        eventType: "click",
        linkUrl: input.linkUrl,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      
      return { success: true };
    }),
  
  // ==================== UNSUBSCRIBE ====================
  
  // Descadastrar email
  unsubscribe: adminProcedure
    .input(z.object({
      email: z.string().email(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar se já existe
      const [existing] = await db
        .select()
        .from(leadEmailSubscriptions)
        .where(eq(leadEmailSubscriptions.leadEmail, input.email));
      
      if (existing) {
        await db
          .update(leadEmailSubscriptions)
          .set({
            isSubscribed: false,
            unsubscribedAt: new Date(),
            unsubscribeReason: input.reason,
          })
          .where(eq(leadEmailSubscriptions.leadEmail, input.email));
      } else {
        await db.insert(leadEmailSubscriptions).values({
          leadEmail: input.email,
          isSubscribed: false,
          unsubscribedAt: new Date(),
          unsubscribeReason: input.reason,
        });
      }
      
      // Cancelar emails pendentes
      await db
        .update(emailSends)
        .set({ status: "cancelled" })
        .where(and(
          eq(emailSends.leadEmail, input.email),
          eq(emailSends.status, "pending")
        ));
      
      return { success: true };
    }),
  
  // ==================== TEMPLATES PADRÃO ====================
  
  // Criar sequências e templates padrão
  createDefaultSequences: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Verificar se já existem sequências
    const [existing] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailSequences);
    if ((existing?.count || 0) > 0) {
      return { message: "Sequências já existem" };
    }
    
    // Criar sequência de boas-vindas
    const [welcomeSeq] = await db.insert(emailSequences).values({
      name: "Boas-vindas",
      description: "Email enviado imediatamente após o lead completar o quiz",
      trigger: "quiz_completed",
      triggerDays: 0,
      isActive: true,
      priority: 100,
    });
    
    // Template de boas-vindas
    await db.insert(leadEmailTemplates).values({
      sequenceId: welcomeSeq.insertId,
      name: "Email de Boas-vindas",
      subject: "{{leadName}}, bem-vindo ao FitPrime! 🎉",
      htmlContent: getWelcomeEmailTemplate(),
      delayDays: 0,
      delayHours: 0,
      position: 1,
      isActive: true,
    });
    
    // Criar sequência de follow-up
    const [followupSeq] = await db.insert(emailSequences).values({
      name: "Follow-up 7 dias",
      description: "Sequência de emails para leads que não converteram em 7 dias",
      trigger: "days_without_conversion",
      triggerDays: 7,
      isActive: true,
      priority: 50,
    });
    
    // Templates de follow-up
    await db.insert(leadEmailTemplates).values([
      {
        sequenceId: followupSeq.insertId,
        name: "Lembrete - Dia 1",
        subject: "{{leadName}}, você ainda está pensando?",
        htmlContent: getFollowup1Template(),
        delayDays: 0,
        delayHours: 0,
        position: 1,
        isActive: true,
      },
      {
        sequenceId: followupSeq.insertId,
        name: "Dica de Gestão - Dia 3",
        subject: "3 dicas para dobrar sua retenção de alunos",
        htmlContent: getFollowup2Template(),
        delayDays: 3,
        delayHours: 0,
        position: 2,
        isActive: true,
      },
      {
        sequenceId: followupSeq.insertId,
        name: "Última Chance - Dia 7",
        subject: "{{leadName}}, última chance de transformar sua carreira",
        htmlContent: getFollowup3Template(),
        delayDays: 7,
        delayHours: 0,
        position: 3,
        isActive: true,
      },
    ]);
    
    return { message: "Sequências padrão criadas com sucesso" };
  }),
});

// Função para substituir variáveis no template
function replaceTemplateVariables(content: string, lead: any): string {
  // Usar a URL base do projeto (variável de ambiente ou URL pública)
  const baseUrl = process.env.PUBLIC_URL || "https://fitprimemanager.com";
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(lead.leadEmail || "")}`;
  
  return content
    .replace(/\{\{leadName\}\}/g, lead.leadName || "Personal")
    .replace(/\{\{leadEmail\}\}/g, lead.leadEmail || "")
    .replace(/\{\{recommendedPlan\}\}/g, lead.recommendedPlan || "Pro")
    .replace(/\{\{studentsCount\}\}/g, lead.studentsCount?.toString() || "0")
    .replace(/\{\{revenue\}\}/g, lead.revenue || "Não informado")
    .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl)
    .replace(/\{\{baseUrl\}\}/g, baseUrl);
}

// Templates de email padrão
function getWelcomeEmailTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; }
    .content { background: #f9fafb; padding: 30px; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo ao FitPrime!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>{{leadName}}</strong>,</p>
      
      <p>Obrigado por completar nosso quiz! Analisamos suas respostas e identificamos que o plano <strong>{{recommendedPlan}}</strong> é ideal para você.</p>
      
      <p>Com o FitPrime, você vai:</p>
      <ul>
        <li>✅ Economizar até 10 horas por semana em tarefas administrativas</li>
        <li>✅ Aumentar sua retenção de alunos em até 40%</li>
        <li>✅ Automatizar cobranças e lembretes via WhatsApp</li>
        <li>✅ Criar treinos personalizados com IA em segundos</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="{{baseUrl}}/pricing" class="cta">Começar Agora - 7 Dias Grátis</a>
      </p>
      
      <p>Qualquer dúvida, estamos aqui para ajudar!</p>
      
      <p>Abraço,<br><strong>Equipe FitPrime</strong></p>
    </div>
    <div class="footer">
      <p>FitPrime - Sistema de Gestão para Personal Trainers</p>
      <p><a href="{{unsubscribeUrl}}">Cancelar inscrição</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getFollowup1Template(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>Olá <strong>{{leadName}}</strong>,</p>
      
      <p>Notei que você ainda não começou seu teste gratuito do FitPrime. Tudo bem?</p>
      
      <p>Sei que a rotina de personal é corrida, mas quero te mostrar como o FitPrime pode te ajudar a:</p>
      
      <ul>
        <li>📱 Gerenciar todos os seus alunos em um só lugar</li>
        <li>⏰ Economizar tempo com automações inteligentes</li>
        <li>💰 Nunca mais perder uma cobrança</li>
      </ul>
      
      <p>O teste é 100% gratuito por 7 dias, sem precisar de cartão de crédito.</p>
      
      <p style="text-align: center;">
        <a href="{{baseUrl}}/quiz-trial" class="cta">Quero Testar Grátis</a>
      </p>
      
      <p>Abraço,<br><strong>Equipe FitPrime</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getFollowup2Template(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; }
    .tip { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>Olá <strong>{{leadName}}</strong>,</p>
      
      <p>Separei 3 dicas que vão te ajudar a dobrar a retenção dos seus alunos:</p>
      
      <div class="tip">
        <strong>1. Acompanhamento Semanal</strong><br>
        Envie um resumo semanal do progresso para cada aluno. Isso aumenta o engajamento em até 60%.
      </div>
      
      <div class="tip">
        <strong>2. Lembretes Automáticos</strong><br>
        Configure lembretes 24h antes de cada sessão. Reduz faltas em até 40%.
      </div>
      
      <div class="tip">
        <strong>3. Celebre Conquistas</strong><br>
        Reconheça cada meta atingida. Alunos que recebem reconhecimento ficam 3x mais tempo.
      </div>
      
      <p>O FitPrime automatiza tudo isso para você. Quer ver como funciona?</p>
      
      <p style="text-align: center;">
        <a href="{{baseUrl}}/quiz-trial" class="cta">Ver Demonstração</a>
      </p>
      
      <p>Abraço,<br><strong>Equipe FitPrime</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getFollowup3Template(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; }
    .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>Olá <strong>{{leadName}}</strong>,</p>
      
      <p>Esta é minha última mensagem sobre o FitPrime.</p>
      
      <p>Sei que você está ocupado, mas quero te fazer uma pergunta sincera:</p>
      
      <p><strong>Quanto tempo você perde por semana com:</strong></p>
      <ul>
        <li>❌ Montando treinos manualmente?</li>
        <li>❌ Cobrando alunos atrasados?</li>
        <li>❌ Respondendo as mesmas perguntas no WhatsApp?</li>
        <li>❌ Organizando sua agenda?</li>
      </ul>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 18px;"><strong>Personais que usam o FitPrime economizam em média 10 horas por semana.</strong></p>
      </div>
      
      <p>São 10 horas que você poderia usar para:</p>
      <ul>
        <li>✅ Atender mais alunos</li>
        <li>✅ Passar tempo com a família</li>
        <li>✅ Investir em você</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="{{baseUrl}}/pricing" class="cta">Começar Agora - 7 Dias Grátis</a>
      </p>
      
      <p>Se não for pra você, tudo bem. Mas se for, não deixe essa oportunidade passar.</p>
      
      <p>Abraço,<br><strong>Equipe FitPrime</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}
