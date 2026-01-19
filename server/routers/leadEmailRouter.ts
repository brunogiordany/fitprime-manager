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
      
      // VERIFICAR SE JÁ FOI ENVIADO EMAIL COM ESTE TEMPLATE PARA ESTE LEAD
      const [existingEmail] = await db
        .select()
        .from(emailSends)
        .where(
          and(
            eq(emailSends.leadId, input.leadId),
            eq(emailSends.templateId, input.templateId),
            eq(emailSends.status, "sent")
          )
        )
        .limit(1);
      
      if (existingEmail) {
        throw new Error("Este email já foi enviado para este lead anteriormente. Para reenviar, use a função de reenvio.");
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
          from: "FitPrime <noreply@fitprimemanager.online>",
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
        
        // Registrar no log de atividades
        await logActivity({
          activityType: "email_sent",
          title: `Email enviado: ${subject}`,
          description: `Email enviado para ${lead.leadName || lead.leadEmail}`,
          entityType: "email",
          entityId: input.templateId,
          leadId: lead.id,
          leadName: lead.leadName || undefined,
          leadEmail: lead.leadEmail || undefined,
          status: "success",
          externalId: result.data?.id || undefined,
          metadata: { templateId: input.templateId, subject },
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
  
  // ==================== REENVIO ====================
  
  // Reenviar um email específico
  resendEmail: adminProcedure
    .input(z.object({
      sendId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar o email original
      const [originalSend] = await db
        .select({
          id: emailSends.id,
          leadId: emailSends.leadId,
          leadEmail: emailSends.leadEmail,
          subject: emailSends.subject,
          htmlContent: emailSends.htmlContent,
          sequenceId: emailSends.sequenceId,
          templateId: emailSends.templateId,
        })
        .from(emailSends)
        .where(eq(emailSends.id, input.sendId));
      
      if (!originalSend) {
        throw new Error("Email original não encontrado");
      }
      
      if (!originalSend.leadEmail) {
        throw new Error("Email do lead não encontrado");
      }
      
      // Verificar se o lead está inscrito
      const [subscription] = await db
        .select()
        .from(leadEmailSubscriptions)
        .where(eq(leadEmailSubscriptions.leadEmail, originalSend.leadEmail));
      
      if (subscription && !subscription.isSubscribed) {
        throw new Error("Lead cancelou a inscrição de emails");
      }
      
      // Enviar email via Resend
      try {
        if (!resend) {
          throw new Error("Resend API not configured");
        }
        
        const result = await resend.emails.send({
          from: "FitPrime <noreply@fitprimemanager.online>",
          to: originalSend.leadEmail,
          subject: originalSend.subject || "Email do FitPrime",
          html: originalSend.htmlContent || "<p>Conteúdo do email</p>",
        });
        
        // Registrar novo envio
        const [newSend] = await db.insert(emailSends).values({
          leadId: originalSend.leadId,
          leadEmail: originalSend.leadEmail,
          sequenceId: originalSend.sequenceId,
          templateId: originalSend.templateId,
          subject: originalSend.subject,
          htmlContent: originalSend.htmlContent,
          status: "sent",
          scheduledAt: new Date(),
          sentAt: new Date(),
          resendId: result.data?.id,
        });
        
        return { 
          success: true, 
          emailId: result.data?.id,
          newSendId: newSend.insertId,
          message: `Email reenviado com sucesso para ${originalSend.leadEmail}` 
        };
      } catch (error: any) {
        // Registrar falha
        await db.insert(emailSends).values({
          leadId: originalSend.leadId,
          leadEmail: originalSend.leadEmail,
          sequenceId: originalSend.sequenceId,
          templateId: originalSend.templateId,
          subject: originalSend.subject,
          htmlContent: originalSend.htmlContent,
          status: "failed",
          scheduledAt: new Date(),
          errorMessage: `Reenvio falhou: ${error.message}`,
        });
        
        throw new Error(`Falha ao reenviar email: ${error.message}`);
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
  
  // ==================== GERENCIAMENTO DE DUPLICADOS ====================
  
  // Listar emails duplicados enviados
  listDuplicateEmails: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const offset = (input.page - 1) * input.limit;
      
      // Buscar emails que foram enviados mais de uma vez para o mesmo destinatário com o mesmo template
      const duplicates = await db.execute(sql`
        SELECT 
          es.leadEmail,
          es.templateId,
          let.name as templateName,
          seq.name as sequenceName,
          COUNT(*) as sendCount,
          GROUP_CONCAT(es.id ORDER BY es.createdAt) as sendIds,
          MIN(es.createdAt) as firstSent,
          MAX(es.createdAt) as lastSent
        FROM email_sends es
        LEFT JOIN lead_email_templates let ON let.id = es.templateId
        LEFT JOIN email_sequences seq ON seq.id = es.sequenceId
        WHERE es.status = 'sent'
        GROUP BY es.leadEmail, es.templateId
        HAVING COUNT(*) > 1
        ORDER BY sendCount DESC, lastSent DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      
      // Contar total de grupos duplicados
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM (
          SELECT leadEmail, templateId
          FROM email_sends
          WHERE status = 'sent'
          GROUP BY leadEmail, templateId
          HAVING COUNT(*) > 1
        ) as duplicates
      `);
      
      const total = Number((countResult as any)[0]?.[0]?.total) || 0;
      
      // Calcular total de emails duplicados (excluindo o primeiro de cada grupo)
      const totalDuplicatesResult = await db.execute(sql`
        SELECT SUM(cnt - 1) as totalDuplicates FROM (
          SELECT COUNT(*) as cnt
          FROM email_sends
          WHERE status = 'sent'
          GROUP BY leadEmail, templateId
          HAVING COUNT(*) > 1
        ) as duplicates
      `);
      
      const totalDuplicates = Number((totalDuplicatesResult as any)[0]?.[0]?.totalDuplicates) || 0;
      
      return {
        duplicates: (duplicates as any)[0] || [],
        total,
        totalDuplicates,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
  
  // Deletar emails duplicados (mantém apenas o primeiro de cada grupo)
  deleteDuplicateEmails: adminProcedure
    .input(z.object({
      leadEmail: z.string().optional(), // Se fornecido, deleta apenas deste email
      templateId: z.number().optional(), // Se fornecido, deleta apenas deste template
      deleteAll: z.boolean().default(false), // Se true, deleta todos os duplicados
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let deletedCount = 0;
      
      if (input.deleteAll) {
        // Buscar todos os grupos de duplicados
        const duplicateGroups = await db.execute(sql`
          SELECT 
            leadEmail,
            templateId,
            GROUP_CONCAT(id ORDER BY createdAt) as sendIds
          FROM email_sends
          WHERE status = 'sent'
          GROUP BY leadEmail, templateId
          HAVING COUNT(*) > 1
        `);
        
        const groups = (duplicateGroups as any)[0] || [];
        
        for (const group of groups) {
          const ids = group.sendIds.split(',').map(Number);
          // Manter o primeiro (mais antigo), deletar os demais
          const idsToDelete = ids.slice(1);
          
          if (idsToDelete.length > 0) {
            // Deletar trackings relacionados
            for (const id of idsToDelete) {
              await db.delete(emailTracking).where(eq(emailTracking.emailSendId, id));
            }
            
            // Deletar emails
            for (const id of idsToDelete) {
              await db.delete(emailSends).where(eq(emailSends.id, id));
            }
            
            deletedCount += idsToDelete.length;
          }
        }
      } else if (input.leadEmail && input.templateId) {
        // Deletar duplicados específicos de um email/template
        const duplicates = await db
          .select({ id: emailSends.id })
          .from(emailSends)
          .where(and(
            eq(emailSends.leadEmail, input.leadEmail),
            eq(emailSends.templateId, input.templateId),
            eq(emailSends.status, 'sent')
          ))
          .orderBy(emailSends.createdAt);
        
        const idsToDelete = duplicates.slice(1).map(r => r.id);
        
        if (idsToDelete.length > 0) {
          for (const id of idsToDelete) {
            await db.delete(emailTracking).where(eq(emailTracking.emailSendId, id));
            await db.delete(emailSends).where(eq(emailSends.id, id));
          }
          deletedCount = idsToDelete.length;
        }
      }
      
      return {
        success: true,
        deletedCount,
        message: `${deletedCount} email(s) duplicado(s) removido(s) com sucesso`,
      };
    }),
  
  // ==================== RELATÓRIO POR PERÍODO ====================
  
  // Relatório completo de emails por período com taxas
  getEmailReportByPeriod: adminProcedure
    .input(z.object({
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(),   // ISO date string
      period: z.enum(['today', '7days', '15days', '30days', '90days', 'custom']).default('30days'),
      sequenceId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calcular datas
      const now = new Date();
      let startDate: Date;
      let endDate = new Date();
      
      switch (input.period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case '7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15days':
          startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = input.endDate ? new Date(input.endDate) : new Date();
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      // Condições base
      const conditions = [
        gte(emailSends.createdAt, startDate),
        lte(emailSends.createdAt, endDate),
      ];
      
      if (input.sequenceId) {
        conditions.push(eq(emailSends.sequenceId, input.sequenceId));
      }
      
      // Buscar todos os emails do período
      const emails = await db
        .select({
          id: emailSends.id,
          leadEmail: emailSends.leadEmail,
          subject: emailSends.subject,
          status: emailSends.status,
          sequenceId: emailSends.sequenceId,
          templateId: emailSends.templateId,
          createdAt: emailSends.createdAt,
          sentAt: emailSends.sentAt,
          sequenceName: emailSequences.name,
          templateName: leadEmailTemplates.name,
        })
        .from(emailSends)
        .leftJoin(emailSequences, eq(emailSends.sequenceId, emailSequences.id))
        .leftJoin(leadEmailTemplates, eq(emailSends.templateId, leadEmailTemplates.id))
        .where(and(...conditions))
        .orderBy(desc(emailSends.createdAt));
      
      // Buscar métricas de tracking para todos os emails
      const emailIds = emails.map(e => e.id);
      let trackingData: { emailSendId: number; eventType: string; count: number }[] = [];
      
      if (emailIds.length > 0) {
        const trackingRaw = await db
          .select({
            emailSendId: emailTracking.emailSendId,
            eventType: emailTracking.eventType,
          })
          .from(emailTracking)
          .where(sql`${emailTracking.emailSendId} IN (${emailIds.join(',')})`);
        
        // Agrupar manualmente
        const trackingGroups = new Map<string, number>();
        for (const t of trackingRaw) {
          const key = `${t.emailSendId}-${t.eventType}`;
          trackingGroups.set(key, (trackingGroups.get(key) || 0) + 1);
        }
        
        trackingData = Array.from(trackingGroups.entries()).map(([key, count]) => {
          const [emailSendId, eventType] = key.split('-');
          return { emailSendId: parseInt(emailSendId), eventType, count };
        });
      }
      
      // Mapear tracking por email
      const trackingMap = new Map<number, { opens: number; clicks: number }>();
      for (const t of trackingData) {
        if (!trackingMap.has(t.emailSendId)) {
          trackingMap.set(t.emailSendId, { opens: 0, clicks: 0 });
        }
        const data = trackingMap.get(t.emailSendId)!;
        if (t.eventType === 'open') data.opens = t.count;
        if (t.eventType === 'click') data.clicks = t.count;
      }
      
      // Calcular métricas gerais
      const totalSent = emails.filter(e => e.status === 'sent').length;
      const totalPending = emails.filter(e => e.status === 'pending').length;
      const totalFailed = emails.filter(e => e.status === 'failed').length;
      const totalBounced = emails.filter(e => e.status === 'bounced').length;
      
      let totalOpens = 0;
      let totalClicks = 0;
      let uniqueOpens = 0;
      let uniqueClicks = 0;
      
      trackingMap.forEach((data) => {
        totalOpens += data.opens;
        totalClicks += data.clicks;
        if (data.opens > 0) uniqueOpens++;
        if (data.clicks > 0) uniqueClicks++;
      });
      
      // Taxas
      const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
      const deliveryRate = emails.length > 0 ? ((totalSent) / emails.length) * 100 : 0;
      const bounceRate = emails.length > 0 ? (totalBounced / emails.length) * 100 : 0;
      
      // Agrupar por dia
      const byDay: Record<string, { sent: number; opens: number; clicks: number }> = {};
      for (const email of emails) {
        const day = email.createdAt?.toISOString().split('T')[0] || 'unknown';
        if (!byDay[day]) {
          byDay[day] = { sent: 0, opens: 0, clicks: 0 };
        }
        if (email.status === 'sent') {
          byDay[day].sent++;
          const tracking = trackingMap.get(email.id);
          if (tracking) {
            byDay[day].opens += tracking.opens;
            byDay[day].clicks += tracking.clicks;
          }
        }
      }
      
      // Agrupar por sequência
      const bySequence: Record<string, { name: string; sent: number; opens: number; clicks: number; openRate: number; clickRate: number }> = {};
      for (const email of emails) {
        const seqId = email.sequenceId?.toString() || 'none';
        if (!bySequence[seqId]) {
          bySequence[seqId] = { 
            name: email.sequenceName || 'Sem sequência', 
            sent: 0, 
            opens: 0, 
            clicks: 0,
            openRate: 0,
            clickRate: 0,
          };
        }
        if (email.status === 'sent') {
          bySequence[seqId].sent++;
          const tracking = trackingMap.get(email.id);
          if (tracking) {
            if (tracking.opens > 0) bySequence[seqId].opens++;
            if (tracking.clicks > 0) bySequence[seqId].clicks++;
          }
        }
      }
      
      // Calcular taxas por sequência
      for (const key of Object.keys(bySequence)) {
        const seq = bySequence[key];
        seq.openRate = seq.sent > 0 ? (seq.opens / seq.sent) * 100 : 0;
        seq.clickRate = seq.sent > 0 ? (seq.clicks / seq.sent) * 100 : 0;
      }
      
      // Emails com métricas
      const emailsWithMetrics = emails.map(e => ({
        ...e,
        opens: trackingMap.get(e.id)?.opens || 0,
        clicks: trackingMap.get(e.id)?.clicks || 0,
      }));
      
      return {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          label: input.period,
        },
        summary: {
          total: emails.length,
          sent: totalSent,
          pending: totalPending,
          failed: totalFailed,
          bounced: totalBounced,
          totalOpens,
          totalClicks,
          uniqueOpens,
          uniqueClicks,
        },
        rates: {
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
        },
        byDay: Object.entries(byDay).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
        bySequence: Object.values(bySequence),
        emails: emailsWithMetrics,
      };
    }),
  
  // ==================== LIMITE DIÁRIO DE ENVIO ====================
  
  // Obter configuração de limite diário
  getDailyEmailLimit: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limite padrão de 100 emails por dia
    const defaultLimit = 100;
    
    // Contar emails enviados hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [sentToday] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(emailSends)
      .where(and(
        gte(emailSends.createdAt, today),
        eq(emailSends.status, 'sent')
      ));
    
    const used = sentToday?.count || 0;
    const remaining = Math.max(0, defaultLimit - used);
    const percentage = (used / defaultLimit) * 100;
    
    return {
      limit: defaultLimit,
      used,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
      alerts: [
        ...(percentage >= 80 && percentage < 100 ? [`⚠️ Você já usou ${Math.round(percentage)}% do limite diário de emails`] : []),
        ...(percentage >= 100 ? [`🚫 Limite diário de emails atingido! Aguarde até amanhã para enviar mais.`] : []),
      ],
    };
  }),
  
  // Verificar se pode enviar email (usado antes de cada envio)
  canSendEmail: adminProcedure
    .input(z.object({
      recipientEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const defaultLimit = 100;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Verificar limite diário global
      const [sentToday] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailSends)
        .where(and(
          gte(emailSends.createdAt, today),
          eq(emailSends.status, 'sent')
        ));
      
      const globalUsed = sentToday?.count || 0;
      
      if (globalUsed >= defaultLimit) {
        return {
          canSend: false,
          reason: 'daily_limit_reached',
          message: 'Limite diário de emails atingido',
        };
      }
      
      // Verificar se o email não está na lista de unsubscribe
      const [unsubscribed] = await db
        .select()
        .from(leadEmailSubscriptions)
        .where(eq(leadEmailSubscriptions.leadEmail, input.recipientEmail.toLowerCase()));
      
      if (unsubscribed && !unsubscribed.isSubscribed) {
        return {
          canSend: false,
          reason: 'unsubscribed',
          message: 'Este email cancelou a inscrição',
        };
      }
      
      // Verificar limite por destinatário (máx 3 emails por dia para o mesmo email)
      const [sentToRecipient] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(emailSends)
        .where(and(
          gte(emailSends.createdAt, today),
          eq(emailSends.leadEmail, input.recipientEmail.toLowerCase()),
          eq(emailSends.status, 'sent')
        ));
      
      const recipientCount = sentToRecipient?.count || 0;
      
      if (recipientCount >= 3) {
        return {
          canSend: false,
          reason: 'recipient_limit_reached',
          message: 'Este destinatário já recebeu o limite de 3 emails hoje',
        };
      }
      
      return {
        canSend: true,
        reason: null,
        message: null,
        remaining: {
          global: defaultLimit - globalUsed,
          recipient: 3 - recipientCount,
        },
      };
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
        <a href="{{baseUrl}}/cadastro-trial" class="cta">Começar Meu Teste Grátis</a>
      </p>
      
      <p>Qualquer dúvida, estamos aqui para ajudar!</p>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="https://wa.me/5511999999999?text=Olá!%20Vim%20do%20quiz%20do%20FitPrime%20e%20tenho%20algumas%20dúvidas" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px;">
          💬 Tirar Dúvidas no WhatsApp
        </a>
      </p>
      
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
        <a href="{{baseUrl}}/cadastro-trial" class="cta">Começar Meu Teste Grátis</a>
      </p>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="https://wa.me/5511999999999?text=Olá!%20Vim%20do%20quiz%20do%20FitPrime%20e%20tenho%20algumas%20dúvidas" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px;">
          💬 Tirar Dúvidas no WhatsApp
        </a>
      </p>
      
      <p>Se não for pra você, tudo bem. Mas se for, não deixe essa oportunidade passar.</p>
      
      <p>Abraço,<br><strong>Equipe FitPrime</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}
