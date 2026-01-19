import { z } from "zod";
import { router, ownerProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { 
  adminWhatsappConfig, 
  adminWhatsappAutomations, 
  adminWhatsappMessages,
  adminWhatsappQueue,
  quizResponses,
  personals,
  users
} from "../../drizzle/schema";
import { eq, desc, and, sql, gte, lte, or, isNull, ne } from "drizzle-orm";
import { sendWhatsAppMessage, getWebhook, setWebhook } from "../stevo";

export const adminWhatsappRouter = router({
  // ==================== CONFIGURAÇÃO ====================
  
  // Obter configuração atual
  getConfig: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const [config] = await db.select().from(adminWhatsappConfig).limit(1);
    
    return config || {
      id: null,
      stevoApiKey: null,
      stevoInstanceName: null,
      stevoServer: "sm15",
      connectionStatus: "disconnected",
      connectedPhone: null,
      connectedName: null,
    };
  }),
  
  // Salvar configuração
  saveConfig: ownerProcedure
    .input(z.object({
      stevoApiKey: z.string().min(1),
      stevoInstanceName: z.string().min(1),
      stevoServer: z.string().default("sm15"),
    }))
    .mutation(async ({ input }: { input: { stevoApiKey: string; stevoInstanceName: string; stevoServer: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se já existe configuração
      const [existing] = await db.select().from(adminWhatsappConfig).limit(1);
      
      // Gerar token de webhook
      const webhookToken = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      if (existing) {
        await db.update(adminWhatsappConfig)
          .set({
            stevoApiKey: input.stevoApiKey,
            stevoInstanceName: input.stevoInstanceName,
            stevoServer: input.stevoServer,
            stevoWebhookToken: webhookToken,
            connectionStatus: "connecting",
          })
          .where(eq(adminWhatsappConfig.id, existing.id));
      } else {
        await db.insert(adminWhatsappConfig).values({
          stevoApiKey: input.stevoApiKey,
          stevoInstanceName: input.stevoInstanceName,
          stevoServer: input.stevoServer,
          stevoWebhookToken: webhookToken,
          connectionStatus: "connecting",
        });
      }
      
      // Configurar webhook no Stevo
      try {
        const webhookUrl = `https://fitprimemanager.com/api/webhook/admin-stevo?token=${webhookToken}`;
        const success = await setWebhook(
          {
            apiKey: input.stevoApiKey,
            instanceName: input.stevoInstanceName,
            server: input.stevoServer,
          },
          webhookUrl,
          ["All"]
        );
        
        if (success) {
          await db.update(adminWhatsappConfig)
            .set({ connectionStatus: "connected", lastConnectedAt: new Date() })
            .where(eq(adminWhatsappConfig.id, existing?.id || 1));
        }
      } catch (error) {
        console.error("[AdminWhatsapp] Erro ao configurar webhook:", error);
      }
      
      return { success: true };
    }),
  
  // Testar conexão
  testConnection: ownerProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const [config] = await db.select().from(adminWhatsappConfig).limit(1);
    
    if (!config?.stevoApiKey || !config?.stevoInstanceName) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp não configurado" });
    }
    
    try {
      const webhook = await getWebhook({
        apiKey: config.stevoApiKey,
        instanceName: config.stevoInstanceName,
        server: config.stevoServer || "sm15",
      });
      
      await db.update(adminWhatsappConfig)
        .set({ 
          connectionStatus: "connected", 
          lastConnectedAt: new Date(),
          lastErrorMessage: null,
        })
        .where(eq(adminWhatsappConfig.id, config.id));
      
      return { success: true, webhook: webhook.webhook };
    } catch (error: any) {
      await db.update(adminWhatsappConfig)
        .set({ 
          connectionStatus: "error", 
          lastErrorMessage: error.message,
        })
        .where(eq(adminWhatsappConfig.id, config.id));
      
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),
  
  // ==================== AUTOMAÇÕES ====================
  
  // Listar automações
  listAutomations: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const automations = await db.select()
      .from(adminWhatsappAutomations)
      .orderBy(desc(adminWhatsappAutomations.createdAt));
    
    return automations;
  }),
  
  // Criar automação
  createAutomation: ownerProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      trigger: z.enum([
        "lead_trial_signup",
        "lead_trial_2days_before",
        "lead_trial_expired",
        "lead_followup_7days",
        "personal_payment_2days",
        "personal_payment_dueday",
        "personal_payment_overdue",
        "personal_payment_confirmed",
        "personal_reengagement_30days",
        "custom"
      ]),
      targetType: z.enum(["lead", "personal", "both"]).default("lead"),
      messageTemplate: z.string().min(1),
      isActive: z.boolean().default(true),
      delayMinutes: z.number().default(0),
      sendWindowStart: z.string().default("08:00"),
      sendWindowEnd: z.string().default("20:00"),
      sendOnWeekends: z.boolean().default(false),
      excludeExistingPersonals: z.boolean().default(true),
      excludeRecentMessages: z.number().default(24),
    }))
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [automation] = await db.insert(adminWhatsappAutomations).values(input).$returningId();
      
      return { success: true, id: automation.id };
    }),
  
  // Atualizar automação
  updateAutomation: ownerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      messageTemplate: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
      delayMinutes: z.number().optional(),
      sendWindowStart: z.string().optional(),
      sendWindowEnd: z.string().optional(),
      sendOnWeekends: z.boolean().optional(),
      excludeExistingPersonals: z.boolean().optional(),
      excludeRecentMessages: z.number().optional(),
    }))
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, ...data } = input;
      await db.update(adminWhatsappAutomations)
        .set(data)
        .where(eq(adminWhatsappAutomations.id, id));
      
      return { success: true };
    }),
  
  // Deletar automação
  deleteAutomation: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.delete(adminWhatsappAutomations)
        .where(eq(adminWhatsappAutomations.id, input.id));
      
      return { success: true };
    }),
  
  // Criar automações padrão
  createDefaultAutomations: ownerProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const defaultAutomations = [
      {
        name: "Boas-vindas Trial",
        description: "Mensagem enviada quando um lead se cadastra no trial",
        trigger: "lead_trial_signup" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 👋

Seja bem-vindo(a) ao FitPrime! 🎉

Você acaba de iniciar seu período de teste gratuito. Durante os próximos dias, você terá acesso completo a todas as funcionalidades da plataforma.

Aproveite para:
✅ Cadastrar seus alunos
✅ Criar treinos personalizados
✅ Configurar suas automações

Qualquer dúvida, estou à disposição!

Equipe FitPrime 💪`,
        isActive: true,
        delayMinutes: 5,
        excludeExistingPersonals: true,
      },
      {
        name: "Lembrete Trial 2 Dias",
        description: "Lembrete 2 dias antes do trial vencer",
        trigger: "lead_trial_2days_before" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Seu período de teste no FitPrime termina em *2 dias*! ⏰

Não perca a oportunidade de continuar usando a plataforma que vai transformar sua gestão de alunos.

🔥 Assine agora e garanta:
• Treinos ilimitados com IA
• Automações de WhatsApp
• Gestão financeira completa
• Suporte prioritário

Clique aqui para assinar: {{link_assinatura}}

Qualquer dúvida, estou aqui! 😊`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Trial Expirado",
        description: "Mensagem quando o trial expira",
        trigger: "lead_trial_expired" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Seu período de teste no FitPrime acabou 😢

Mas não se preocupe! Você ainda pode assinar e continuar usando todas as funcionalidades.

🎁 *Oferta especial*: Use o cupom VOLTEI e ganhe 20% de desconto na primeira mensalidade!

Clique aqui para assinar: {{link_assinatura}}

Estamos te esperando! 💪`,
        isActive: true,
        delayMinutes: 60,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 7 Dias",
        description: "Follow-up 7 dias após cadastro sem conversão",
        trigger: "lead_followup_7days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Faz uma semana que você conheceu o FitPrime. Como está sendo sua experiência? 🤔

Se tiver alguma dúvida sobre a plataforma ou precisar de ajuda para configurar algo, é só me chamar!

Estou aqui para ajudar você a ter sucesso na sua carreira de personal trainer. 💪

Abraço,
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Lembrete Pagamento 2 Dias",
        description: "Lembrete 2 dias antes do vencimento da assinatura",
        trigger: "personal_payment_2days" as const,
        targetType: "personal" as const,
        messageTemplate: `Olá {{nome}}! 

Sua assinatura do FitPrime vence em *2 dias* ({{data_vencimento}}).

💳 Valor: R$ {{valor}}

Para evitar a interrupção do serviço, garanta seu pagamento em dia.

Se já pagou, desconsidere esta mensagem! 😊

Abraço,
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: false,
      },
      {
        name: "Lembrete Dia Vencimento",
        description: "Lembrete no dia do vencimento",
        trigger: "personal_payment_dueday" as const,
        targetType: "personal" as const,
        messageTemplate: `Olá {{nome}}! 

Hoje é o dia do vencimento da sua assinatura FitPrime! 📅

💳 Valor: R$ {{valor}}

Efetue o pagamento para continuar usando a plataforma sem interrupções.

Link para pagamento: {{link_pagamento}}

Qualquer dúvida, estou aqui!`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: false,
      },
      {
        name: "Pagamento Confirmado",
        description: "Confirmação de pagamento recebido",
        trigger: "personal_payment_confirmed" as const,
        targetType: "personal" as const,
        messageTemplate: `Olá {{nome}}! 🎉

Seu pagamento foi confirmado com sucesso!

✅ Valor: R$ {{valor}}
✅ Próximo vencimento: {{proximo_vencimento}}

Obrigado por continuar confiando no FitPrime! 💪

Bons treinos!
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: false,
      },
    ];
    
    for (const automation of defaultAutomations) {
      // Verificar se já existe
      const [existing] = await db.select()
        .from(adminWhatsappAutomations)
        .where(eq(adminWhatsappAutomations.trigger, automation.trigger))
        .limit(1);
      
      if (!existing) {
        await db.insert(adminWhatsappAutomations).values(automation);
      }
    }
    
    return { success: true, created: defaultAutomations.length };
  }),
  
  // ==================== MENSAGENS ====================
  
  // Listar mensagens recentes
  listMessages: ownerProcedure
    .input(z.object({
      recipientType: z.enum(["lead", "personal", "all"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }: { input: { recipientType?: string; limit: number; offset: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const messages = await db.select()
        .from(adminWhatsappMessages)
        .orderBy(desc(adminWhatsappMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      // Filtrar por tipo se necessário
      const filteredMessages = input.recipientType && input.recipientType !== "all"
        ? messages.filter(m => m.recipientType === input.recipientType)
        : messages;
      
      return filteredMessages;
    }),
  
  // Enviar mensagem manual
  sendMessage: ownerProcedure
    .input(z.object({
      recipientType: z.enum(["lead", "personal"]),
      recipientId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }: { input: { recipientType: "lead" | "personal"; recipientId: number; message: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar configuração do WhatsApp
      const [config] = await db.select().from(adminWhatsappConfig).limit(1);
      
      if (!config?.stevoApiKey || !config?.stevoInstanceName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp não configurado" });
      }
      
      // Buscar dados do destinatário
      let recipientPhone: string | null = null;
      let recipientName: string | null = null;
      
      if (input.recipientType === "lead") {
      const [lead] = await db.select()
        .from(quizResponses)
        .where(eq(quizResponses.id, input.recipientId))
        .limit(1);
      
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      
      recipientPhone = lead.leadPhone;
      recipientName = lead.leadName;
      } else {
        const [personal] = await db.select({
          id: personals.id,
          phone: users.phone,
          name: users.name,
        })
          .from(personals)
          .leftJoin(users, eq(personals.userId, users.id))
          .where(eq(personals.id, input.recipientId))
          .limit(1);
        
        if (!personal) throw new TRPCError({ code: "NOT_FOUND", message: "Personal não encontrado" });
        
        recipientPhone = personal.phone;
        recipientName = personal.name;
      }
      
      if (!recipientPhone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Destinatário não possui telefone cadastrado" });
      }
      
      // Enviar mensagem
      const result = await sendWhatsAppMessage({
        phone: recipientPhone,
        message: input.message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || "sm15",
        },
      });
      
      // Salvar no histórico
      await db.insert(adminWhatsappMessages).values({
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        recipientPhone,
        recipientName,
        direction: "outbound",
        message: input.message,
        status: result.success ? "sent" : "failed",
        stevoMessageId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });
      
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Erro ao enviar mensagem" });
      }
      
      return { success: true, messageId: result.messageId };
    }),
  
  // Enviar mensagem em massa para leads
  sendBulkToLeads: ownerProcedure
    .input(z.object({
      leadIds: z.array(z.number()),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }: { input: { leadIds: number[]; message: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar configuração do WhatsApp
      const [config] = await db.select().from(adminWhatsappConfig).limit(1);
      
      if (!config?.stevoApiKey || !config?.stevoInstanceName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp não configurado" });
      }
      
      // Buscar leads
      const leads = await db.select()
        .from(quizResponses)
        .where(sql`${quizResponses.id} IN (${sql.join(input.leadIds.map((id: number) => sql`${id}`), sql`, `)})`);
      
      const results = { sent: 0, failed: 0, errors: [] as string[] };
      
      for (const lead of leads) {
        if (!lead.leadPhone) {
          results.failed++;
          results.errors.push(`${lead.leadName}: Sem telefone`);
          continue;
        }
        
        // Substituir variáveis
        const personalizedMessage = input.message
          .replace(/{{nome}}/g, lead.leadName || "")
          .replace(/{{email}}/g, lead.leadEmail || "");
        
        try {
          const result = await sendWhatsAppMessage({
            phone: lead.leadPhone!,
            message: personalizedMessage,
            config: {
              apiKey: config.stevoApiKey,
              instanceName: config.stevoInstanceName,
              server: config.stevoServer || "sm15",
            },
          });
          
          // Salvar no histórico
          await db.insert(adminWhatsappMessages).values({
            recipientType: "lead",
            recipientId: lead.id,
            recipientPhone: lead.leadPhone!,
            recipientName: lead.leadName,
            direction: "outbound",
            message: personalizedMessage,
            status: result.success ? "sent" : "failed",
            stevoMessageId: result.messageId,
            errorMessage: result.error,
            sentAt: result.success ? new Date() : null,
          });
          
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${lead.leadName}: ${result.error}`);
          }
          
          // Delay entre mensagens para evitar bloqueio
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${lead.leadName}: ${error.message}`);
        }
      }
      
      return results;
    }),
  
  // ==================== ESTATÍSTICAS ====================
  
  // Obter estatísticas gerais
  getStats: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Total de mensagens
    const [totalMessages] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(adminWhatsappMessages);
    
    // Mensagens por status
    const messagesByStatus = await db.select({
      status: adminWhatsappMessages.status,
      count: sql<number>`COUNT(*)`,
    })
      .from(adminWhatsappMessages)
      .groupBy(adminWhatsappMessages.status);
    
    // Mensagens hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [messagesToday] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(adminWhatsappMessages)
      .where(gte(adminWhatsappMessages.createdAt, today));
    
    // Automações ativas
    const [activeAutomations] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(adminWhatsappAutomations)
      .where(eq(adminWhatsappAutomations.isActive, true));
    
    return {
      totalMessages: totalMessages?.count || 0,
      messagesToday: messagesToday?.count || 0,
      activeAutomations: activeAutomations?.count || 0,
      messagesByStatus: messagesByStatus.reduce((acc, item) => {
        acc[item.status || "unknown"] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }),
  
  // ==================== LEADS PARA ENVIO ====================
  
  // Listar leads disponíveis para envio
  listLeadsForMessaging: ownerProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }: { input: { search?: string; limit: number; offset: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      let query = db.select({
        id: quizResponses.id,
        name: quizResponses.leadName,
        email: quizResponses.leadEmail,
        phone: quizResponses.leadPhone,
        createdAt: quizResponses.createdAt,
        studentsCount: quizResponses.studentsCount,
        recommendedProfile: quizResponses.recommendedProfile,
      })
        .from(quizResponses)
        .where(sql`${quizResponses.leadPhone} IS NOT NULL AND ${quizResponses.leadPhone} != ''`)
        .orderBy(desc(quizResponses.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      const leads = await query;
      
      // Filtrar por busca se necessário
      const filteredLeads = input.search 
        ? leads.filter(lead => 
            (lead.name?.toLowerCase().includes(input.search!.toLowerCase())) ||
            (lead.email?.toLowerCase().includes(input.search!.toLowerCase())) ||
            (lead.phone?.includes(input.search!))
          )
        : leads;
      
      return filteredLeads;
    }),
  
  // Listar personals para envio
  listPersonalsForMessaging: ownerProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["all", "active", "trial", "expired"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }: { input: { search?: string; status?: string; limit: number; offset: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      let conditions = [sql`${users.phone} IS NOT NULL AND ${users.phone} != ''`];
      
      if (input.status && input.status !== "all") {
        conditions.push(sql`${personals.subscriptionStatus} = ${input.status}`);
      }
      
      if (input.search) {
        conditions.push(
          or(
            sql`${users.name} LIKE ${`%${input.search}%`}`,
            sql`${users.email} LIKE ${`%${input.search}%`}`,
            sql`${users.phone} LIKE ${`%${input.search}%`}`
          )!
        );
      }
      
      const personalsList = await db.select({
        id: personals.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        subscriptionStatus: personals.subscriptionStatus,
        subscriptionExpiresAt: personals.subscriptionExpiresAt,
        createdAt: personals.createdAt,
      })
        .from(personals)
        .leftJoin(users, eq(personals.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(personals.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      return personalsList;
    }),
});
