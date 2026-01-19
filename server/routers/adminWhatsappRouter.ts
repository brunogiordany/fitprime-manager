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
  users,
  leadFunnelStages,
  leadFunnelHistory,
  whatsappMessageSuggestions,
  whatsappNumbers,
  whatsappBulkSendQueue,
  whatsappDailyStats,
  leadTags,
  leadTagAssignments
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
        "lead_followup_2days",
        "lead_followup_5days",
        "lead_followup_7days",
        "lead_followup_10days",
        "lead_followup_15days",
        "lead_followup_21days",
        "lead_followup_30days",
        "lead_followup_45days",
        "lead_followup_90days",
        "lead_reactivation_cold",
        "lead_reactivation_warm",
        "lead_reactivation_hot",
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
      // ==================== SEQUÊNCIA DE NUTRIÇÃO DE LEADS ====================
      {
        name: "Follow-up 2 Dias",
        description: "Nutrição: 2 dias após cadastro sem conversão",
        trigger: "lead_followup_2days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 👋

Vi que você conheceu o FitPrime há 2 dias. Como está sendo sua experiência?

Se precisar de ajuda para configurar algo ou tiver dúvidas, é só me chamar!

Estou aqui para te ajudar a ter sucesso. 💪`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 5 Dias",
        description: "Nutrição: 5 dias após cadastro sem conversão",
        trigger: "lead_followup_5days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Já se passaram 5 dias desde que você conheceu o FitPrime. 📅

💡 *Dica do dia*: Você sabia que pode criar treinos personalizados com IA em segundos?

Quer que eu te mostre como funciona? É muito fácil!

Abraço,
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 10 Dias",
        description: "Nutrição: 10 dias após cadastro sem conversão",
        trigger: "lead_followup_10days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Faz 10 dias que você conheceu o FitPrime. Quero compartilhar algo especial com você! 🎁

📊 *Case de sucesso*: Personal trainers que usam o FitPrime economizam em média 10 horas por semana na gestão de alunos.

Imagina o que você poderia fazer com esse tempo extra?

Vamos conversar? Estou aqui! 😊`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 15 Dias",
        description: "Nutrição: 15 dias após cadastro sem conversão",
        trigger: "lead_followup_15days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Já faz 15 dias... Senti sua falta por aqui! 😢

Sei que a rotina de personal é corrida, mas quero te mostrar como o FitPrime pode facilitar sua vida.

🎯 *Oferta especial*: Que tal um desconto exclusivo para você começar?

Me conta: qual é o maior desafio que você enfrenta hoje na gestão dos seus alunos?`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 21 Dias",
        description: "Nutrição: 21 dias após cadastro sem conversão",
        trigger: "lead_followup_21days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

3 semanas se passaram desde nosso primeiro contato. 📆

💡 Você sabia que 80% dos personals que testam o FitPrime decidem assinar?

O que está te impedindo de dar esse passo?

Quero entender melhor sua situação para ver como posso te ajudar. Vamos conversar? 🤝`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 30 Dias",
        description: "Nutrição: 30 dias após cadastro sem conversão",
        trigger: "lead_followup_30days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

1 mês se passou desde que você conheceu o FitPrime. 📅

🎁 *Última chance*: Preparei uma condição especial só para você!

Use o cupom *VOLTEI30* e ganhe *30% de desconto* na primeira mensalidade.

Essa oferta é válida apenas por 48 horas!

Clique aqui para assinar: {{link_assinatura}}

Não perca! 💪`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 45 Dias",
        description: "Nutrição: 45 dias após cadastro sem conversão",
        trigger: "lead_followup_45days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Faz um tempo que não nos falamos... 😔

Quero te contar que lançamos novas funcionalidades incríveis no FitPrime:

✨ Treinos com IA ainda mais inteligentes
✨ Automações de WhatsApp
✨ Relatórios detalhados

Que tal dar uma nova chance? Estou aqui se quiser conversar!

Abraço,
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Follow-up 90 Dias",
        description: "Reativação: 90 dias após cadastro sem conversão",
        trigger: "lead_followup_90days" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Faz 3 meses que você conheceu o FitPrime. Muita coisa mudou desde então! 🚀

🎁 *Oferta de reativação*: Como sinal de que queremos você de volta, estou oferecendo:

✅ *50% de desconto* na primeira mensalidade
✅ *7 dias grátis* para testar novamente

Use o cupom: *VOLTEI90*

Clique aqui: {{link_assinatura}}

Essa é sua chance de transformar sua carreira! 💪`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      // ==================== REATIVAÇÃO POR TEMPERATURA ====================
      {
        name: "Reativação Lead Frio",
        description: "Reativação de leads frios (sem interação há muito tempo)",
        trigger: "lead_reactivation_cold" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Faz um tempo que não nos falamos, mas quero te contar uma novidade! 🌟

O FitPrime evoluiu muito e agora oferece:

🤖 IA que cria treinos personalizados em segundos
📱 App exclusivo para seus alunos
💰 Gestão financeira completa

Que tal conhecer as novidades? Posso te mostrar!

Abraço,
Equipe FitPrime`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Reativação Lead Morno",
        description: "Reativação de leads mornos (alguma interação recente)",
        trigger: "lead_reactivation_warm" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 

Vi que você demonstrou interesse no FitPrime recentemente. 👀

Posso te ajudar com alguma dúvida? Estou aqui para isso!

🎁 *Oferta especial*: Se assinar hoje, ganhe 20% de desconto!

Vamos conversar? 😊`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
      },
      {
        name: "Reativação Lead Quente",
        description: "Reativação de leads quentes (alta intenção de compra)",
        trigger: "lead_reactivation_hot" as const,
        targetType: "lead" as const,
        messageTemplate: `Olá {{nome}}! 🔥

Vi que você está muito perto de começar sua jornada com o FitPrime!

🚨 *Últimas vagas*: Estamos com uma promoção especial que termina hoje!

✅ Acesso completo
✅ Suporte prioritário
✅ Treinamento exclusivo

Não perca essa oportunidade! Posso te ajudar a finalizar agora? 💪`,
        isActive: true,
        delayMinutes: 0,
        excludeExistingPersonals: true,
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

  // ==================== CRM DE LEADS - FUNIL ====================
  
  // Listar leads com estágio do funil e tags
  listLeadsWithFunnel: ownerProcedure
    .input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      tagIds: z.array(z.number()).optional(),
      dateFilter: z.string().optional(), // all, 7days, 15days, 30days, 60days, 90days
      lastInteractionFilter: z.string().optional(), // all, never, 1day, 3days, 7days, 15days, 30days
      sourceFilter: z.string().optional(), // all, quiz, quiz_trial, direct, referral
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }: { input: { search?: string; stage?: string; tagIds?: number[]; dateFilter?: string; lastInteractionFilter?: string; sourceFilter?: string; limit: number; offset: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar leads com estágio do funil
      const leads = await db.select({
        id: quizResponses.id,
        name: quizResponses.leadName,
        email: quizResponses.leadEmail,
        phone: quizResponses.leadPhone,
        createdAt: quizResponses.createdAt,
        studentsCount: quizResponses.studentsCount,
        recommendedProfile: quizResponses.recommendedProfile,
        convertedToTrial: quizResponses.convertedToTrial,
        convertedToPaid: quizResponses.convertedToPaid,
      })
        .from(quizResponses)
        .where(sql`${quizResponses.leadPhone} IS NOT NULL AND ${quizResponses.leadPhone} != ''`)
        .orderBy(desc(quizResponses.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      // Buscar estágios do funil para cada lead
      const leadIds = leads.map(l => l.id);
      const stages = leadIds.length > 0 
        ? await db.select()
            .from(leadFunnelStages)
            .where(sql`${leadFunnelStages.leadId} IN (${sql.join(leadIds.map(id => sql`${id}`), sql`, `)})`)
        : [];
      
      // Buscar tags para cada lead
      const tagAssignments = leadIds.length > 0
        ? await db.select({
            leadId: leadTagAssignments.leadId,
            tagId: leadTagAssignments.tagId,
            tagName: leadTags.name,
            tagColor: leadTags.color,
          })
            .from(leadTagAssignments)
            .leftJoin(leadTags, eq(leadTagAssignments.tagId, leadTags.id))
            .where(sql`${leadTagAssignments.leadId} IN (${sql.join(leadIds.map(id => sql`${id}`), sql`, `)})`)
        : [];
      
      // Buscar personais com trial para verificar status real
      const personalsWithTrial = await db.select({
        email: users.email,
        subscriptionStatus: personals.subscriptionStatus,
        trialEndsAt: personals.trialEndsAt,
      })
        .from(personals)
        .innerJoin(users, eq(personals.userId, users.id))
        .where(sql`${users.email} IS NOT NULL`);
      
      // Criar mapa de emails para status
      const emailStatusMap = new Map<string, { status: string; trialEndsAt: Date | null }>();
      for (const p of personalsWithTrial) {
        if (p.email) {
          emailStatusMap.set(p.email.toLowerCase(), {
            status: p.subscriptionStatus || 'trial',
            trialEndsAt: p.trialEndsAt,
          });
        }
      }
      
      const now = new Date();
      
      // Combinar dados
      const leadsWithFunnel = leads.map(lead => {
        const stageInfo = stages.find(s => s.leadId === lead.id);
        const leadTags = tagAssignments.filter(t => t.leadId === lead.id);
        
        // Determinar estágio automaticamente se não existir
        let stage = stageInfo?.stage || 'new_lead';
        if (!stageInfo) {
          // Verificar status real do personal se existir
          const personalStatus = lead.email ? emailStatusMap.get(lead.email.toLowerCase()) : null;
          
          if (personalStatus) {
            if (personalStatus.status === 'active') {
              stage = 'converted';
            } else if (personalStatus.status === 'trial') {
              // Verificar se trial ainda está ativo
              if (personalStatus.trialEndsAt && new Date(personalStatus.trialEndsAt) > now) {
                stage = 'trial_active';
              } else {
                stage = 'trial_expired';
              }
            } else if (personalStatus.status === 'expired') {
              stage = 'trial_expired';
            } else if (personalStatus.status === 'cancelled') {
              stage = 'lost';
            }
          } else if (lead.convertedToPaid) {
            stage = 'converted';
          } else if (lead.convertedToTrial) {
            stage = 'trial_active'; // Fallback se não encontrar personal
          } else if (lead.recommendedProfile) {
            stage = 'quiz_completed';
          }
        }
        
        return {
          ...lead,
          stage,
          tags: leadTags.map(t => ({ id: t.tagId, name: t.tagName, color: t.tagColor })),
          lastInteraction: stageInfo?.changedAt || null,
          source: lead.recommendedProfile ? 'quiz' : 'direct', // Determinar origem baseado nos dados
        };
      });
      
      // Filtrar por estágio se necessário
      let filteredLeads = leadsWithFunnel;
      if (input.stage && input.stage !== 'all') {
        filteredLeads = filteredLeads.filter(l => l.stage === input.stage);
      }
      
      // Filtrar por tags se necessário
      if (input.tagIds && input.tagIds.length > 0) {
        filteredLeads = filteredLeads.filter(l => 
          l.tags.some(t => input.tagIds!.includes(t.id!))
        );
      }
      
      // Filtrar por busca
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredLeads = filteredLeads.filter(l =>
          l.name?.toLowerCase().includes(searchLower) ||
          l.email?.toLowerCase().includes(searchLower) ||
          l.phone?.includes(input.search!)
        );
      }
      
      // Filtrar por data de cadastro
      if (input.dateFilter && input.dateFilter !== 'all') {
        const now = new Date();
        let daysAgo = 0;
        switch (input.dateFilter) {
          case '7days': daysAgo = 7; break;
          case '15days': daysAgo = 15; break;
          case '30days': daysAgo = 30; break;
          case '60days': daysAgo = 60; break;
          case '90days': daysAgo = 90; break;
        }
        if (daysAgo > 0) {
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          filteredLeads = filteredLeads.filter(l => {
            const createdAt = l.createdAt ? new Date(l.createdAt) : null;
            return createdAt && createdAt >= cutoffDate;
          });
        }
      }
      
      // Filtrar por última interação
      if (input.lastInteractionFilter && input.lastInteractionFilter !== 'all') {
        const now = new Date();
        if (input.lastInteractionFilter === 'never') {
          filteredLeads = filteredLeads.filter(l => !l.lastInteraction);
        } else {
          let daysAgo = 0;
          switch (input.lastInteractionFilter) {
            case '1day': daysAgo = 1; break;
            case '3days': daysAgo = 3; break;
            case '7days': daysAgo = 7; break;
            case '15days': daysAgo = 15; break;
            case '30days': daysAgo = 30; break;
          }
          if (daysAgo > 0) {
            const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            filteredLeads = filteredLeads.filter(l => {
              const lastInteraction = l.lastInteraction ? new Date(l.lastInteraction) : null;
              return lastInteraction && lastInteraction >= cutoffDate;
            });
          }
        }
      }
      
      // Filtrar por origem
      if (input.sourceFilter && input.sourceFilter !== 'all') {
        filteredLeads = filteredLeads.filter(l => l.source === input.sourceFilter);
      }
      
      // DEDUPLICAÇÃO: Remover leads duplicados por telefone (manter o mais recente)
      const seenPhones = new Map<string, typeof filteredLeads[0]>();
      for (const lead of filteredLeads) {
        const normalizedPhone = lead.phone?.replace(/\D/g, '') || '';
        if (normalizedPhone) {
          const existing = seenPhones.get(normalizedPhone);
          if (!existing || (lead.createdAt && existing.createdAt && new Date(lead.createdAt) > new Date(existing.createdAt))) {
            seenPhones.set(normalizedPhone, lead);
          }
        } else {
          // Se não tem telefone, incluir mesmo assim (usar email como chave)
          const key = lead.email?.toLowerCase() || `no-contact-${lead.id}`;
          if (!seenPhones.has(key)) {
            seenPhones.set(key, lead);
          }
        }
      }
      
      // Retornar leads únicos ordenados por data de criação (mais recentes primeiro)
      const uniqueLeads = Array.from(seenPhones.values())
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      
      return uniqueLeads;
    }),
  
  // Atualizar estágio do lead no funil
  updateLeadStage: ownerProcedure
    .input(z.object({
      leadId: z.number(),
      stage: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }: { input: { leadId: number; stage: string; notes?: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar estágio atual
      const [currentStage] = await db.select()
        .from(leadFunnelStages)
        .where(eq(leadFunnelStages.leadId, input.leadId))
        .limit(1);
      
      const previousStage = currentStage?.stage || null;
      
      if (currentStage) {
        // Atualizar estágio existente
        await db.update(leadFunnelStages)
          .set({
            stage: input.stage as any,
            previousStage,
            changedAt: new Date(),
            changedBy: 'admin',
            notes: input.notes,
          })
          .where(eq(leadFunnelStages.id, currentStage.id));
      } else {
        // Criar novo registro de estágio
        await db.insert(leadFunnelStages).values({
          leadId: input.leadId,
          stage: input.stage as any,
          previousStage: null,
          changedBy: 'admin',
          notes: input.notes,
        });
      }
      
      // Registrar no histórico
      await db.insert(leadFunnelHistory).values({
        leadId: input.leadId,
        fromStage: previousStage,
        toStage: input.stage,
        changedBy: 'admin',
        reason: input.notes,
      });
      
      return { success: true };
    }),
  
  // Obter contagem de leads por estágio
  getFunnelStats: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Buscar todos os leads
    const leads = await db.select({
      id: quizResponses.id,
      convertedToTrial: quizResponses.convertedToTrial,
      convertedToPaid: quizResponses.convertedToPaid,
      recommendedProfile: quizResponses.recommendedProfile,
      leadEmail: quizResponses.leadEmail,
    })
      .from(quizResponses)
      .where(sql`${quizResponses.leadPhone} IS NOT NULL`);
    
    // Buscar estágios salvos
    const stages = await db.select()
      .from(leadFunnelStages);
    
    // Buscar personais com trial para verificar status real
    const personalsWithTrial = await db.select({
      email: users.email,
      subscriptionStatus: personals.subscriptionStatus,
      trialEndsAt: personals.trialEndsAt,
      subscriptionExpiresAt: personals.subscriptionExpiresAt,
    })
      .from(personals)
      .innerJoin(users, eq(personals.userId, users.id))
      .where(sql`${users.email} IS NOT NULL`);
    
    // Criar mapa de emails para status
    const emailStatusMap = new Map<string, { status: string; trialEndsAt: Date | null }>();
    for (const p of personalsWithTrial) {
      if (p.email) {
        emailStatusMap.set(p.email.toLowerCase(), {
          status: p.subscriptionStatus || 'trial',
          trialEndsAt: p.trialEndsAt,
        });
      }
    }
    
    // Contar por estágio
    const stageCounts: Record<string, number> = {
      new_lead: 0,
      quiz_started: 0,
      quiz_completed: 0,
      trial_started: 0,
      trial_active: 0,
      trial_expiring: 0,
      trial_expired: 0,
      converted: 0,
      lost: 0,
      reengagement: 0,
    };
    
    const now = new Date();
    
    for (const lead of leads) {
      const stageInfo = stages.find(s => s.leadId === lead.id);
      let stage = stageInfo?.stage || 'new_lead';
      
      if (!stageInfo) {
        // Verificar status real do personal se existir
        const personalStatus = lead.leadEmail ? emailStatusMap.get(lead.leadEmail.toLowerCase()) : null;
        
        if (personalStatus) {
          if (personalStatus.status === 'active') {
            stage = 'converted';
          } else if (personalStatus.status === 'trial') {
            // Verificar se trial ainda está ativo
            if (personalStatus.trialEndsAt && new Date(personalStatus.trialEndsAt) > now) {
              stage = 'trial_active';
            } else {
              stage = 'trial_expired';
            }
          } else if (personalStatus.status === 'expired') {
            stage = 'trial_expired';
          } else if (personalStatus.status === 'cancelled') {
            stage = 'lost';
          }
        } else if (lead.convertedToPaid) {
          stage = 'converted';
        } else if (lead.convertedToTrial) {
          stage = 'trial_active'; // Fallback se não encontrar personal
        } else if (lead.recommendedProfile) {
          stage = 'quiz_completed';
        }
      }
      
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }
    
    return stageCounts;
  }),
  
  // ==================== SUGESTÕES DE MENSAGEM ====================
  
  // Listar sugestões de mensagem por estágio
  getMessageSuggestions: ownerProcedure
    .input(z.object({
      stage: z.string().optional(),
    }))
    .query(async ({ input }: { input: { stage?: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      let query = db.select().from(whatsappMessageSuggestions);
      
      if (input.stage) {
        query = query.where(eq(whatsappMessageSuggestions.stage, input.stage)) as any;
      }
      
      const suggestions = await query.orderBy(desc(whatsappMessageSuggestions.usageCount));
      return suggestions;
    }),
  
  // Incrementar uso de sugestão
  incrementSuggestionUsage: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.update(whatsappMessageSuggestions)
        .set({ usageCount: sql`${whatsappMessageSuggestions.usageCount} + 1` })
        .where(eq(whatsappMessageSuggestions.id, input.id));
      
      return { success: true };
    }),
  
  // ==================== MÚLTIPLOS NÚMEROS WHATSAPP ====================
  
  // Listar números WhatsApp
  listWhatsappNumbers: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const numbers = await db.select().from(whatsappNumbers).orderBy(whatsappNumbers.priority);
    return numbers;
  }),
  
  // Adicionar número WhatsApp
  addWhatsappNumber: ownerProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      stevoApiKey: z.string().optional(),
      stevoInstanceName: z.string().optional(),
      stevoServer: z.string().default("sm15"),
      dailyMessageLimit: z.number().default(200),
      priority: z.number().default(1),
    }))
    .mutation(async ({ input }: { input: { name: string; phone: string; stevoApiKey?: string; stevoInstanceName?: string; stevoServer: string; dailyMessageLimit: number; priority: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [result] = await db.insert(whatsappNumbers).values(input);
      return { success: true, id: result.insertId };
    }),
  
  // Atualizar número WhatsApp
  updateWhatsappNumber: ownerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      stevoApiKey: z.string().optional(),
      stevoInstanceName: z.string().optional(),
      stevoServer: z.string().optional(),
      dailyMessageLimit: z.number().optional(),
      priority: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }: { input: { id: number; name?: string; stevoApiKey?: string; stevoInstanceName?: string; stevoServer?: string; dailyMessageLimit?: number; priority?: number; isActive?: boolean } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, ...updateData } = input;
      await db.update(whatsappNumbers)
        .set(updateData)
        .where(eq(whatsappNumbers.id, id));
      
      return { success: true };
    }),
  
  // Deletar número WhatsApp
  deleteWhatsappNumber: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.delete(whatsappNumbers).where(eq(whatsappNumbers.id, input.id));
      return { success: true };
    }),
  
  // ==================== ENVIO EM MASSA COM DELAY E SEGURANÇA ====================
  
  // Obter limites de envio do dia
  getDailyLimits: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Buscar números ativos
    const numbers = await db.select().from(whatsappNumbers).where(eq(whatsappNumbers.isActive, true));
    
    // Buscar mensagens enviadas hoje
    const [sentToday] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(adminWhatsappMessages)
      .where(and(
        gte(adminWhatsappMessages.createdAt, today),
        eq(adminWhatsappMessages.status, 'sent')
      ));
    
    // Calcular limites
    const totalLimit = numbers.reduce((sum, n) => sum + (n.dailyMessageLimit || 200), 0);
    const used = sentToday?.count || 0;
    const remaining = Math.max(0, totalLimit - used);
    
    // Alertas
    const alerts: string[] = [];
    if (remaining < 20) {
      alerts.push('⚠️ Limite diário quase atingido! Restam apenas ' + remaining + ' mensagens.');
    }
    if (used > totalLimit * 0.8) {
      alerts.push('🔶 Você já usou mais de 80% do limite diário.');
    }
    
    return {
      totalLimit,
      used,
      remaining,
      alerts,
      numbers: numbers.map(n => ({
        id: n.id,
        name: n.name,
        phone: n.phone,
        limit: n.dailyMessageLimit,
        sentToday: n.messagesSentToday,
        status: n.status,
      })),
    };
  }),
  
  // Enviar em massa com delay e segurança
  sendBulkWithDelay: ownerProcedure
    .input(z.object({
      leadIds: z.array(z.number()),
      message: z.string().min(1),
      delayMin: z.number().default(6000), // 6 segundos mínimo
      delayMax: z.number().default(7000), // 7 segundos máximo
    }))
    .mutation(async ({ input }: { input: { leadIds: number[]; message: string; delayMin: number; delayMax: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar limites
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const numbers = await db.select().from(whatsappNumbers).where(eq(whatsappNumbers.isActive, true));
      const totalLimit = numbers.reduce((sum, n) => sum + (n.dailyMessageLimit || 200), 0);
      
      const [sentToday] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(adminWhatsappMessages)
        .where(and(
          gte(adminWhatsappMessages.createdAt, today),
          eq(adminWhatsappMessages.status, 'sent')
        ));
      
      const used = sentToday?.count || 0;
      const remaining = totalLimit - used;
      
      if (input.leadIds.length > remaining) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Limite diário insuficiente. Restam ${remaining} mensagens, mas você está tentando enviar ${input.leadIds.length}.`
        });
      }
      
      // Buscar configuração principal ou primeiro número ativo
      let config = await db.select().from(adminWhatsappConfig).limit(1).then(r => r[0]);
      if (!config?.stevoApiKey && numbers.length > 0) {
        const firstNumber = numbers[0];
        config = {
          stevoApiKey: firstNumber.stevoApiKey,
          stevoInstanceName: firstNumber.stevoInstanceName,
          stevoServer: firstNumber.stevoServer,
        } as any;
      }
      
      if (!config?.stevoApiKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp não configurado" });
      }
      
      // Buscar leads
      const leads = await db.select()
        .from(quizResponses)
        .where(sql`${quizResponses.id} IN (${sql.join(input.leadIds.map(id => sql`${id}`), sql`, `)})`);
      
      // Criar lote de envio
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const results = { queued: 0, failed: 0, errors: [] as string[] };
      
      let delayAccumulator = 0;
      for (const lead of leads) {
        if (!lead.leadPhone) {
          results.failed++;
          results.errors.push(`${lead.leadName}: Sem telefone`);
          continue;
        }
        
        // Calcular delay alternado (6s, 7s, 6s, 7s...)
        const delay = delayAccumulator % 2 === 0 ? input.delayMin : input.delayMax;
        delayAccumulator++;
        
        // Substituir variáveis
        const personalizedMessage = input.message
          .replace(/{{nome}}/g, lead.leadName || '')
          .replace(/{{email}}/g, lead.leadEmail || '')
          .replace(/{{plano}}/g, lead.recommendedPlan || '');
        
        // Adicionar à fila
        await db.insert(whatsappBulkSendQueue).values({
          batchId,
          leadId: lead.id,
          phone: lead.leadPhone,
          message: personalizedMessage,
          status: 'pending',
          delayMs: delay,
          scheduledAt: new Date(Date.now() + (delayAccumulator * delay)),
        });
        
        results.queued++;
      }
      
      // Processar fila em background (simplificado - em produção usar job queue)
      processWhatsappQueue(db, config, batchId).catch(console.error);
      
      return {
        batchId,
        ...results,
        message: `${results.queued} mensagens adicionadas à fila. Envio com delay de ${input.delayMin/1000}-${input.delayMax/1000}s entre cada.`
      };
    }),
  
  // Obter status do lote de envio
  getBulkSendStatus: ownerProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ input }: { input: { batchId: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const items = await db.select()
        .from(whatsappBulkSendQueue)
        .where(eq(whatsappBulkSendQueue.batchId, input.batchId));
      
      const stats = {
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        sending: items.filter(i => i.status === 'sending').length,
        sent: items.filter(i => i.status === 'sent').length,
        failed: items.filter(i => i.status === 'failed').length,
      };
      
      return stats;
    }),
  
  // ==================== ESTATÍSTICAS WHATSAPP ADMIN ====================
  
  // Obter estatísticas completas
  getWhatsappStats: ownerProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month']).default('today'),
    }))
    .query(async ({ input }: { input: { period: string } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Calcular data inicial
      const now = new Date();
      let startDate = new Date();
      if (input.period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (input.period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setDate(now.getDate() - 30);
      }
      
      // Mensagens no período
      const messages = await db.select()
        .from(adminWhatsappMessages)
        .where(gte(adminWhatsappMessages.createdAt, startDate));
      
      // Estatísticas
      const stats = {
        totalSent: messages.filter(m => m.direction === 'outbound' && m.status === 'sent').length,
        totalReceived: messages.filter(m => m.direction === 'inbound').length,
        totalFailed: messages.filter(m => m.status === 'failed').length,
        byRecipientType: {
          lead: messages.filter(m => m.recipientType === 'lead').length,
          personal: messages.filter(m => m.recipientType === 'personal').length,
        },
        byDay: {} as Record<string, { sent: number; received: number }>,
      };
      
      // Agrupar por dia
      for (const msg of messages) {
        const day = msg.createdAt?.toISOString().split('T')[0] || 'unknown';
        if (!stats.byDay[day]) {
          stats.byDay[day] = { sent: 0, received: 0 };
        }
        if (msg.direction === 'outbound' && msg.status === 'sent') {
          stats.byDay[day].sent++;
        } else if (msg.direction === 'inbound') {
          stats.byDay[day].received++;
        }
      }
      
      return stats;
    }),
  
  // Listar todas as tags disponíveis
  listTags: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const tags = await db.select().from(leadTags).orderBy(leadTags.name);
    return tags;
  }),
  
  // Criar nova tag
  createTag: ownerProcedure
    .input(z.object({
      name: z.string().min(1),
      color: z.string().default("#6b7280"),
      description: z.string().optional(),
      isAutomatic: z.boolean().default(false),
      autoRule: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [tag] = await db.insert(leadTags).values({
        name: input.name,
        color: input.color,
        description: input.description || null,
        isAutomatic: input.isAutomatic,
        autoRule: input.autoRule || null,
      });
      
      return { success: true, tagId: tag.insertId };
    }),
  
  // Atualizar tag
  updateTag: ownerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      color: z.string().optional(),
      description: z.string().optional(),
      isAutomatic: z.boolean().optional(),
      autoRule: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.isAutomatic !== undefined) updateData.isAutomatic = input.isAutomatic;
      if (input.autoRule !== undefined) updateData.autoRule = input.autoRule;
      
      await db.update(leadTags)
        .set(updateData)
        .where(eq(leadTags.id, input.id));
      
      return { success: true };
    }),
  
  // Deletar tag
  deleteTag: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Remover atribuições da tag
      await db.delete(leadTagAssignments).where(eq(leadTagAssignments.tagId, input.id));
      
      // Deletar a tag
      await db.delete(leadTags).where(eq(leadTags.id, input.id));
      
      return { success: true };
    }),
  
  // Atribuir tag a um lead
  assignTagToLead: ownerProcedure
    .input(z.object({
      leadId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se já existe
      const [existing] = await db.select()
        .from(leadTagAssignments)
        .where(and(
          eq(leadTagAssignments.leadId, input.leadId),
          eq(leadTagAssignments.tagId, input.tagId)
        ))
        .limit(1);
      
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
  removeTagFromLead: ownerProcedure
    .input(z.object({
      leadId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.delete(leadTagAssignments)
        .where(and(
          eq(leadTagAssignments.leadId, input.leadId),
          eq(leadTagAssignments.tagId, input.tagId)
        ));
      
      return { success: true };
    }),
  
  // Atribuir tag a múltiplos leads
  assignTagToMultipleLeads: ownerProcedure
    .input(z.object({
      leadIds: z.array(z.number()),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      let assigned = 0;
      for (const leadId of input.leadIds) {
        // Verificar se já existe
        const [existing] = await db.select()
          .from(leadTagAssignments)
          .where(and(
            eq(leadTagAssignments.leadId, leadId),
            eq(leadTagAssignments.tagId, input.tagId)
          ))
          .limit(1);
        
        if (!existing) {
          await db.insert(leadTagAssignments).values({
            leadId,
            tagId: input.tagId,
            assignedBy: "admin",
          });
          assigned++;
        }
      }
      
      return { success: true, assigned };
    }),
  
  // Obter tags de um lead
  getLeadTags: ownerProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const tags = await db.select({
        id: leadTags.id,
        name: leadTags.name,
        color: leadTags.color,
        description: leadTags.description,
        assignedAt: leadTagAssignments.assignedAt,
        assignedBy: leadTagAssignments.assignedBy,
      })
        .from(leadTagAssignments)
        .leftJoin(leadTags, eq(leadTagAssignments.tagId, leadTags.id))
        .where(eq(leadTagAssignments.leadId, input.leadId));
      
      return tags;
    }),
});

// Função auxiliar para processar fila de envio em background
async function processWhatsappQueue(db: any, config: any, batchId: string) {
  const items = await db.select()
    .from(whatsappBulkSendQueue)
    .where(and(
      eq(whatsappBulkSendQueue.batchId, batchId),
      eq(whatsappBulkSendQueue.status, 'pending')
    ))
    .orderBy(whatsappBulkSendQueue.scheduledAt);
  
  for (const item of items) {
    // Atualizar status para sending
    await db.update(whatsappBulkSendQueue)
      .set({ status: 'sending' })
      .where(eq(whatsappBulkSendQueue.id, item.id));
    
    try {
      // Enviar mensagem
      const result = await sendWhatsAppMessage({
        phone: item.phone,
        message: item.message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || 'sm15',
        },
      });
      
      // Atualizar status
      await db.update(whatsappBulkSendQueue)
        .set({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error,
        })
        .where(eq(whatsappBulkSendQueue.id, item.id));
      
      // Salvar no histórico de mensagens
      await db.insert(adminWhatsappMessages).values({
        recipientType: 'lead',
        recipientId: item.leadId,
        recipientPhone: item.phone,
        direction: 'outbound',
        message: item.message,
        status: result.success ? 'sent' : 'failed',
        stevoMessageId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });
      
    } catch (error: any) {
      await db.update(whatsappBulkSendQueue)
        .set({
          status: 'failed',
          errorMessage: error.message,
          retryCount: sql`${whatsappBulkSendQueue.retryCount} + 1`,
        })
        .where(eq(whatsappBulkSendQueue.id, item.id));
    }
    
    // Delay antes da próxima mensagem
    await new Promise(resolve => setTimeout(resolve, item.delayMs || 6000));
  }
}
