import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, ownerProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { createCheckoutSession, getOrCreateStripeCustomer, cancelSubscription, getSubscription, createPaymentLink } from "./stripe";
import { subscriptionRouter } from "./subscription/subscriptionRouter";
import { billingCycleToStripeInterval, priceToCents } from "./stripe/products";
import { supportChatRouter } from "./routers/supportChatRouter";
import { extraChargesRouter } from "./routers/extraChargesRouter";
import { adminExtraChargesRouter } from "./routers/adminExtraChargesRouter";
import { quizRouter } from "./routers/quizRouter";
import { trialRouter } from "./routers/trialRouter";
import { sitePagesRouter, trackingPixelsRouter, abTestsRouter, pageBlocksRouter, pageAssetsRouter, pageVersionsRouter } from "./routers/sitePagesRouter";
import { activationRouter } from "./routers/activationRouter";
import aiAssistant from "./aiAssistant";

// Default plans to seed for new personals
const DEFAULT_PLANS = [
  { name: 'Mensal 1x semana', description: 'Plano mensal com 1 treino por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 1, sessionDuration: 60, price: '0' },
  { name: 'Mensal 2x semana', description: 'Plano mensal com 2 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 2, sessionDuration: 60, price: '0' },
  { name: 'Mensal 3x semana', description: 'Plano mensal com 3 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 3, sessionDuration: 60, price: '0' },
  { name: 'Mensal 4x semana', description: 'Plano mensal com 4 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 4, sessionDuration: 60, price: '0' },
  { name: 'Mensal 5x semana', description: 'Plano mensal com 5 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 5, sessionDuration: 60, price: '0' },
  { name: 'Mensal 6x semana', description: 'Plano mensal com 6 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 6, sessionDuration: 60, price: '0' },
];

// Helper to get or create personal profile
async function getOrCreatePersonal(userId: number) {
  let personal = await db.getPersonalByUserId(userId);
  if (!personal) {
    const personalId = await db.createPersonal({ userId });
    personal = { id: personalId, userId } as any;
    
    // Seed default plans for new personal
    for (const plan of DEFAULT_PLANS) {
      await db.createPlan({ ...plan, personalId, isActive: true });
    }
  }
  return personal;
}

// Helper to check if subscription is valid (with 1 day grace period)
// Considera: trial de 1 dia, acesso de teste (30 dias), e assinatura paga
function isSubscriptionValid(personal: { 
  subscriptionStatus: string; 
  subscriptionExpiresAt: Date | null;
  trialEndsAt?: Date | null;
  testAccessEndsAt?: Date | null;
  createdAt?: Date | null;
}): { valid: boolean; daysOverdue: number } {
  const now = new Date();
  
  // 1. Verificar acesso de teste (liberado pelo owner - 30 dias)
  if (personal.testAccessEndsAt) {
    const testEndsAt = new Date(personal.testAccessEndsAt);
    if (now <= testEndsAt) {
      return { valid: true, daysOverdue: 0 };
    }
  }
  
  // 2. Verificar trial de 1 dia (novos usuários)
  if (personal.subscriptionStatus === 'trial') {
    // Verificar se tem data de término do trial
    if (personal.trialEndsAt) {
      const trialEndsAt = new Date(personal.trialEndsAt);
      if (now <= trialEndsAt) {
        return { valid: true, daysOverdue: 0 };
      } else {
        // Trial expirou
        const daysOverdue = Math.floor((now.getTime() - trialEndsAt.getTime()) / (1000 * 60 * 60 * 24));
        return { valid: false, daysOverdue };
      }
    }
    // Trial sem data definida (legado) - considerar válido por 1 dia a partir do cadastro
    if (personal.createdAt) {
      const createdAt = new Date(personal.createdAt);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 1); // 1 dia de trial
      
      if (now <= trialEnd) {
        return { valid: true, daysOverdue: 0 };
      } else {
        const daysOverdue = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));
        return { valid: false, daysOverdue };
      }
    }
    // Fallback: trial sem data de criação - considerar válido
    return { valid: true, daysOverdue: 0 };
  }
  
  // 3. Cancelado ou expirado
  if (personal.subscriptionStatus === 'cancelled' || personal.subscriptionStatus === 'expired') {
    return { valid: false, daysOverdue: 999 };
  }
  
  // 4. Verificar data de expiração com 1 dia de tolerância (assinatura ativa)
  if (personal.subscriptionExpiresAt) {
    const expiresAt = new Date(personal.subscriptionExpiresAt);
    const gracePeriodEnd = new Date(expiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // 1 dia de tolerância
    
    if (now > gracePeriodEnd) {
      const daysOverdue = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      return { valid: false, daysOverdue };
    }
  }
  
  return { valid: true, daysOverdue: 0 };
}

// Personal-only procedure
const personalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const personal = await getOrCreatePersonal(ctx.user.id);
  return next({ ctx: { ...ctx, personal: personal! } });
});

// Personal procedure that requires active subscription
const paidPersonalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const personal = await getOrCreatePersonal(ctx.user.id);
  
  const { valid, daysOverdue } = isSubscriptionValid(personal as any);
  
  if (!valid) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Sua assinatura está vencida há ${daysOverdue} dia(s). Por favor, renove para continuar usando o sistema.`,
      cause: { type: 'SUBSCRIPTION_EXPIRED', daysOverdue }
    });
  }
  
  return next({ ctx: { ...ctx, personal: personal! } });
});

// Student procedure - for portal do aluno
// Usa autenticação via token JWT (x-student-token header)
const studentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Verificar se tem autenticação de aluno via token JWT
  if (!ctx.studentAuth) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token de aluno não fornecido ou inválido' });
  }
  
  // Buscar dados do aluno pelo ID do token (usa versão pública que não requer personalId)
  const student = await db.getStudentByIdPublic(ctx.studentAuth.studentId);
  if (!student) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
  }
  
  return next({ ctx: { ...ctx, student } });
});

// ==================== AI ASSISTANT ROUTER ====================
const aiAssistantRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const personal = await getOrCreatePersonal(ctx.user.id);
    if (!personal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Personal não encontrado' });
    const config = await db.getAiAssistantConfig(personal.id);
    return config;
  }),
  
  // Gerar sugestões com IA para os campos de configuração
  generateSuggestions: protectedProcedure
    .input(z.object({
      field: z.enum([
        "personalBio",
        "servicesOffered",
        "workingHoursDescription",
        "locationDescription",
        "priceRange",
        "welcomeMessageLead",
        "welcomeMessageStudent",
        "awayMessage",
        "customPersonality",
        "all"
      ]),
      context: z.object({
        personalName: z.string().optional(),
        assistantName: z.string().optional(),
        assistantGender: z.enum(["male", "female", "neutral"]).optional(),
        communicationTone: z.enum(["formal", "casual", "motivational", "friendly"]).optional(),
        existingBio: z.string().optional(),
        existingServices: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const personal = await getOrCreatePersonal(ctx.user.id);
      if (!personal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Personal não encontrado' });
      
      const personalName = input.context?.personalName || personal.businessName || "Personal";
      const assistantName = input.context?.assistantName || "Sofia";
      const gender = input.context?.assistantGender || "female";
      const tone = input.context?.communicationTone || "friendly";
      const genderText = gender === "female" ? "feminino" : gender === "male" ? "masculino" : "neutro";
      const toneText = tone === "formal" ? "formal e profissional" : tone === "casual" ? "casual e descontraído" : tone === "motivational" ? "motivacional e energético" : "amigável e acolhedor";
      
      const prompts: Record<string, string> = {
        personalBio: `Crie uma bio profissional curta (2-3 frases) para um personal trainer chamado ${personalName}. 
A bio deve destacar experiência, especializações e diferenciais.
Exemplo: "Personal trainer com 8 anos de experiência, especializado em emagrecimento e hipertrofia. Formado em Educação Física com pós-graduação em Fisiologia do Exercício."
Retorne APENAS a bio, sem explicações.`,
        
        servicesOffered: `Liste os serviços típicos oferecidos por um personal trainer moderno.
Exemplo: "Personal presencial, consultoria online, acompanhamento nutricional, treinos personalizados, avaliação física completa"
Retorne APENAS a lista de serviços separados por vírgula, sem explicações.`,
        
        workingHoursDescription: `Descreva horários de atendimento típicos de um personal trainer.
Exemplo: "Segunda a sexta das 6h às 21h, sábados das 8h às 14h"
Retorne APENAS a descrição de horários, sem explicações.`,
        
        locationDescription: `Sugira uma descrição de local de atendimento para personal trainer.
Exemplo: "Atendimento em academias parceiras, domicílio ou online"
Retorne APENAS a descrição do local, sem explicações.`,
        
        priceRange: `Sugira uma faixa de preço típica para serviços de personal trainer no Brasil.
Exemplo: "R$ 150-300 por sessão, pacotes a partir de R$ 800/mês"
Retorne APENAS a faixa de preço, sem explicações.`,
        
        welcomeMessageLead: `Crie uma mensagem de boas-vindas ${toneText} para novos leads (pessoas interessadas) de um personal trainer.
A assistente se chama ${assistantName} (gênero ${genderText}).
A mensagem deve:
- Ser curta (2-3 frases)
- Cumprimentar de forma calorosa
- Se apresentar como assistente do ${personalName}
- Perguntar como pode ajudar
- Usar emojis moderadamente
Exemplo: "Oi! 👋 Tudo bem? Sou a ${assistantName}, da equipe do ${personalName}. Vi que você entrou em contato! Como posso te ajudar hoje?"
Retorne APENAS a mensagem, sem explicações.`,
        
        welcomeMessageStudent: `Crie uma mensagem de boas-vindas ${toneText} para alunos já cadastrados de um personal trainer.
A assistente se chama ${assistantName} (gênero ${genderText}).
A mensagem deve:
- Ser curta (1-2 frases)
- Ser mais íntima/familiar
- Perguntar como pode ajudar
- Usar emojis moderadamente
Exemplo: "E aí! 💪 Tudo certo por aí? Em que posso te ajudar hoje?"
Retorne APENAS a mensagem, sem explicações.`,
        
        awayMessage: `Crie uma mensagem automática ${toneText} para quando o atendimento estiver fora do horário.
A assistente se chama ${assistantName} (gênero ${genderText}).
A mensagem deve:
- Informar que está fora do horário
- Garantir que a mensagem será respondida
- Ser acolhedora
- Usar emojis moderadamente
Exemplo: "Oi! Estamos fora do horário de atendimento agora, mas recebi sua mensagem e vou passar para o ${personalName}. Ele te responde assim que possível! 🙏"
Retorne APENAS a mensagem, sem explicações.`,
        
        customPersonality: `Crie instruções de personalidade para uma IA assistente de personal trainer.
O tom deve ser ${toneText}.
Exemplo: "Sempre mencione a importância do descanso e recuperação. Use expressões motivacionais como 'bora treinar!' e 'vamos com tudo!'. Seja empátic${gender === "female" ? "a" : "o"} com dificuldades dos alunos."
Retorne APENAS as instruções, sem explicações.`,
      };
      
      if (input.field === "all") {
        // Gerar todas as sugestões de uma vez
        const results: Record<string, string> = {};
        for (const [field, prompt] of Object.entries(prompts)) {
          try {
            const response = await invokeLLM({
              messages: [
                { role: "system", content: "Você é um assistente que gera textos curtos e diretos para configuração de sistemas. Responda APENAS com o texto solicitado, sem explicações ou comentários adicionais." },
                { role: "user", content: prompt }
              ],
            });
            const content = response.choices[0]?.message?.content;
            results[field] = typeof content === 'string' ? content.trim() : "";
          } catch (e) {
            console.error(`Erro ao gerar ${field}:`, e);
            results[field] = "";
          }
        }
        return { suggestions: results };
      } else {
        // Gerar sugestão para um campo específico
        const prompt = prompts[input.field];
        if (!prompt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campo inválido' });
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um assistente que gera textos curtos e diretos para configuração de sistemas. Responda APENAS com o texto solicitado, sem explicações ou comentários adicionais." },
            { role: "user", content: prompt }
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        return { 
          suggestion: typeof content === 'string' ? content.trim() : "",
          field: input.field 
        };
      }
    }),
  
  saveConfig: protectedProcedure
    .input(z.object({
      assistantName: z.string().default("Assistente"),
      assistantGender: z.enum(["male", "female", "neutral"]).default("female"),
      communicationTone: z.enum(["formal", "casual", "motivational", "friendly"]).default("friendly"),
      useEmojis: z.boolean().default(true),
      emojiFrequency: z.enum(["low", "medium", "high"]).default("medium"),
      customPersonality: z.string().optional(),
      personalBio: z.string().optional(),
      servicesOffered: z.string().optional(),
      workingHoursDescription: z.string().optional(),
      locationDescription: z.string().optional(),
      priceRange: z.string().optional(),
      isEnabled: z.boolean().default(true),
      enabledForLeads: z.boolean().default(true),
      enabledForStudents: z.boolean().default(true),
      enabledForInternalChat: z.boolean().default(false),
      autoReplyEnabled: z.boolean().default(true),
      autoReplyStartHour: z.number().min(0).max(23).default(8),
      autoReplyEndHour: z.number().min(0).max(23).default(22),
      autoReplyWeekends: z.boolean().default(true),
      welcomeMessageLead: z.string().optional(),
      welcomeMessageStudent: z.string().optional(),
      awayMessage: z.string().optional(),
      escalateOnKeywords: z.string().optional(),
      escalateAfterMessages: z.number().default(10),
      escalateOnSentiment: z.boolean().default(true),
      canScheduleEvaluation: z.boolean().default(true),
      canScheduleSession: z.boolean().default(true),
      canAnswerWorkoutQuestions: z.boolean().default(true),
      canAnswerDietQuestions: z.boolean().default(true),
      canSendMotivation: z.boolean().default(true),
      canHandlePayments: z.boolean().default(false),
      minResponseDelay: z.number().default(2),
      maxResponseDelay: z.number().default(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const personal = await getOrCreatePersonal(ctx.user.id);
      if (!personal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Personal não encontrado' });
      await db.upsertAiAssistantConfig(personal.id, input as any);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  aiAssistant: aiAssistantRouter,
  supportChat: supportChatRouter,
  extraCharges: extraChargesRouter,
  quiz: quizRouter,
  trial: trialRouter,
  activation: activationRouter,
  sitePages: sitePagesRouter,
  trackingPixels: trackingPixelsRouter,
  abTests: abTestsRouter,
  pageBlocks: pageBlocksRouter,
  pageAssets: pageAssetsRouter,
  pageVersions: pageVersionsRouter,
  
  // ==================== ADMINISTRAÇÃO DO SISTEMA (OWNER ONLY) ====================
  admin: router({
    // Listar todos os personais para gerenciamento
    listPersonals: ownerProcedure.query(async () => {
      const personals = await db.getAllPersonals();
      return personals;
    }),
    
    // Liberar acesso de teste para um personal (30 dias)
    grantTestAccess: ownerProcedure
      .input(z.object({
        personalId: z.number(),
        days: z.number().default(30),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const testAccessEndsAt = new Date();
        testAccessEndsAt.setDate(testAccessEndsAt.getDate() + input.days);
        
        await db.updatePersonalTestAccess(input.personalId, {
          testAccessEndsAt,
          testAccessGrantedBy: ctx.user.name || 'Owner',
          testAccessGrantedAt: new Date(),
        });
        
        return {
          success: true,
          message: `Acesso de teste liberado por ${input.days} dias`,
          expiresAt: testAccessEndsAt,
        };
      }),
    
    // Revogar acesso de teste
    revokeTestAccess: ownerProcedure
      .input(z.object({
        personalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePersonalTestAccess(input.personalId, {
          testAccessEndsAt: null,
          testAccessGrantedBy: null,
          testAccessGrantedAt: null,
        });
        
        return {
          success: true,
          message: 'Acesso de teste revogado',
        };
      }),
    
    // Ativar assinatura manualmente (para testes ou casos especiais)
    activateSubscription: ownerProcedure
      .input(z.object({
        personalId: z.number(),
        days: z.number().default(30),
      }))
      .mutation(async ({ input }) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.days);
        
        await db.updatePersonalSubscription(input.personalId, {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
        });
        
        return {
          success: true,
          message: `Assinatura ativada por ${input.days} dias`,
          expiresAt,
        };
      }),
    
    // Cancelar assinatura manualmente
    cancelSubscription: ownerProcedure
      .input(z.object({
        personalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePersonalSubscription(input.personalId, {
          subscriptionStatus: 'cancelled',
        });
        
        return {
          success: true,
          message: 'Assinatura cancelada',
        };
      }),
    
    // Mover cadastro para lixeira (soft delete)
    deletePersonal: ownerProcedure
      .input(z.object({
        personalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.softDeletePersonal(input.personalId);
        
        return {
          success: true,
          message: 'Cadastro movido para lixeira',
        };
      }),
    
    // Restaurar cadastro da lixeira
    restorePersonal: ownerProcedure
      .input(z.object({
        personalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.restorePersonal(input.personalId);
        
        return {
          success: true,
          message: 'Cadastro restaurado com sucesso',
        };
      }),
    
    // Listar personais na lixeira
    getDeletedPersonals: ownerProcedure.query(async () => {
      return await db.getDeletedPersonals();
    }),
    
    // Excluir permanentemente da lixeira
    deletePersonalPermanently: ownerProcedure
      .input(z.object({
        personalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deletePersonalPermanently(input.personalId);
        
        return {
          success: true,
          message: 'Cadastro excluído permanentemente',
        };
      }),
    
    // Verificar se o usuário atual é o owner
    // Aceita: OWNER_OPEN_ID do ambiente OU usuário com role "admin" no banco
    isOwner: protectedProcedure.query(async ({ ctx }) => {
      const ownerOpenId = process.env.OWNER_OPEN_ID ?? '';
      const isOwnerByOpenId = ownerOpenId && ctx.user.openId === ownerOpenId;
      const isOwnerByRole = ctx.user.role === 'admin';
      
      return {
        isOwner: isOwnerByOpenId || isOwnerByRole,
        ownerName: process.env.OWNER_NAME ?? ctx.user.name ?? 'Admin',
      };
    }),
    
    // Métricas do dashboard admin
    dashboardMetrics: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.getAdminDashboardMetrics();
    }),
    
    // Dados de crescimento
    growthData: ownerProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getGrowthData(input.days);
      }),
    
    // Top personais por alunos
    topPersonalsByStudents: ownerProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getTopPersonalsByStudents(input.limit);
      }),
    
    // Personais mais ativos
    mostActivePersonals: ownerProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getMostActivePersonals(input.limit);
      }),
    
    // Distribuição de assinaturas
    subscriptionDistribution: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.getSubscriptionDistribution();
    }),
    
    // Assinaturas expirando em breve
    expiringSubscriptions: ownerProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getExpiringSubscriptions(input.days);
      }),
    
    // Atividade recente
    recentActivity: ownerProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getRecentActivity(input.limit);
      }),
    
    // Detalhes de um personal
    personalDetails: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalDetailsForAdmin(input.personalId);
      }),
    
    // Métricas de receita
    revenueMetrics: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.getRevenueMetrics();
    }),
    
    // Dados de conversão
    conversionData: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.getConversionData();
    }),
    
    // ==================== NOVOS ENDPOINTS AVANÇADOS ====================
    
    // Lista de alunos de um personal com contatos
    personalStudents: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalStudentsWithContacts(input.personalId);
      }),
    
    // Estatísticas detalhadas de um personal
    personalDetailedStats: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalDetailedStats(input.personalId);
      }),
    
    // Crescimento de alunos de um personal
    personalStudentGrowth: ownerProcedure
      .input(z.object({ personalId: z.number(), days: z.number().default(90) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalStudentGrowth(input.personalId, input.days);
      }),
    
    // Informações de login do personal
    personalLoginInfo: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalLoginInfo(input.personalId);
      }),
    
    // Configurações do personal
    personalConfig: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalConfig(input.personalId);
      }),
    
    // Exportar dados de alunos de um personal
    exportPersonalStudents: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.exportPersonalStudentsData(input.personalId);
      }),
    
    // Exportar todos os personais
    exportAllPersonals: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.exportAllPersonalsData();
    }),
    
    // Todos os contatos de alunos do sistema
    allStudentContacts: ownerProcedure.query(async () => {
      const adminDb = await import('./adminDb');
      return adminDb.getAllStudentContacts();
    }),
    
    // Bloquear/desbloquear personal
    togglePersonalBlock: ownerProcedure
      .input(z.object({ personalId: z.number(), blocked: z.boolean() }))
      .mutation(async ({ input }) => {
        const adminDb = await import('./adminDb');
        const success = await adminDb.togglePersonalBlock(input.personalId, input.blocked);
        return { 
          success, 
          message: input.blocked ? 'Personal bloqueado' : 'Personal desbloqueado' 
        };
      }),
    
    // Resetar senha (envia email de recuperação)
    resetPersonalPassword: ownerProcedure
      .input(z.object({ personalId: z.number() }))
      .mutation(async ({ input }) => {
        const adminDb = await import('./adminDb');
        const personal = await adminDb.getPersonalLoginInfo(input.personalId);
        
        if (!personal || !personal.email) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: 'Personal não encontrado ou sem email' 
          });
        }
        
        // Por enquanto, apenas retorna as informações
        // TODO: Implementar envio de email de recuperação
        return {
          success: true,
          message: `Link de recuperação seria enviado para ${personal.email}`,
          email: personal.email,
        };
      }),
    
    // Dados de crescimento de alunos de um personal (para gráfico)
    personalGrowthChart: ownerProcedure
      .input(z.object({ personalId: z.number(), months: z.number().default(6) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getPersonalStudentGrowthByMonth(input.personalId, input.months);
      }),
    
    // Comparação de crescimento de todos os personais
    allPersonalsGrowth: ownerProcedure
      .input(z.object({ months: z.number().default(6) }))
      .query(async ({ input }) => {
        const adminDb = await import('./adminDb');
        return adminDb.getAllPersonalsGrowthComparison(input.months);
      }),
    
    // Enviar notificação para personal
    notifyPersonal: ownerProcedure
      .input(z.object({
        personalId: z.number(),
        title: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Implementar sistema de notificações
        return {
          success: true,
          message: 'Notificação enviada (simulado)',
        };
      }),
    extraCharges: adminExtraChargesRouter,
  }),
  
  // ==================== SUPORTE COM IA ====================
  support: router({
    askAI: publicProcedure
      .input(z.object({
        question: z.string(),
        context: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: input.context },
              { role: "user", content: input.question },
            ],
          });
          
          const answer = response.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta. Tente novamente.";
          return { answer };
        } catch (error) {
          console.error("Erro ao chamar LLM:", error);
          return { answer: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente mais tarde." };
        }
      }),
  }),
  
  // ==================== SUBSCRIPTION (Planos SaaS) ====================
  subscription: subscriptionRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== PERSONAL PROFILE ====================
  personal: router({
    get: personalProcedure.query(async ({ ctx }) => {
      return ctx.personal;
    }),
    
    update: personalProcedure
      .input(z.object({
        businessName: z.string().optional(),
        cref: z.string().optional(),
        bio: z.string().optional(),
        specialties: z.string().optional(),
        workingHours: z.string().optional(),
        whatsappNumber: z.string().optional(),
        evolutionApiKey: z.string().optional(),
        evolutionInstance: z.string().optional(),
        stevoServer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Atualizar personal
        await db.updatePersonal(ctx.personal.id, input);
        
        // Se CREF foi atualizado, também atualizar na tabela users
        if (input.cref) {
          await db.updateUserCref(ctx.user.id, input.cref);
        }
        
        // Se configurou WhatsApp/Stevo, configurar webhook automaticamente
        if (input.evolutionApiKey && input.evolutionInstance) {
          try {
            const { setWebhook } = await import('./stevo');
            const webhookUrl = 'https://fitprimemanager.com/api/webhook/stevo';
            await setWebhook(
              {
                apiKey: input.evolutionApiKey,
                instanceName: input.evolutionInstance,
                server: input.stevoServer || 'sm15',
              },
              webhookUrl,
              ['All']
            );
            console.log('[Personal Update] Webhook configurado automaticamente:', webhookUrl);
          } catch (error) {
            console.error('[Personal Update] Erro ao configurar webhook:', error);
          }
        }
        
        return { success: true };
      }),
    
    uploadLogo: personalProcedure
      .input(z.object({
        logoData: z.string(), // Base64 encoded image
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.logoData, 'base64');
        const extension = input.mimeType.split('/')[1] || 'png';
        const fileKey = `logos/personal-${ctx.personal.id}-${Date.now()}.${extension}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update personal with logo URL
        await db.updatePersonal(ctx.personal.id, { logoUrl: url });
        
        return { logoUrl: url };
      }),
    
    removeLogo: personalProcedure
      .mutation(async ({ ctx }) => {
        await db.updatePersonal(ctx.personal.id, { logoUrl: null });
        return { success: true };
      }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: personalProcedure.query(async ({ ctx }) => {
      const [totalStudents, monthlyRevenue, sessionStats, pendingCharges] = await Promise.all([
        db.countStudentsByPersonalId(ctx.personal.id),
        db.getMonthlyRevenue(ctx.personal.id),
        db.countSessionsThisMonth(ctx.personal.id),
        db.getPendingChargesCount(ctx.personal.id),
      ]);
      
      const attendanceRate = sessionStats.total > 0 
        ? Math.round((sessionStats.completed / sessionStats.total) * 100) 
        : 0;
      
      return {
        totalStudents,
        monthlyRevenue,
        sessionsThisMonth: sessionStats.total,
        completedSessions: sessionStats.completed,
        noShowSessions: sessionStats.noShow,
        attendanceRate,
        pendingCharges,
      };
    }),
    
    todaySessions: personalProcedure.query(async ({ ctx }) => {
      return await db.getTodaySessions(ctx.personal.id);
    }),
  }),

  // ==================== CHAT (Personal side) ====================
  chat: router({
    // Listar mensagens com um aluno
    messages: personalProcedure
      .input(z.object({ studentId: z.number(), limit: z.number().optional(), source: z.enum(['internal', 'whatsapp', 'all']).optional() }))
      .query(async ({ ctx, input }) => {
        const messages = await db.getChatMessages(ctx.personal.id, input.studentId, input.limit || 50, input.source || 'all');
        // Marcar mensagens do aluno como lidas
        await db.markChatMessagesAsRead(ctx.personal.id, input.studentId, 'personal');
        return messages.reverse(); // Retornar em ordem cronológica
      }),
    
    // Enviar mensagem para um aluno
    send: personalProcedure
      .input(z.object({ 
        studentId: z.number(), 
        message: z.string().optional(),
        messageType: z.enum(['text', 'audio', 'image', 'video', 'file', 'link']).default('text'),
        mediaUrl: z.string().optional(),
        mediaName: z.string().optional(),
        mediaMimeType: z.string().optional(),
        mediaSize: z.number().optional(),
        mediaDuration: z.number().optional(),
        audioTranscription: z.string().optional(),
        linkPreview: z.string().optional(),
        sendViaWhatsApp: z.boolean().default(true), // Enviar também via WhatsApp
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o aluno pertence ao personal
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Aluno não encontrado' });
        }
        
        // Validar que tem mensagem ou mídia
        if (!input.message && !input.mediaUrl) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mensagem ou mídia é obrigatória' });
        }
        
        // Determinar se vai enviar via WhatsApp
        const personal = ctx.personal;
        const willSendViaWhatsApp = input.sendViaWhatsApp && student.phone && student.whatsappOptIn && personal.evolutionApiKey && personal.evolutionInstance;
        
        // Salvar mensagem no banco de dados
        // Se vai enviar via WhatsApp, source = 'whatsapp', senão 'internal'
        const messageId = await db.createChatMessage({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          senderType: 'personal',
          message: input.message || null,
          messageType: input.messageType,
          mediaUrl: input.mediaUrl,
          mediaName: input.mediaName,
          mediaMimeType: input.mediaMimeType,
          mediaSize: input.mediaSize,
          mediaDuration: input.mediaDuration,
          audioTranscription: input.audioTranscription,
          linkPreviewUrl: input.linkPreview,
          source: willSendViaWhatsApp ? 'whatsapp' : 'internal',
        });
        
        // Enviar via WhatsApp/Stevo se habilitado e aluno tem telefone
        let whatsappSent = false;
        let whatsappError = null;
        
        if (willSendViaWhatsApp) {
          try {
              const { sendWhatsAppMessage, sendWhatsAppMedia } = await import('./stevo');
              
              if (input.messageType === 'text' && input.message) {
                // Enviar mensagem de texto
                const result = await sendWhatsAppMessage({
                  phone: student.phone!,
                  message: input.message,
                  config: {
                    apiKey: personal.evolutionApiKey!,
                    instanceName: personal.evolutionInstance!,
                    server: (personal as any).stevoServer || 'sm15',
                  },
                });
                whatsappSent = result.success;
                if (!result.success) whatsappError = result.error;
              } else if (input.mediaUrl) {
                // Enviar mídia (imagem, vídeo, áudio, arquivo)
                const result = await sendWhatsAppMedia({
                  phone: student.phone!,
                  mediaUrl: input.mediaUrl,
                  mediaType: input.messageType as 'image' | 'video' | 'audio' | 'file',
                  caption: input.message || undefined,
                  config: {
                    apiKey: personal.evolutionApiKey!,
                    instanceName: personal.evolutionInstance!,
                    server: (personal as any).stevoServer || 'sm15',
                  },
                });
                whatsappSent = result.success;
                if (!result.success) whatsappError = result.error;
              }
              
              // Registrar no log de mensagens
              await db.createMessageLog({
                personalId: ctx.personal.id,
                studentId: input.studentId,
                phone: student.phone!,
                message: input.message || 'Mídia enviada',
                direction: 'outbound',
                status: whatsappSent ? 'sent' : 'failed',
              });
          } catch (error: any) {
            whatsappError = error.message;
            console.error('Erro ao enviar WhatsApp:', error);
          }
        }
        
        return { 
          success: true, 
          messageId, 
          whatsappSent,
          whatsappError 
        };
      }),
    
    // Editar mensagem
    editMessage: personalProcedure
      .input(z.object({ messageId: z.number(), newMessage: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await db.editChatMessage(input.messageId, ctx.personal.id, 'personal', input.newMessage);
        return { success: true };
      }),
    
    // Excluir mensagem para mim
    deleteForMe: personalProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatMessageForSender(input.messageId, ctx.personal.id, 'personal');
        return { success: true };
      }),
    
    // Excluir mensagem para todos
    deleteForAll: personalProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatMessageForAll(input.messageId, ctx.personal.id, 'personal');
        return { success: true };
      }),
    
    // Enviar mensagem em massa
    broadcast: personalProcedure
      .input(z.object({
        studentIds: z.array(z.number()),
        message: z.string().optional(),
        messageType: z.enum(['text', 'audio', 'image', 'video', 'file', 'link']).default('text'),
        mediaUrl: z.string().optional(),
        mediaName: z.string().optional(),
        mediaMimeType: z.string().optional(),
        mediaSize: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.message && !input.mediaUrl) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mensagem ou mídia é obrigatória' });
        }
        
        const results = [];
        for (const studentId of input.studentIds) {
          const student = await db.getStudentById(studentId, ctx.personal.id);
          if (student) {
            const messageId = await db.createChatMessage({
              personalId: ctx.personal.id,
              studentId,
              senderType: 'personal',
              message: input.message || null,
              messageType: input.messageType,
              mediaUrl: input.mediaUrl,
              mediaName: input.mediaName,
              mediaMimeType: input.mediaMimeType,
              mediaSize: input.mediaSize,
            });
            results.push({ studentId, messageId, success: true });
          }
        }
        return { success: true, sent: results.length, results };
      }),
    
    // Contagem de mensagens não lidas por aluno
    unreadCount: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUnreadChatCount(ctx.personal.id, input.studentId, 'personal');
      }),
    
    // Listar alunos com mensagens não lidas
    studentsWithUnread: personalProcedure.query(async ({ ctx }) => {
      return await db.getStudentsWithUnreadMessages(ctx.personal.id);
    }),
    
    // Total de mensagens não lidas
    totalUnread: personalProcedure.query(async ({ ctx }) => {
      const unreadCounts = await db.getAllUnreadChatCountForPersonal(ctx.personal.id);
      return unreadCounts.reduce((sum, item) => sum + item.count, 0);
    }),
    
    // Transcrever áudio para texto
    transcribeAudio: personalProcedure
      .input(z.object({
        messageId: z.number(),
        audioUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { transcribeAudio } = await import('./_core/voiceTranscription');
        
        // Chamar serviço de transcrição
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: 'pt', // Português como padrão
        });
        
        // Verificar se houve erro
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
            cause: result,
          });
        }
        
        // Atualizar a mensagem com a transcrição
        await db.updateChatMessageTranscription(input.messageId, result.text);
        
        return {
          success: true,
          text: result.text,
          language: result.language,
          duration: result.duration,
        };
      }),
    
    // Upload de mídia para o chat
    uploadMedia: personalProcedure
      .input(z.object({
        studentId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        duration: z.number().optional(), // Para áudio/vídeo
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        
        // Validar tamanho (16MB máximo)
        if (input.fileSize > 16 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Arquivo muito grande. Máximo 16MB.' });
        }
        
        // Verificar se o aluno pertence ao personal
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Aluno não encontrado' });
        }
        
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const fileKey = `chat/${ctx.personal.id}/${input.studentId}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { 
          url, 
          fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          duration: input.duration,
        };
      }),
  }),

  // ==================== STUDENTS ====================
  students: router({
    list: personalProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getStudentsByPersonalId(ctx.personal.id, input);
      }),
    
    // Listar alunos que precisam de nova análise (mais de 30 dias sem análise)
    needsAnalysis: personalProcedure.query(async ({ ctx }) => {
      const allStudents = await db.getStudentsByPersonalId(ctx.personal.id, { status: 'active' });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return allStudents.filter(student => {
        // Nunca foi analisado ou foi analisado há mais de 30 dias
        if (!student.lastAnalyzedAt) return true;
        return new Date(student.lastAnalyzedAt) < thirtyDaysAgo;
      }).map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        avatarUrl: student.avatarUrl,
        lastAnalyzedAt: student.lastAnalyzedAt,
        daysSinceAnalysis: student.lastAnalyzedAt 
          ? Math.floor((Date.now() - new Date(student.lastAnalyzedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null,
      }));
    }),
    
    get: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.id, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        // Buscar o último convite válido do aluno
        const invites = await db.getStudentInvitesByStudentId(student.id);
        const activeInvite = invites.find(i => i.status === 'pending' && new Date(i.expiresAt) > new Date());
        return {
          ...student,
          inviteToken: activeInvite?.inviteToken || null,
        };
      }),
    
    create: personalProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
        cpf: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar limite de alunos antes de criar
        const { canAddStudent, updateStudentCount } = await import('./subscription/subscriptionService');
        const canAdd = await canAddStudent(ctx.personal.id);
        
        if (!canAdd.canAdd) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: canAdd.message || 'Limite de alunos atingido. Faça upgrade do seu plano.' 
          });
        }
        
        const id = await db.createStudent({
          ...input,
          personalId: ctx.personal.id,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        });
        
        // Atualizar contagem de alunos na subscription
        await updateStudentCount(ctx.personal.id);
        
        return { 
          id,
          willBeCharged: canAdd.willBeCharged,
          extraCost: canAdd.extraCost,
          message: canAdd.message || null,
        };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
        cpf: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(['active', 'inactive', 'pending']).optional(),
        whatsappOptIn: z.boolean().optional(),
        canEditAnamnesis: z.boolean().optional(),
        canEditMeasurements: z.boolean().optional(),
        canEditPhotos: z.boolean().optional(),
        canViewCharges: z.boolean().optional(),
        canScheduleSessions: z.boolean().optional(),
        canCancelSessions: z.boolean().optional(),
        canSendMessages: z.boolean().optional(),
        canViewWorkouts: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, birthDate, ...data } = input;
        await db.updateStudent(id, ctx.personal.id, {
          ...data,
          birthDate: birthDate ? new Date(birthDate) : undefined,
        });
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteStudent(input.id, ctx.personal.id);
        return { success: true };
      }),
    
    // Enviar convite para aluno criar conta
    sendInvite: personalProcedure
      .input(z.object({
        studentId: z.number(),
        sendVia: z.enum(['email', 'whatsapp', 'both']).default('both'),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Gerar token único
        const inviteToken = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias
        
        // Criar convite
        await db.createStudentInvite({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          inviteToken,
          email: student.email || undefined,
          phone: student.phone || undefined,
          expiresAt,
        });
        
        // Construir link completo
        const baseUrl = process.env.VITE_APP_URL || 'https://fitprimehub-sfh8sqab.manus.space';
        const inviteLink = `/convite/${inviteToken}`;
        const fullInviteLink = `${baseUrl}${inviteLink}`;
        
        // Enviar email se tiver email cadastrado
        if (student.email && (input.sendVia === 'email' || input.sendVia === 'both')) {
          const { sendInviteEmail } = await import('./email');
          const personalName = ctx.user.name || 'Seu Personal Trainer';
          await sendInviteEmail(student.email, student.name, personalName, fullInviteLink);
        }
        
        return { 
          success: true, 
          inviteLink,
          inviteToken,
          expiresAt,
        };
      }),
    
    // Reenviar convite para aluno (gera novo token ou usa existente)
    resendInvite: personalProcedure
      .input(z.object({
        studentId: z.number(),
        sendVia: z.enum(['email', 'whatsapp', 'both']).default('both'),
        forceNew: z.boolean().default(false), // Se true, gera novo token mesmo se houver um válido
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Verificar se aluno já tem conta ativa
        if (student.passwordHash && student.status === 'active') {
          // Aluno já tem conta, enviar lembrete de acesso
          const baseUrl = process.env.VITE_APP_URL || 'https://fitprimemanager.com';
          const loginLink = `${baseUrl}/login-aluno`;
          
          if (student.email && (input.sendVia === 'email' || input.sendVia === 'both')) {
            const { sendEmail } = await import('./email');
            const personalName = ctx.user.name || 'Seu Personal Trainer';
            await sendEmail({
              to: student.email,
              subject: `💪 Lembrete de Acesso - FitPrime`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #10b981;">Olá, ${student.name}!</h2>
                  <p>${personalName} enviou um lembrete para você acessar seu portal de treinos.</p>
                  <p>Você já tem uma conta cadastrada. Clique no botão abaixo para acessar:</p>
                  <a href="${loginLink}" style="display: inline-block; background: linear-gradient(to right, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Acessar Portal</a>
                  <p style="color: #666; font-size: 14px;">Se você esqueceu sua senha, use a opção "Esqueci minha senha" na tela de login.</p>
                </div>
              `,
              text: `Olá ${student.name}! ${personalName} enviou um lembrete para você acessar seu portal de treinos. Acesse: ${loginLink}`,
            });
          }
          
          return {
            success: true,
            type: 'reminder',
            message: 'Lembrete de acesso enviado! O aluno já possui conta cadastrada.',
            loginLink,
          };
        }
        
        // Buscar convite existente válido
        const invites = await db.getStudentInvitesByStudentId(input.studentId);
        let activeInvite = invites.find(i => i.status === 'pending' && new Date(i.expiresAt) > new Date());
        
        let inviteToken: string;
        let expiresAt: Date;
        
        if (activeInvite && !input.forceNew) {
          // Usar convite existente
          inviteToken = activeInvite.inviteToken;
          expiresAt = new Date(activeInvite.expiresAt);
        } else {
          // Cancelar convites antigos pendentes
          for (const invite of invites.filter(i => i.status === 'pending')) {
            await db.updateStudentInvite(invite.id, { status: 'cancelled' });
          }
          
          // Gerar novo token
          inviteToken = nanoid(32);
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias
          
          // Criar novo convite
          await db.createStudentInvite({
            personalId: ctx.personal.id,
            studentId: input.studentId,
            inviteToken,
            email: student.email || undefined,
            phone: student.phone || undefined,
            expiresAt,
          });
        }
        
        // Construir link completo
        const baseUrl = process.env.VITE_APP_URL || 'https://fitprimemanager.com';
        const inviteLink = `/convite/${inviteToken}`;
        const fullInviteLink = `${baseUrl}${inviteLink}`;
        
        // Enviar email se tiver email cadastrado
        if (student.email && (input.sendVia === 'email' || input.sendVia === 'both')) {
          const { sendInviteEmail } = await import('./email');
          const personalName = ctx.user.name || 'Seu Personal Trainer';
          await sendInviteEmail(student.email, student.name, personalName, fullInviteLink);
        }
        
        return { 
          success: true,
          type: 'invite',
          message: activeInvite && !input.forceNew 
            ? 'Convite reenviado com sucesso!' 
            : 'Novo convite enviado com sucesso!',
          inviteLink,
          inviteToken,
          expiresAt,
        };
      }),

    // Listar convites de um aluno
    getInvites: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentInvitesByStudentId(input.studentId);
      }),
    
    // Buscar convites pendentes que precisam de lembrete
    getPendingInvitesForReminder: personalProcedure
      .input(z.object({ daysAfterSent: z.number().default(3) }))
      .query(async ({ ctx, input }) => {
        return await db.getPendingInvitesForReminder(ctx.personal.id, input.daysAfterSent);
      }),
    
    // Enviar lembrete de convite em massa
    sendInviteReminders: personalProcedure
      .input(z.object({
        daysAfterSent: z.number().default(3),
        sendVia: z.enum(['email', 'whatsapp', 'both']).default('email'),
      }))
      .mutation(async ({ ctx, input }) => {
        const pendingInvites = await db.getPendingInvitesForReminder(ctx.personal.id, input.daysAfterSent);
        
        if (pendingInvites.length === 0) {
          return { sent: 0, message: 'Nenhum convite pendente encontrado' };
        }
        
        let sentCount = 0;
        const baseUrl = process.env.VITE_APP_URL || 'https://fitprimemanager.com';
        
        for (const invite of pendingInvites) {
          try {
            const inviteLink = `${baseUrl}/convite/${invite.inviteToken}`;
            
            // Enviar email de lembrete
            if (input.sendVia === 'email' || input.sendVia === 'both') {
              if (invite.studentEmail) {
                const { sendEmail } = await import('./email');
                await sendEmail({
                  to: invite.studentEmail,
                  subject: `🔔 Lembrete: Crie sua conta no FitPrime`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: linear-gradient(to right, #10b981, #14b8a6); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0;">🔔 Lembrete de Convite</h2>
                      </div>
                      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px;">Olá <strong>${invite.studentName}</strong>!</p>
                        <p>Você recebeu um convite para acessar o portal do aluno, mas ainda não criou sua conta.</p>
                        <p>Com o portal você pode:</p>
                        <ul>
                          <li>📊 Ver seus treinos personalizados</li>
                          <li>📈 Acompanhar sua evolução</li>
                          <li>📅 Receber lembretes das sessões</li>
                          <li>💬 Comunicar-se com seu personal</li>
                        </ul>
                        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(to right, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">Criar Minha Conta</a>
                        <p style="color: #666; margin-top: 20px; font-size: 14px;">Este link expira em ${Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias.</p>
                      </div>
                    </div>
                  `,
                  text: `Olá ${invite.studentName}! Você recebeu um convite para acessar o portal do aluno. Crie sua conta em: ${inviteLink}`,
                });
                sentCount++;
              }
            }
          } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
          }
        }
        
        return { sent: sentCount, total: pendingInvites.length, message: `${sentCount} lembrete(s) enviado(s)` };
      }),
    
    // Validar convite (público - para página de convite)
    validateInvite: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await db.getStudentInviteByToken(input.token);
        if (!invite) {
          return { valid: false, message: 'Convite não encontrado' };
        }
        if (invite.status !== 'pending') {
          return { valid: false, message: 'Este convite já foi usado ou cancelado' };
        }
        if (new Date(invite.expiresAt) < new Date()) {
          return { valid: false, message: 'Este convite expirou' };
        }
        // Buscar nome do personal e aluno
        // Buscar personal pelo userId (precisamos criar função ou usar outra abordagem)
        // Por enquanto, vamos retornar um nome genérico
        const personal = { name: 'Seu Personal Trainer' };
        const student = await db.getStudentById(invite.studentId, invite.personalId);
        return { 
          valid: true, 
          personalName: personal?.name || 'Personal',
          studentName: student?.name || '',
          studentEmail: student?.email || '',
          studentPhone: student?.phone || '',
          studentId: invite.studentId,
          personalId: invite.personalId,
        };
      }),
    
    // Aceitar convite (requer login)
    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await db.getStudentInviteByToken(input.token);
        if (!invite) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Convite não encontrado' });
        }
        if (invite.status !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este convite já foi usado ou cancelado' });
        }
        if (new Date(invite.expiresAt) < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este convite expirou' });
        }
        
        // Vincular usuário ao aluno
        await db.linkStudentToUser(invite.studentId, ctx.user.id);
        
        // Marcar convite como aceito
        await db.updateStudentInvite(invite.id, { status: 'accepted' });
        
        return { success: true };
      }),
    
    // Registrar aluno com convite (sem login prévio)
    registerWithInvite: publicProcedure
      .input(z.object({
        token: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const invite = await db.getStudentInviteByToken(input.token);
        if (!invite) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Convite não encontrado' });
        }
        if (invite.status !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este convite já foi usado ou cancelado' });
        }
        if (new Date(invite.expiresAt) < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este convite expirou' });
        }
        
        // Hash da senha
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Atualizar dados do aluno com as informações do cadastro e senha
        await db.updateStudent(invite.studentId, invite.personalId, {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash: passwordHash,
          status: 'active',
        });
        
        // Marcar convite como aceito
        await db.updateStudentInvite(invite.id, { status: 'accepted' });
        
        // Notificar o personal que o aluno se cadastrou
        const { notifyOwner } = await import('./_core/notification');
        
        // Buscar dados do personal para enviar email
        const personal = await db.getPersonalSubscription(invite.personalId);
        const personalData = personal ? await db.getPersonalByUserId(personal.personalId) : null;
        
        await notifyOwner({
          title: `🎉 Novo Cadastro - ${input.name}`,
          content: `O aluno ${input.name} aceitou o convite e criou sua conta!\n\n📧 Email: ${input.email}\n📱 Telefone: ${input.phone}\n\nO aluno agora pode acessar o portal e preencher sua anamnese.`,
        });
        
        // Enviar email para o personal avisando que o aluno aceitou
        if (personalData) {
          const personalUser = await db.getUserById(personalData.userId);
          if (personalUser?.email) {
            const { sendEmail } = await import('./email');
            await sendEmail({
              to: personalUser.email,
              subject: `🎉 ${input.name} aceitou seu convite!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(to right, #10b981, #14b8a6); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">🎉 Novo Aluno Cadastrado!</h2>
                  </div>
                  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px;">Parabéns! <strong>${input.name}</strong> aceitou seu convite e criou uma conta no FitPrime.</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${input.email}</p>
                      <p style="margin: 5px 0;"><strong>📱 Telefone:</strong> ${input.phone}</p>
                    </div>
                    <p style="color: #666;">O aluno já pode acessar o portal e preencher sua anamnese. Você pode acompanhar o progresso dele no seu dashboard.</p>
                    <a href="${process.env.VITE_APP_URL || 'https://fitprimemanager.com'}/alunos/${invite.studentId}" style="display: inline-block; background: linear-gradient(to right, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">Ver Perfil do Aluno</a>
                  </div>
                </div>
              `,
              text: `Parabéns! ${input.name} aceitou seu convite e criou uma conta no FitPrime. Email: ${input.email}, Telefone: ${input.phone}`,
            });
          }
        }
        
        // Enviar email de boas-vindas ao aluno
        const { sendWelcomeEmail } = await import('./email');
        const baseUrl = process.env.VITE_APP_URL || 'https://fitprimehub-sfh8sqab.manus.space';
        const loginLink = `${baseUrl}/login-aluno`;
        await sendWelcomeEmail(input.email, input.name, loginLink);
        
        // Gerar token JWT para login automático
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
          { studentId: invite.studentId, type: 'student' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30d' }
        );
        
        return { success: true, token, studentId: invite.studentId, message: 'Cadastro realizado com sucesso!' };
      }),
    
    // Login de aluno com email/senha
    loginStudent: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Buscar aluno pelo email
        const student = await db.getStudentByEmail(input.email);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Email não encontrado' });
        }
        if (!student.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno não possui senha cadastrada. Use o link de convite para criar sua conta.' });
        }
        
        // Verificar senha
        const bcrypt = await import('bcryptjs');
        const valid = await bcrypt.compare(input.password, student.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta' });
        }
        
        // Gerar token JWT
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
          { studentId: student.id, type: 'student' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30d' }
        );
        
        return { success: true, token, studentId: student.id, studentName: student.name };
      }),
    
    // Solicitar recuperação de senha
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // Buscar aluno pelo email
        const student = await db.getStudentByEmail(input.email);
        if (!student) {
          // Por segurança, não revelar se o email existe ou não
          return { success: true, message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' };
        }
        
        // Gerar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expira em 15 minutos
        
        // Salvar código no banco (usando uma tabela temporária ou campo no aluno)
        await db.savePasswordResetCode(student.id, code, expiresAt);
        
        // Enviar email com o código
        let emailSent = false;
        try {
          const { sendPasswordResetEmail } = await import('./email');
          console.log(`[PasswordReset] Tentando enviar email para ${input.email}`);
          emailSent = await sendPasswordResetEmail(input.email, student.name, code);
          console.log(`[PasswordReset] Resultado do envio: ${emailSent ? 'sucesso' : 'falha'}`);
        } catch (error) {
          console.error('[PasswordReset] Erro ao enviar email de recuperação:', error);
        }
        
        // Retornar o código no console para debug (remover em produção)
        console.log(`[PasswordReset] Código gerado para ${input.email}: ${code}`);
        
        return { success: true, message: 'Código enviado para seu email.' };
      }),
    
    // Verificar código de recuperação
    verifyResetCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input }) => {
        const student = await db.getStudentByEmail(input.email);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Email não encontrado' });
        }
        
        const isValid = await db.verifyPasswordResetCode(student.id, input.code);
        if (!isValid) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Código inválido ou expirado' });
        }
        
        return { success: true };
      }),
    
    // Redefinir senha com código
    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const student = await db.getStudentByEmail(input.email);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Email não encontrado' });
        }
        
        const isValid = await db.verifyPasswordResetCode(student.id, input.code);
        if (!isValid) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Código inválido ou expirado' });
        }
        
        // Hash da nova senha
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        
        // Atualizar senha e limpar código
        await db.updateStudentPassword(student.id, passwordHash);
        await db.clearPasswordResetCode(student.id);
        
        return { success: true, message: 'Senha redefinida com sucesso!' };
      }),
    
    // Verificar token de aluno
    verifyStudentToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(input.token, process.env.JWT_SECRET || 'secret') as { studentId: number; type: string };
          if (decoded.type !== 'student') {
            return { valid: false };
          }
          const student = await db.getStudentByIdPublic(decoded.studentId);
          if (!student) {
            return { valid: false };
          }
          return { valid: true, student: { id: student.id, name: student.name, email: student.email } };
        } catch {
          return { valid: false };
        }
      }),
    
    // Cancelar convite
    cancelInvite: personalProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateStudentInvite(input.inviteId, { status: 'cancelled' });
        return { success: true };
      }),
    
    // Resetar senha do aluno (desvincula usuário)
    resetAccess: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Desvincular usuário do aluno
        if (student.userId) {
          await db.unlinkStudentFromUser(input.studentId);
        }
        
        return { success: true, message: 'Acesso resetado. Envie um novo convite para o aluno.' };
      }),
    
    // Buscar aluno pelo userId (para portal do aluno)
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        return await db.getStudentByUserId(parseInt(input.userId) || 0);
      }),
    
    // Lixeira de alunos
    listDeleted: personalProcedure
      .query(async ({ ctx }) => {
        return await db.getDeletedStudentsByPersonalId(ctx.personal.id);
      }),
    
    restore: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.restoreStudent(input.id, ctx.personal.id);
        return { success: true };
      }),
    
    deletePermanently: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteStudentPermanently(input.id, ctx.personal.id);
        return { success: true };
      }),
    
    // Pausar aluno (férias, ausência temporária)
    pause: personalProcedure
      .input(z.object({
        studentId: z.number(),
        reason: z.string().optional(),
        pausedUntil: z.string().optional(), // Data prevista para retorno
        cancelFutureSessions: z.boolean().default(true),
        cancelFutureCharges: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Atualizar status do aluno para pausado
        await db.updateStudent(input.studentId, ctx.personal.id, {
          status: 'paused',
          pausedAt: new Date(),
          pausedUntil: input.pausedUntil ? new Date(input.pausedUntil) : undefined,
          pauseReason: input.reason,
        });
        
        // Cancelar sessões futuras se solicitado
        if (input.cancelFutureSessions) {
          await db.cancelFutureSessionsByStudentId(input.studentId);
        }
        
        // Cancelar cobranças futuras se solicitado
        if (input.cancelFutureCharges) {
          await db.cancelFutureChargesByStudentId(input.studentId);
        }
        
        // Pausar contratos ativos
        await db.pausePackagesByStudentId(input.studentId);
        
        return { success: true, message: 'Aluno pausado com sucesso' };
      }),
    
    // Reativar aluno pausado
    reactivate: personalProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Reativar aluno
        await db.updateStudent(input.studentId, ctx.personal.id, {
          status: 'active',
          pausedAt: null,
          pausedUntil: null,
          pauseReason: null,
        });
        
        // Reativar contratos pausados
        await db.reactivatePackagesByStudentId(input.studentId);
        
        return { success: true, message: 'Aluno reativado com sucesso' };
      }),
    
    // Cancelar aluno definitivamente (mantém histórico)
    cancel: personalProcedure
      .input(z.object({
        studentId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Atualizar status do aluno para inativo
        await db.updateStudent(input.studentId, ctx.personal.id, {
          status: 'inactive',
          notes: student.notes 
            ? `${student.notes}\n\n[Cancelado em ${new Date().toLocaleDateString('pt-BR')}]${input.reason ? `: ${input.reason}` : ''}`
            : `[Cancelado em ${new Date().toLocaleDateString('pt-BR')}]${input.reason ? `: ${input.reason}` : ''}`,
        });
        
        // Cancelar todas as sessões futuras
        await db.cancelFutureSessionsByStudentId(input.studentId);
        
        // Cancelar todas as cobranças pendentes
        await db.cancelFutureChargesByStudentId(input.studentId);
        
        // Cancelar todos os contratos ativos
        await db.cancelPackagesByStudentId(input.studentId);
        
        return { success: true, message: 'Aluno cancelado. Histórico mantido.' };
      }),
    
    // Obter permissões de um aluno
    getPermissions: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        return {
          studentId: student.id,
          studentName: student.name,
          canEditAnamnesis: student.canEditAnamnesis ?? true,
          canEditMeasurements: student.canEditMeasurements ?? true,
          canEditPhotos: student.canEditPhotos ?? true,
          canViewCharges: student.canViewCharges ?? true,
          canScheduleSessions: student.canScheduleSessions ?? true,
          canCancelSessions: student.canCancelSessions ?? true,
          canSendMessages: student.canSendMessages ?? true,
          canViewWorkouts: student.canViewWorkouts ?? true,
        };
      }),
    
    // Atualizar permissões de um aluno
    updatePermissions: personalProcedure
      .input(z.object({
        studentId: z.number(),
        canEditAnamnesis: z.boolean().optional(),
        canEditMeasurements: z.boolean().optional(),
        canEditPhotos: z.boolean().optional(),
        canViewCharges: z.boolean().optional(),
        canScheduleSessions: z.boolean().optional(),
        canCancelSessions: z.boolean().optional(),
        canSendMessages: z.boolean().optional(),
        canViewWorkouts: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { studentId, ...permissions } = input;
        const student = await db.getStudentById(studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        await db.updateStudent(studentId, ctx.personal.id, permissions);
        return { success: true };
      }),
    
    // Listar todos alunos com suas permissões
    listWithPermissions: personalProcedure
      .query(async ({ ctx }) => {
        const students = await db.getStudentsByPersonalId(ctx.personal.id, { status: 'active' });
        return students.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          avatarUrl: s.avatarUrl,
          canEditAnamnesis: s.canEditAnamnesis ?? true,
          canEditMeasurements: s.canEditMeasurements ?? true,
          canEditPhotos: s.canEditPhotos ?? true,
          canViewCharges: s.canViewCharges ?? true,
          canScheduleSessions: s.canScheduleSessions ?? true,
          canCancelSessions: s.canCancelSessions ?? true,
          canSendMessages: s.canSendMessages ?? true,
          canViewWorkouts: s.canViewWorkouts ?? true,
        }));
      }),
    
    // Exportar PDF do aluno
    exportPDF: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateStudentPDF } = await import('./pdf/studentReport');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar anamnese
        const anamnesis = await db.getAnamnesisByStudentId(input.studentId);
        
        // Buscar medidas
        const measurements = await db.getMeasurementsByStudentId(input.studentId);
        
        // Buscar treinos
        const workouts = await db.getWorkoutsByStudentId(input.studentId);
        
        // Preparar info do personal para o PDF
        const personalInfo = {
          businessName: ctx.personal.businessName,
          logoUrl: ctx.personal.logoUrl,
        };
        
        // Gerar PDF
        const pdfBuffer = await generateStudentPDF(
          student as any,
          anamnesis as any,
          measurements as any[],
          workouts as any[],
          personalInfo
        );
        
        // Retornar como base64
        return {
          filename: `${student.name.replace(/\s+/g, '_')}_relatorio.pdf`,
          data: pdfBuffer.toString('base64'),
          contentType: 'application/pdf'
        };
      }),
  }),

  // ==================== ANAMNESIS ====================
  anamnesis: router({
    get: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAnamnesisByStudentId(input.studentId);
      }),
    
    save: personalProcedure
      .input(z.object({
        studentId: z.number(),
        occupation: z.string().optional(),
        lifestyle: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        stressLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
        medicalHistory: z.string().optional(),
        injuries: z.string().optional(),
        surgeries: z.string().optional(),
        medications: z.string().optional(),
        allergies: z.string().optional(),
        mainGoal: z.enum(['weight_loss', 'muscle_gain', 'conditioning', 'health', 'rehabilitation', 'sports', 'other']).optional(),
        secondaryGoals: z.string().optional(),
        targetWeight: z.string().optional(),
        motivation: z.string().optional(),
        mealsPerDay: z.number().optional(),
        waterIntake: z.string().optional(),
        dietRestrictions: z.string().optional(),
        supplements: z.string().optional(),
        dailyCalories: z.number().optional(),
        doesCardio: z.boolean().optional(),
        cardioActivities: z.string().optional(),
        exerciseExperience: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional(),
        previousActivities: z.string().optional(),
        availableDays: z.string().optional(),
        preferredTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
        observations: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getAnamnesisByStudentId(input.studentId);
        
        if (existing) {
          // Save history before updating
          await db.createAnamnesisHistory({
            anamnesisId: existing.id,
            studentId: input.studentId,
            changes: JSON.stringify(input),
            changedBy: ctx.user.id,
            version: existing.version,
          });
          
          await db.updateAnamnesis(existing.id, input);
          return { id: existing.id, updated: true };
        } else {
          const id = await db.createAnamnesis({
            ...input,
            personalId: ctx.personal.id,
          });
          return { id, updated: false };
        }
      }),
    
    history: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAnamnesisHistory(input.studentId);
      }),
    
    // Salvar anamnese com medidas corporais integradas
    saveWithMeasurements: personalProcedure
      .input(z.object({
        studentId: z.number(),
        occupation: z.string().optional(),
        lifestyle: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        stressLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
        medicalHistory: z.string().optional(),
        injuries: z.string().optional(),
        surgeries: z.string().optional(),
        medications: z.string().optional(),
        allergies: z.string().optional(),
        mainGoal: z.enum(['weight_loss', 'muscle_gain', 'conditioning', 'health', 'rehabilitation', 'sports', 'other']).optional(),
        secondaryGoals: z.string().optional(),
        targetWeight: z.string().optional(),
        motivation: z.string().optional(),
        mealsPerDay: z.number().optional(),
        waterIntake: z.string().optional(),
        dietRestrictions: z.string().optional(),
        supplements: z.string().optional(),
        dailyCalories: z.number().optional(),
        doesCardio: z.boolean().optional(),
        cardioActivities: z.string().optional(),
        exerciseExperience: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional(),
        previousActivities: z.string().optional(),
        availableDays: z.string().optional(),
        preferredTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
        weeklyFrequency: z.number().optional(),
        sessionDuration: z.number().optional(),
        trainingLocation: z.enum(['full_gym', 'home_gym', 'home_basic', 'outdoor', 'studio']).optional(),
        availableEquipment: z.string().optional(),
        trainingRestrictions: z.string().optional(),
        restrictionNotes: z.string().optional(),
        muscleEmphasis: z.string().optional(),
        observations: z.string().optional(),
        // Medidas corporais
        measurements: z.object({
          weight: z.string().optional(),
          height: z.string().optional(),
          bodyFat: z.string().optional(),
          muscleMass: z.string().optional(),
          neck: z.string().optional(),
          chest: z.string().optional(),
          waist: z.string().optional(),
          hip: z.string().optional(),
          rightArm: z.string().optional(),
          leftArm: z.string().optional(),
          rightThigh: z.string().optional(),
          leftThigh: z.string().optional(),
          rightCalf: z.string().optional(),
          leftCalf: z.string().optional(),
          notes: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { measurements, ...anamnesisData } = input;
        const existing = await db.getAnamnesisByStudentId(input.studentId);
        
        let anamnesisId: number;
        let updated = false;
        
        if (existing) {
          // Save history before updating
          await db.createAnamnesisHistory({
            anamnesisId: existing.id,
            studentId: input.studentId,
            changes: JSON.stringify(anamnesisData),
            changedBy: ctx.user.id,
            version: existing.version,
          });
          
          await db.updateAnamnesis(existing.id, anamnesisData);
          anamnesisId = existing.id;
          updated = true;
        } else {
          anamnesisId = await db.createAnamnesis({
            ...anamnesisData,
            personalId: ctx.personal.id,
          });
        }
        
        // Criar registro de medidas se houver dados
        if (measurements && Object.values(measurements).some(v => v)) {
          const hasMeasurementData = measurements.weight || measurements.height || 
            measurements.bodyFat || measurements.chest || measurements.waist || 
            measurements.hip || measurements.neck;
          
          if (hasMeasurementData) {
            // Calcular IMC se tiver peso e altura
            let bmi: string | undefined;
            if (measurements.weight && measurements.height) {
              const w = parseFloat(measurements.weight);
              const h = parseFloat(measurements.height) / 100;
              if (w > 0 && h > 0) {
                bmi = (w / (h * h)).toFixed(1);
              }
            }
            
            await db.createMeasurement({
              studentId: input.studentId,
              personalId: ctx.personal.id,
              measureDate: new Date(),
              weight: measurements.weight,
              height: measurements.height,
              bodyFat: measurements.bodyFat,
              muscleMass: measurements.muscleMass,
              neck: measurements.neck,
              chest: measurements.chest,
              waist: measurements.waist,
              hip: measurements.hip,
              rightArm: measurements.rightArm,
              leftArm: measurements.leftArm,
              rightThigh: measurements.rightThigh,
              leftThigh: measurements.leftThigh,
              rightCalf: measurements.rightCalf,
              leftCalf: measurements.leftCalf,
              notes: measurements.notes,
              bmi,
            });
          }
        }
        
        // Notificar o personal se for primeiro preenchimento
        if (!updated) {
          const student = await db.getStudentById(input.studentId, ctx.personal.id);
          if (student) {
            const { notifyOwner } = await import('./_core/notification');
            await notifyOwner({
              title: `📋 Anamnese Preenchida - ${student.name}`,
              content: `O aluno ${student.name} preencheu sua anamnese!\n\n🎯 Objetivo: ${input.mainGoal || 'Não informado'}\n🏋️ Peso: ${measurements?.weight || 'Não informado'} kg\n📏 Altura: ${measurements?.height || 'Não informado'} cm\n\nAcesse o perfil do aluno para ver os detalhes completos.`,
            });
          }
        }
        
        return { id: anamnesisId, updated };
      }),
    
    // Análise de evolução de fotos do aluno (para o personal)
    analyzeEvolution: personalProcedure
      .input(z.object({
        studentId: z.number(),
        beforePhotoUrl: z.string(),
        afterPhotoUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o aluno pertence ao personal
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado.' });
        }
        
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar medidas do aluno para enriquecer análise
        const measurements = await db.getMeasurementsByStudentId(input.studentId);
        const sortedMeasurements = [...measurements].sort((a, b) => 
          new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
        );
        
        let measurementsContext = '';
        if (sortedMeasurements.length >= 2) {
          const latest = sortedMeasurements[0];
          const oldest = sortedMeasurements[sortedMeasurements.length - 1];
          
          measurementsContext = `\n\n**EVOLUÇÃO DAS MEDIDAS:**\n`;
          
          const addMeasure = (label: string, before: number | null, after: number | null, unit: string) => {
            if (before !== null && after !== null) {
              const diff = after - before;
              const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
              return `- ${label}: ${before}${unit} → ${after}${unit} (${diffStr}${unit})\n`;
            }
            return '';
          };
          
          const toNum = (v: string | null) => v ? parseFloat(v) : null;
          measurementsContext += addMeasure('Peso', toNum(oldest.weight), toNum(latest.weight), 'kg');
          measurementsContext += addMeasure('Gordura corporal', toNum(oldest.bodyFat), toNum(latest.bodyFat), '%');
          measurementsContext += addMeasure('Peito', toNum(oldest.chest), toNum(latest.chest), 'cm');
          measurementsContext += addMeasure('Cintura', toNum(oldest.waist), toNum(latest.waist), 'cm');
          measurementsContext += addMeasure('Quadril', toNum(oldest.hip), toNum(latest.hip), 'cm');
          measurementsContext += addMeasure('Braço', toNum(oldest.rightArm), toNum(latest.rightArm), 'cm');
          measurementsContext += addMeasure('Coxa', toNum(oldest.rightThigh), toNum(latest.rightThigh), 'cm');
        }
        
        // Buscar anamnese para contexto
        const anamnesis = await db.getAnamnesisByStudentId(input.studentId);
        let goalContext = '';
        if (anamnesis?.mainGoal) {
          goalContext = `\n\n**OBJETIVO DO ALUNO:** ${anamnesis.mainGoal}`;
        }
        
        const prompt = `Você é um personal trainer especialista em análise de evolução física.

Analise a evolução física do aluno ${student.name} com base nas fotos e dados fornecidos.${goalContext}${measurementsContext}

Forneça uma análise completa em português brasileiro:

1. **ANÁLISE VISUAL** (baseada nas fotos)
   - Mudanças na composição corporal
   - Desenvolvimento muscular visível
   - Postura e simetria

2. **ANÁLISE DAS MEDIDAS** (se disponível)
   - Interpretação dos números
   - Correlação com as mudanças visuais

3. **PROGRESSO EM RELAÇÃO AO OBJETIVO**
   - Avaliação do progresso
   - Está no caminho certo?

4. **PONTOS FORTES**
   - O que está funcionando bem

5. **ÁREAS DE MELHORIA**
   - O que pode melhorar

6. **RECOMENDAÇÕES**
   - Sugestões práticas para o treino

7. **SCORES DE EVOLUÇÃO** (de 1 a 10)
   - Ganho muscular: X/10
   - Perda de gordura: X/10
   - Postura: X/10
   - Progresso geral: X/10

Seja profissional, detalhado e motivador.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um personal trainer especialista em análise de evolução física. Responda sempre em português brasileiro de forma profissional, detalhada e motivadora.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: input.beforePhotoUrl, detail: 'high' } },
                  { type: 'image_url', image_url: { url: input.afterPhotoUrl, detail: 'high' } },
                ]
              },
            ],
          });
          
          const analysisText = response.choices[0]?.message?.content || 'Não foi possível gerar a análise.';
          
          return {
            analysis: analysisText,
            analyzedAt: new Date().toISOString(),
            studentName: student.name,
          };
        } catch (error) {
          console.error('Erro na análise de evolução:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao analisar evolução.' });
        }
      }),
  }),

  // ==================== MEASUREMENTS ====================
  measurements: router({
    list: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getMeasurementsByStudentId(input.studentId);
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        measureDate: z.string(),
        weight: z.string().optional(),
        height: z.string().optional(),
        bodyFat: z.string().optional(),
        muscleMass: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hip: z.string().optional(),
        rightArm: z.string().optional(),
        leftArm: z.string().optional(),
        rightThigh: z.string().optional(),
        leftThigh: z.string().optional(),
        rightCalf: z.string().optional(),
        leftCalf: z.string().optional(),
        neck: z.string().optional(),
        notes: z.string().optional(),
        // Bioimpedância (manual)
        bioBodyFat: z.string().optional(),
        bioMuscleMass: z.string().optional(),
        bioFatMass: z.string().optional(),
        bioVisceralFat: z.string().optional(),
        bioBasalMetabolism: z.string().optional(),
        // Adipômetro (manual)
        adipBodyFat: z.string().optional(),
        adipMuscleMass: z.string().optional(),
        adipFatMass: z.string().optional(),
        // Dobras cutâneas
        tricepsFold: z.string().optional(),
        subscapularFold: z.string().optional(),
        suprailiacFold: z.string().optional(),
        abdominalFold: z.string().optional(),
        thighFold: z.string().optional(),
        chestFold: z.string().optional(),
        axillaryFold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { measureDate, studentId, ...data } = input;
        
        // Buscar gênero do aluno para cálculo de BF
        const student = await db.getStudentById(studentId, ctx.personal.id);
        const gender = student?.gender || 'male';
        
        // Calculate BMI if weight and height provided
        let bmi: string | undefined;
        let estimatedBodyFat: string | undefined;
        let estimatedMuscleMass: string | undefined;
        let estimatedFatMass: string | undefined;
        
        if (data.weight && data.height) {
          const w = parseFloat(data.weight);
          const h = parseFloat(data.height) / 100; // cm to m
          if (w > 0 && h > 0) {
            bmi = (w / (h * h)).toFixed(2);
          }
        }
        
        // Cálculo de BF estimado usando fórmula da Marinha dos EUA (US Navy Method)
        if (data.waist && data.neck && data.height) {
          const waist = parseFloat(data.waist);
          const neck = parseFloat(data.neck);
          const height = parseFloat(data.height);
          const hip = data.hip ? parseFloat(data.hip) : 0;
          const weight = data.weight ? parseFloat(data.weight) : 0;
          
          if (waist > 0 && neck > 0 && height > 0) {
            let bf: number;
            if (gender === 'female' && hip > 0) {
              // Fórmula para mulheres: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
              bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
            } else {
              // Fórmula para homens: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
              bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
            }
            
            if (bf > 0 && bf < 60) {
              estimatedBodyFat = bf.toFixed(2);
              
              // Calcular massa gorda e massa magra estimadas
              if (weight > 0) {
                const fatMass = (weight * bf) / 100;
                const leanMass = weight - fatMass;
                estimatedFatMass = fatMass.toFixed(2);
                estimatedMuscleMass = leanMass.toFixed(2);
              }
            }
          }
        }
        
        // Filter out empty strings to avoid database errors with decimal fields
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== '' && value !== undefined && value !== null) {
            cleanData[key] = value;
          }
        }
        
        const id = await db.createMeasurement({
          ...cleanData,
          studentId,
          measureDate: new Date(measureDate + 'T12:00:00'), // Add time to avoid timezone issues
          personalId: ctx.personal.id,
          bmi,
          estimatedBodyFat,
          estimatedMuscleMass,
          estimatedFatMass,
        } as any);
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        studentId: z.number().optional(),
        measureDate: z.string(),
        weight: z.string().optional(),
        height: z.string().optional(),
        bodyFat: z.string().optional(),
        muscleMass: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hip: z.string().optional(),
        rightArm: z.string().optional(),
        leftArm: z.string().optional(),
        rightThigh: z.string().optional(),
        leftThigh: z.string().optional(),
        rightCalf: z.string().optional(),
        leftCalf: z.string().optional(),
        neck: z.string().optional(),
        notes: z.string().optional(),
        // Bioimpedância (manual)
        bioBodyFat: z.string().optional(),
        bioMuscleMass: z.string().optional(),
        bioFatMass: z.string().optional(),
        bioVisceralFat: z.string().optional(),
        bioBasalMetabolism: z.string().optional(),
        // Adipômetro (manual)
        adipBodyFat: z.string().optional(),
        adipMuscleMass: z.string().optional(),
        adipFatMass: z.string().optional(),
        // Dobras cutâneas
        tricepsFold: z.string().optional(),
        subscapularFold: z.string().optional(),
        suprailiacFold: z.string().optional(),
        abdominalFold: z.string().optional(),
        thighFold: z.string().optional(),
        chestFold: z.string().optional(),
        axillaryFold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, studentId, measureDate, ...data } = input;
        
        // Calculate BMI if weight and height provided
        let bmi: string | undefined;
        let estimatedBodyFat: string | undefined;
        let estimatedMuscleMass: string | undefined;
        let estimatedFatMass: string | undefined;
        
        if (data.weight && data.height) {
          const w = parseFloat(data.weight);
          const h = parseFloat(data.height) / 100;
          if (w > 0 && h > 0) {
            bmi = (w / (h * h)).toFixed(2);
          }
        }
        
        // Cálculo de BF estimado se tiver as medidas necessárias
        if (data.waist && data.neck && data.height && studentId) {
          const student = await db.getStudentById(studentId, ctx.personal.id);
          const gender = student?.gender || 'male';
          
          const waist = parseFloat(data.waist);
          const neck = parseFloat(data.neck);
          const height = parseFloat(data.height);
          const hip = data.hip ? parseFloat(data.hip) : 0;
          const weight = data.weight ? parseFloat(data.weight) : 0;
          
          if (waist > 0 && neck > 0 && height > 0) {
            let bf: number;
            if (gender === 'female' && hip > 0) {
              bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
            } else {
              bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
            }
            
            if (bf > 0 && bf < 60) {
              estimatedBodyFat = bf.toFixed(2);
              if (weight > 0) {
                const fatMass = (weight * bf) / 100;
                const leanMass = weight - fatMass;
                estimatedFatMass = fatMass.toFixed(2);
                estimatedMuscleMass = leanMass.toFixed(2);
              }
            }
          }
        }
        
        // Filter out empty strings to avoid database errors with decimal fields
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== '' && value !== undefined && value !== null) {
            cleanData[key] = value;
          }
        }
        
        await db.updateMeasurement(id, {
          ...cleanData,
          measureDate: new Date(measureDate + 'T12:00:00'),
          bmi,
          estimatedBodyFat,
          estimatedMuscleMass,
          estimatedFatMass,
        } as any);
        return { success: true };
      }),

    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMeasurement(input.id);
        return { success: true };
      }),
    
    listDeleted: personalProcedure
      .query(async ({ ctx }) => {
        return await db.getDeletedMeasurementsByPersonalId(ctx.personal.id);
      }),
    
    restore: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.restoreMeasurement(input.id);
        return { success: true };
      }),
    
    permanentDelete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.permanentlyDeleteMeasurement(input.id);
        return { success: true };
      }),
  }),

  // ==================== PHOTOS ====================
  photos: router({
    list: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPhotosByStudentId(input.studentId);
      }),
    
    upload: personalProcedure
      .input(z.object({
        studentId: z.number(),
        photoDate: z.string(),
        category: z.enum(['front', 'back', 'side_left', 'side_right', 'other']).optional(),
        notes: z.string().optional(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const fileKey = `photos/${ctx.personal.id}/${input.studentId}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        const id = await db.createPhoto({
          studentId: input.studentId,
          personalId: ctx.personal.id,
          url,
          fileKey,
          photoDate: new Date(input.photoDate),
          category: input.category,
          notes: input.notes,
        });
        
        return { id, url };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePhoto(input.id, ctx.personal.id);
        return { success: true };
      }),

    // Histórico de análises de fotos
    getAnalyses: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPhotoAnalysesByStudentId(input.studentId);
      }),
  }),

  // ==================== WORKOUTS ====================
  workouts: router({
    list: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const workouts = await db.getWorkoutsByStudentId(input.studentId);
        // Incluir os dias de cada treino para o seletor de sessão
        const workoutsWithDays = await Promise.all(
          workouts.map(async (workout) => {
            const days = await db.getWorkoutDaysByWorkoutId(workout.id);
            return { ...workout, days };
          })
        );
        return workoutsWithDays;
      }),
    
    get: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.id);
        if (!workout) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Treino não encontrado' });
        }
        
        const days = await db.getWorkoutDaysByWorkoutId(input.id);
        const daysWithExercises = await Promise.all(
          days.map(async (day) => {
            const exercises = await db.getExercisesByWorkoutDayId(day.id);
            return { ...day, exercises };
          })
        );
        
        return { ...workout, days: daysWithExercises };
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['strength', 'cardio', 'flexibility', 'functional', 'mixed']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { startDate, endDate, ...data } = input;
        const id = await db.createWorkout({
          ...data,
          personalId: ctx.personal.id,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(['strength', 'cardio', 'flexibility', 'functional', 'mixed']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        status: z.enum(['active', 'inactive', 'completed']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, startDate, endDate, ...data } = input;
        await db.updateWorkout(id, {
          ...data,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWorkout(input.id);
        return { success: true };
      }),
    
    // Lixeira de treinos
    listDeleted: personalProcedure
      .query(async ({ ctx }) => {
        return await db.getDeletedWorkoutsByPersonalId(ctx.personal.id);
      }),
    
    restore: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.restoreWorkout(input.id);
        return { success: true };
      }),
    
    permanentDelete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.permanentlyDeleteWorkout(input.id);
        return { success: true };
      }),
    
    // Templates pré-programados
    templates: publicProcedure
      .query(async () => {
        const { allWorkoutTemplates, goalLabels, levelLabels } = await import('../shared/workout-templates');
        return { templates: allWorkoutTemplates, goalLabels, levelLabels };
      }),
    
    // Criar treino a partir de template
    createFromTemplate: personalProcedure
      .input(z.object({
        studentId: z.number(),
        templateId: z.string(),
        customName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getTemplateById } = await import('../shared/workout-templates');
        const template = getTemplateById(input.templateId);
        
        if (!template) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template não encontrado' });
        }
        
        // Criar o treino principal
        const workoutId = await db.createWorkout({
          studentId: input.studentId,
          personalId: ctx.personal.id,
          name: input.customName || template.name,
          description: template.description,
          type: template.type,
          goal: template.goal as any,
          difficulty: template.difficulty === 'none' ? 'beginner' : template.difficulty,
          isTemplate: false,
          generatedByAI: false,
        });
        
        // Criar os dias e exercícios
        const dayOfWeekMap = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (let i = 0; i < template.days.length; i++) {
          const day = template.days[i];
          const dayId = await db.createWorkoutDay({
            workoutId,
            dayOfWeek: dayOfWeekMap[i % 7] as any,
            name: day.name,
            order: i,
          });
          
          // Criar exercícios do dia
          for (let j = 0; j < day.exercises.length; j++) {
            const exercise = day.exercises[j];
            await db.createExercise({
              workoutDayId: dayId,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              sets: exercise.sets,
              reps: exercise.reps,
              restSeconds: exercise.restSeconds,
              notes: exercise.notes,
              order: j,
            });
          }
        }
        
        return { id: workoutId, name: template.name };
      }),
    
    // Gerar treino com IA baseado na anamnese
    generateWithAI: personalProcedure
      .input(z.object({
        studentId: z.number(),
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o personal tem CREF cadastrado
        const user = await db.getUserById(ctx.user.id);
        if (!user?.cref) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Para gerar treinos com IA, é necessário cadastrar seu CREF nas configurações. Acesse Configurações > Perfil para adicionar.' 
          });
        }
        
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar anamnese do aluno
        const anamnesis = await db.getAnamnesisByStudentId(input.studentId);
        
        // Buscar últimas medidas
        const measurements = await db.getMeasurementsByStudentId(input.studentId);
        const latestMeasurement = measurements[0];
        
        // Montar prompt para a IA
        const studentInfo = {
          nome: student.name,
          genero: student.gender === 'male' ? 'masculino' : student.gender === 'female' ? 'feminino' : 'não informado',
          idade: student.birthDate ? Math.floor((Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'não informada',
        };
        
        const anamnesisInfo = anamnesis ? {
          objetivo: anamnesis.mainGoal,
          nivelExperiencia: anamnesis.exerciseExperience,
          estiloVida: anamnesis.lifestyle,
          horasSono: anamnesis.sleepHours,
          nivelEstresse: anamnesis.stressLevel,
          lesoes: anamnesis.injuries,
          medicamentos: anamnesis.medications,
          diasDisponiveis: anamnesis.availableDays,
          horarioPreferido: anamnesis.preferredTime,
          localTreino: anamnesis.trainingLocation,
          equipamentosDisponiveis: anamnesis.availableEquipment,
          frequenciaSemanal: anamnesis.weeklyFrequency,
          duracaoSessao: anamnesis.sessionDuration,
          restricoesTreino: anamnesis.trainingRestrictions ? JSON.parse(anamnesis.trainingRestrictions) : [],
          detalhesRestricoes: anamnesis.restrictionNotes,
          enfasesMusculares: anamnesis.muscleEmphasis ? JSON.parse(anamnesis.muscleEmphasis) : [],
          // Novos campos de nutrição e cardio
          consumoCaloricoDiario: (anamnesis as any).dailyCalories || null,
          fazCardio: (anamnesis as any).doesCardio || false,
          atividadesAerobicas: (anamnesis as any).cardioActivities ? JSON.parse((anamnesis as any).cardioActivities) : [],
        } : null;
        
        const measurementInfo = latestMeasurement ? {
          peso: latestMeasurement.weight,
          altura: latestMeasurement.height,
          gorduraCorporal: latestMeasurement.bodyFat,
          massaMuscular: latestMeasurement.muscleMass,
          tmbEstimado: (latestMeasurement as any).estimatedBMR || null,
        } : null;
        
        const systemPrompt = `Você é um personal trainer experiente e certificado. Sua tarefa é criar um plano de treino personalizado baseado nas informações do aluno.

Você DEVE retornar um JSON válido no seguinte formato:
{
  "name": "Nome do Treino",
  "description": "Descrição do treino",
  "goal": "hypertrophy|weight_loss|recomposition|conditioning|strength|bulking|cutting|general",
  "difficulty": "beginner|intermediate|advanced",
  "type": "strength|cardio|flexibility|functional|mixed",
  "days": [
    {
      "name": "Nome do Dia (ex: Treino A - Peito e Tríceps)",
      "exercises": [
        {
          "name": "Nome do Exercício",
          "muscleGroup": "Grupo Muscular",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "notes": "Observações opcionais"
        }
      ]
    }
  ]
}

REGRAS CRÍTICAS - GÊNERO:
- IDENTIFIQUE o gênero do aluno e ADAPTE o treino adequadamente
- Para MULHERES:
  * Priorize glúteos, pernas, abdômen e costas
  * Inclua mais exercícios de glúteos (hip thrust, elevação pélvica, abdutora)
  * Use mais repetições (12-15) com menos peso
  * Inclua exercícios funcionais e de core
  * Evite foco excessivo em peito e bíceps
- Para HOMENS:
  * Distribua melhor entre peito, costas, ombros, braços e pernas
  * Use repetições moderadas (8-12) com mais peso
  * Inclua exercícios compostos (supino, agachamento, terra)
  * Pode incluir mais trabalho de bíceps e tríceps

REGRAS CRÍTICAS - FREQUÊNCIA SEMANAL:
- OBRIGATÓRIO: Crie EXATAMENTE o número de dias de treino igual à frequência semanal informada
- Se frequência = 2: Crie 2 treinos (ex: Full Body A e B, ou Superior/Inferior)
- Se frequência = 3: Crie 3 treinos (ex: ABC - Push/Pull/Legs ou Full Body)
- Se frequência = 4: Crie 4 treinos (ex: ABCD - Superior A/Inferior A/Superior B/Inferior B)
- Se frequência = 5: Crie 5 treinos (ex: ABCDE - Peito/Costas/Pernas/Ombros/Braços)
- Se frequência = 6: Crie 6 treinos (ex: Push/Pull/Legs x2)
- Se não informada, use 3 dias como padrão

REGRAS CRÍTICAS - ATIVIDADES AERÓBICAS/CARDIO:
- Se o aluno JÁ FAZ cardio regularmente (natação, corrida, ciclismo, etc.):
  * NÃO adicione cardio extra no treino de musculação
  * Considere que ele já tem gasto calórico adicional
  * Ajuste o volume de treino para não sobrecarregar
  * Se faz muitas atividades aeróbicas, reduza volume de pernas
- Se o aluno NÃO FAZ cardio e o objetivo é emagrecimento:
  * Sugira incluir cardio leve ao final do treino (10-15 min)
  * Ou sugira HIIT em dias alternados

REGRAS CRÍTICAS - NUTRIÇÃO E CALORIAS:
- Se o consumo calórico diário for informado:
  * Consumo < 1500 kcal: Treino mais leve, menos volume, evite treinos muito longos
  * Consumo 1500-2000 kcal: Treino moderado, foco em manutenção
  * Consumo 2000-2500 kcal: Treino normal, pode ter bom volume
  * Consumo > 2500 kcal: Pode ter treino intenso, bom para hipertrofia
- Se TMB for informado, considere para ajustar intensidade
- Déficit calórico grande + treino intenso = risco de overtraining

Regras adicionais:
- PRIORIDADE MÁXIMA: Respeite as restrições de treino do aluno (lombar, joelho, ombro, etc.)
- Se houver restrições, EVITE exercícios que sobrecarreguem essas regiões
- Substitua exercícios problemáticos por alternativas mais seguras
- PRIORIZE os grupos musculares indicados nas ênfases musculares do aluno
- Se houver ênfases musculares, inclua mais exercícios e volume para esses grupos
- Considere as lesões e limitações do aluno
- Adapte o volume e intensidade ao nível de experiência
- Considere os equipamentos disponíveis
- Inclua aquecimento e alongamento quando apropriado
- Para iniciantes, priorize exercícios em máquinas
- Para avançados, inclua técnicas avançadas como drop-sets
- Se houver restrição lombar: evite agachamento livre, levantamento terra, bom dia
- Se houver restrição no joelho: evite leg press profundo, agachamento completo, saltos
- Se houver restrição no ombro: evite desenvolvimento atrás da nuca, crucifixo com peso alto`;
        
        const userPrompt = `Crie um treino personalizado para este aluno:

Informações do Aluno:
${JSON.stringify(studentInfo, null, 2)}

Anamnese:
${anamnesisInfo ? JSON.stringify(anamnesisInfo, null, 2) : 'Não preenchida - crie um treino genérico para iniciantes'}

Medidas Atuais:
${measurementInfo ? JSON.stringify(measurementInfo, null, 2) : 'Não informadas'}

${input.customPrompt ? `Instruções adicionais do personal: ${input.customPrompt}` : ''}

Retorne APENAS o JSON, sem texto adicional.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'workout_plan',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  goal: { type: 'string', enum: ['hypertrophy', 'weight_loss', 'recomposition', 'conditioning', 'strength', 'bulking', 'cutting', 'general'] },
                  difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                  type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'functional', 'mixed'] },
                  days: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        exercises: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              muscleGroup: { type: 'string' },
                              sets: { type: 'integer' },
                              reps: { type: 'string' },
                              restSeconds: { type: 'integer' },
                              notes: { type: 'string' },
                            },
                            required: ['name', 'muscleGroup', 'sets', 'reps', 'restSeconds'],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ['name', 'exercises'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['name', 'description', 'goal', 'difficulty', 'type', 'days'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar treino com IA' });
        }
        
        const workoutPlan = JSON.parse(content);
        
        // Retornar o plano para preview (não salva automaticamente)
        return {
          preview: workoutPlan,
          studentId: input.studentId,
          studentName: student.name,
        };
      }),
    
    // Análise detalhada do aluno para decisão de treino
    getStudentAnalysis: personalProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o personal tem CREF cadastrado
        const user = await db.getUserById(ctx.user.id);
        if (!user?.cref) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Para usar análise com IA, é necessário cadastrar seu CREF nas configurações. Acesse Configurações > Perfil para adicionar.' 
          });
        }
        
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar anamnese, medidas, treinos anteriores e logs
        const [anamnesis, measurements, workouts, workoutLogs] = await Promise.all([
          db.getAnamnesisByStudentId(input.studentId),
          db.getMeasurementsByStudentId(input.studentId),
          db.getWorkoutsByStudentId(input.studentId),
          db.getWorkoutLogsByStudentId(input.studentId),
        ]);
        
        // Identificar treino atual
        const currentWorkout = workouts.length > 0 ? workouts[0] : null;
        let currentWorkoutDays: any[] = [];
        if (currentWorkout) {
          currentWorkoutDays = await db.getWorkoutDaysByWorkoutId(currentWorkout.id);
          for (const day of currentWorkoutDays) {
            (day as any).exercises = await db.getExercisesByWorkoutDayId(day.id);
          }
        }
        
        // Calcular evolução das medidas
        let measurementEvolution = null;
        let latestMeasurement = null;
        let oldestMeasurement = null;
        if (measurements.length >= 2) {
          const sorted = [...measurements].sort((a, b) => 
            new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
          );
          latestMeasurement = sorted[0];
          oldestMeasurement = sorted[sorted.length - 1];
          measurementEvolution = {
            weightChange: latestMeasurement.weight && oldestMeasurement.weight ? 
              parseFloat(latestMeasurement.weight) - parseFloat(oldestMeasurement.weight) : null,
            bodyFatChange: latestMeasurement.bodyFat && oldestMeasurement.bodyFat ?
              parseFloat(latestMeasurement.bodyFat) - parseFloat(oldestMeasurement.bodyFat) : null,
            muscleMassChange: latestMeasurement.muscleMass && oldestMeasurement.muscleMass ?
              parseFloat(latestMeasurement.muscleMass) - parseFloat(oldestMeasurement.muscleMass) : null,
            waistChange: latestMeasurement.waist && oldestMeasurement.waist ?
              parseFloat(latestMeasurement.waist) - parseFloat(oldestMeasurement.waist) : null,
            periodDays: Math.round((new Date(latestMeasurement.measureDate).getTime() - new Date(oldestMeasurement.measureDate).getTime()) / (1000 * 60 * 60 * 24)),
          };
        } else if (measurements.length === 1) {
          latestMeasurement = measurements[0];
        }
        
        // Analisar desempenho nos treinos (logs)
        let workoutPerformance = null;
        const last30DaysLogs = workoutLogs.filter(log => {
          const logDate = new Date(log.trainingDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return logDate >= thirtyDaysAgo;
        });
        
        if (workoutLogs.length > 0) {
          workoutPerformance = {
            totalWorkouts: last30DaysLogs.length,
            totalAllTime: workoutLogs.length,
            averagePerWeek: (last30DaysLogs.length / 4.3).toFixed(1),
            consistency: anamnesis?.weeklyFrequency ? 
              ((last30DaysLogs.length / 4.3) / anamnesis.weeklyFrequency * 100).toFixed(0) + '%' : 'N/A',
            expectedFrequency: anamnesis?.weeklyFrequency || null,
          };
        }
        
        // Gerar análise com IA
        const systemPrompt = `Você é um personal trainer experiente. Analise os dados do aluno e forneça uma análise detalhada.

Você DEVE retornar um JSON válido no seguinte formato:
{
  "summary": "Resumo geral da situação do aluno em 2-3 frases",
  "strengths": ["lista de pontos fortes identificados"],
  "deficits": ["lista de déficits ou áreas que precisam de atenção"],
  "recommendations": ["lista de recomendações específicas"],
  "shouldAdaptWorkout": true/false,
  "adaptationPriority": "high|medium|low|none",
  "adaptationReason": "Explicação de por que adaptar ou não o treino",
  "muscleGroupsToFocus": ["grupos musculares que precisam de mais atenção"],
  "muscleGroupsProgressing": ["grupos musculares que estão evoluindo bem"]
}`;
        
        const userPrompt = `Analise este aluno:

Informações do Aluno:
- Nome: ${student.name}
- Gênero: ${student.gender === 'male' ? 'masculino' : student.gender === 'female' ? 'feminino' : 'não informado'}

Anamnese:
${anamnesis ? JSON.stringify({
  objetivo: anamnesis.mainGoal,
  nivelExperiencia: anamnesis.exerciseExperience,
  frequenciaSemanal: anamnesis.weeklyFrequency,
  localTreino: anamnesis.trainingLocation,
  restricoes: anamnesis.trainingRestrictions,
  enfasesMusculares: anamnesis.muscleEmphasis,
}, null, 2) : 'Não preenchida'}

Medidas Atuais:
${latestMeasurement ? JSON.stringify({
  peso: latestMeasurement.weight,
  altura: latestMeasurement.height,
  gorduraCorporal: latestMeasurement.bodyFat,
  massaMuscular: latestMeasurement.muscleMass,
  cintura: latestMeasurement.waist,
  quadril: latestMeasurement.hip,
  data: latestMeasurement.measureDate,
}, null, 2) : 'Sem medidas'}

EVOLUÇÃO DAS MEDIDAS:
${measurementEvolution ? JSON.stringify(measurementEvolution, null, 2) : 'Sem dados de evolução (precisa de pelo menos 2 medições)'}

DESEMPENHO NOS TREINOS (Últimos 30 dias):
${workoutPerformance ? JSON.stringify(workoutPerformance, null, 2) : 'Sem logs de treino'}

TREINO ATUAL (${currentWorkout?.name || 'Nenhum'}):
${currentWorkoutDays.length > 0 ? JSON.stringify(currentWorkoutDays.map(d => ({
  dia: d.name,
  exercicios: (d as any).exercises?.map((e: any) => ({
    nome: e.name,
    grupoMuscular: e.muscleGroup,
    series: e.sets,
    reps: e.reps,
  })) || [],
})), null, 2) : 'Nenhum treino cadastrado'}

Retorne APENAS o JSON com a análise.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'student_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  deficits: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  shouldAdaptWorkout: { type: 'boolean' },
                  adaptationPriority: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
                  adaptationReason: { type: 'string' },
                  muscleGroupsToFocus: { type: 'array', items: { type: 'string' } },
                  muscleGroupsProgressing: { type: 'array', items: { type: 'string' } },
                },
                required: ['summary', 'strengths', 'deficits', 'recommendations', 'shouldAdaptWorkout', 'adaptationPriority', 'adaptationReason', 'muscleGroupsToFocus', 'muscleGroupsProgressing'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar análise' });
        }
        
        const analysis = JSON.parse(content);
        
        // Salvar análise no histórico
        const analysisId = await db.createAiAnalysis({
          studentId: input.studentId,
          personalId: ctx.personal.id,
          analysisType: 'complete',
          studentName: student.name,
          summary: analysis.summary,
          strengths: JSON.stringify(analysis.strengths),
          attentionPoints: JSON.stringify(analysis.deficits),
          muscleGroupsEvolving: JSON.stringify(analysis.muscleGroupsProgressing),
          muscleGroupsToFocus: JSON.stringify(analysis.muscleGroupsToFocus),
          recommendations: JSON.stringify(analysis.recommendations),
          measurementSnapshot: latestMeasurement ? JSON.stringify({
            weight: latestMeasurement.weight,
            bodyFat: latestMeasurement.bodyFat,
            muscleMass: latestMeasurement.muscleMass,
            date: latestMeasurement.measureDate,
          }) : null,
          workoutSnapshot: workoutPerformance ? JSON.stringify(workoutPerformance) : null,
          mainRecommendation: analysis.adaptationReason,
          mainRecommendationPriority: analysis.adaptationPriority as 'low' | 'medium' | 'high',
          consistencyScore: workoutPerformance?.consistency ? workoutPerformance.consistency.replace('%', '') : null,
        });
        
        // Atualizar lastAnalyzedAt do aluno
        await db.updateStudentLastAnalyzedAt(input.studentId);
        
        return {
          analysisId,
          analysis,
          studentId: input.studentId,
          studentName: student.name,
          currentWorkout: currentWorkout ? {
            id: currentWorkout.id,
            name: currentWorkout.name,
            daysCount: currentWorkoutDays.length,
          } : null,
          measurementEvolution,
          workoutPerformance,
          latestMeasurement: latestMeasurement ? {
            weight: latestMeasurement.weight,
            bodyFat: latestMeasurement.bodyFat,
            muscleMass: latestMeasurement.muscleMass,
            date: latestMeasurement.measureDate,
          } : null,
          totalWorkouts: workouts.length,
        };
      }),
    
    // Gerar Treino 2.0 adaptado baseado na evolução do aluno
    generateAdaptedWorkout: personalProcedure
      .input(z.object({
        studentId: z.number(),
        previousWorkoutId: z.number().optional(), // Se informado, compara com este treino
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o personal tem CREF cadastrado
        const user = await db.getUserById(ctx.user.id);
        if (!user?.cref) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Para gerar treinos com IA, é necessário cadastrar seu CREF nas configurações. Acesse Configurações > Perfil para adicionar.' 
          });
        }
        
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar anamnese, medidas, treinos anteriores e logs
        const [anamnesis, measurements, workouts, workoutLogs] = await Promise.all([
          db.getAnamnesisByStudentId(input.studentId),
          db.getMeasurementsByStudentId(input.studentId),
          db.getWorkoutsByStudentId(input.studentId),
          db.getWorkoutLogsByStudentId(input.studentId),
        ]);
        
        // Identificar treino anterior para comparação
        let previousWorkout = null;
        let previousWorkoutDays: any[] = [];
        if (input.previousWorkoutId) {
          previousWorkout = await db.getWorkoutById(input.previousWorkoutId);
          if (previousWorkout) {
            previousWorkoutDays = await db.getWorkoutDaysByWorkoutId(previousWorkout.id);
            // Buscar exercícios de cada dia
            for (const day of previousWorkoutDays) {
              (day as any).exercises = await db.getExercisesByWorkoutDayId(day.id);
            }
          }
        } else if (workouts.length > 0) {
          // Pegar o treino mais recente
          previousWorkout = workouts[0];
          previousWorkoutDays = await db.getWorkoutDaysByWorkoutId(previousWorkout.id);
          for (const day of previousWorkoutDays) {
            (day as any).exercises = await db.getExercisesByWorkoutDayId(day.id);
          }
        }
        
        // Calcular versão do treino
        const workoutVersion = workouts.length + 1;
        
        // Analisar evolução das medidas
        let measurementEvolution = null;
        if (measurements.length >= 2) {
          const sorted = [...measurements].sort((a, b) => 
            new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
          );
          const latest = sorted[0];
          const oldest = sorted[sorted.length - 1];
          measurementEvolution = {
            weightChange: latest.weight && oldest.weight ? 
              parseFloat(latest.weight) - parseFloat(oldest.weight) : null,
            bodyFatChange: latest.bodyFat && oldest.bodyFat ?
              parseFloat(latest.bodyFat) - parseFloat(oldest.bodyFat) : null,
            muscleMassChange: latest.muscleMass && oldest.muscleMass ?
              parseFloat(latest.muscleMass) - parseFloat(oldest.muscleMass) : null,
            waistChange: latest.waist && oldest.waist ?
              parseFloat(latest.waist) - parseFloat(oldest.waist) : null,
            periodDays: Math.round((new Date(latest.measureDate).getTime() - new Date(oldest.measureDate).getTime()) / (1000 * 60 * 60 * 24)),
          };
        }
        
        // Analisar desempenho nos treinos (logs)
        let workoutPerformance = null;
        if (workoutLogs.length > 0) {
          const last30Days = workoutLogs.filter(log => {
            const logDate = new Date(log.trainingDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return logDate >= thirtyDaysAgo;
          });
          
          workoutPerformance = {
            totalWorkouts: last30Days.length,
            averagePerWeek: (last30Days.length / 4.3).toFixed(1),
            consistency: anamnesis?.weeklyFrequency ? 
              ((last30Days.length / 4.3) / anamnesis.weeklyFrequency * 100).toFixed(0) + '%' : 'N/A',
          };
        }
        
        // Montar prompt para a IA
        const systemPrompt = `Você é um personal trainer experiente. Sua tarefa é criar um TREINO 2.0 ADAPTADO baseado na evolução do aluno.

Você DEVE retornar um JSON válido no seguinte formato:
{
  "name": "Treino ${workoutVersion}.0 - [Nome Descritivo]",
  "description": "Descrição do treino adaptado",
  "goal": "hypertrophy|weight_loss|recomposition|conditioning|strength|bulking|cutting|general",
  "difficulty": "beginner|intermediate|advanced",
  "type": "strength|cardio|flexibility|functional|mixed",
  "adaptationReason": "Explicação das adaptações feitas baseado na evolução",
  "deficitsAddressed": ["lista de déficits que este treino aborda"],
  "improvements": ["lista de melhorias em relação ao treino anterior"],
  "days": [
    {
      "name": "Nome do Dia",
      "exercises": [
        {
          "name": "Nome do Exercício",
          "muscleGroup": "Grupo Muscular",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "notes": "Observações"
        }
      ]
    }
  ]
}

REGRAS PARA ADAPTAÇÃO:
1. ANALISE a evolução das medidas - se não houve melhora, ajuste o treino
2. IDENTIFIQUE déficits - grupos musculares que não evoluíram
3. COMPARE com o treino anterior - mantenha o que funcionou, mude o que não funcionou
4. CONSIDERE a consistência - se o aluno não treinou muito, simplifique
5. AUMENTE progressivamente a intensidade se houve boa evolução
6. MANTENHA a mesma frequência semanal do treino anterior
7. SUBSTITUA exercícios que não trouxeram resultados
8. ADICIONE mais volume nos grupos em déficit`;
        
        const userPrompt = `Crie um TREINO ${workoutVersion}.0 ADAPTADO para este aluno:

Informações do Aluno:
- Nome: ${student.name}
- Gênero: ${student.gender === 'male' ? 'masculino' : student.gender === 'female' ? 'feminino' : 'não informado'}

Anamnese:
${anamnesis ? JSON.stringify({
  objetivo: anamnesis.mainGoal,
  nivelExperiencia: anamnesis.exerciseExperience,
  frequenciaSemanal: anamnesis.weeklyFrequency,
  localTreino: anamnesis.trainingLocation,
  restricoes: anamnesis.trainingRestrictions,
  enfasesMusculares: anamnesis.muscleEmphasis,
}, null, 2) : 'Não preenchida'}

EVOLUÇÃO DAS MEDIDAS:
${measurementEvolution ? JSON.stringify(measurementEvolution, null, 2) : 'Sem dados de evolução'}

DESEMPENHO NOS TREINOS (Últimos 30 dias):
${workoutPerformance ? JSON.stringify(workoutPerformance, null, 2) : 'Sem logs de treino'}

TREINO ANTERIOR (${previousWorkout?.name || 'N/A'}):
${previousWorkoutDays.length > 0 ? JSON.stringify(previousWorkoutDays.map(d => ({
  dia: d.name,
  exercicios: (d as any).exercises?.map((e: any) => e.name) || [],
})), null, 2) : 'Nenhum treino anterior'}

${input.customPrompt ? `Instruções adicionais: ${input.customPrompt}` : ''}

Crie um treino adaptado que:
1. Mantenha o que funcionou do treino anterior
2. Ajuste o que não trouxe resultados
3. Foque nos grupos musculares em déficit
4. Considere a consistência do aluno

Retorne APENAS o JSON.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'adapted_workout_plan',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  goal: { type: 'string', enum: ['hypertrophy', 'weight_loss', 'recomposition', 'conditioning', 'strength', 'bulking', 'cutting', 'general'] },
                  difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                  type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'functional', 'mixed'] },
                  adaptationReason: { type: 'string' },
                  deficitsAddressed: { type: 'array', items: { type: 'string' } },
                  improvements: { type: 'array', items: { type: 'string' } },
                  days: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        exercises: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              muscleGroup: { type: 'string' },
                              sets: { type: 'integer' },
                              reps: { type: 'string' },
                              restSeconds: { type: 'integer' },
                              notes: { type: 'string' },
                            },
                            required: ['name', 'muscleGroup', 'sets', 'reps', 'restSeconds'],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ['name', 'exercises'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['name', 'description', 'goal', 'difficulty', 'type', 'adaptationReason', 'deficitsAddressed', 'improvements', 'days'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar treino adaptado' });
        }
        
        const workoutPlan = JSON.parse(content);
        
        return {
          preview: workoutPlan,
          studentId: input.studentId,
          studentName: student.name,
          version: workoutVersion,
          previousWorkoutId: previousWorkout?.id,
          previousWorkoutName: previousWorkout?.name,
          measurementEvolution,
          workoutPerformance,
        };
      }),
    
    // Comparar eficiência entre dois treinos
    compareWorkoutEfficiency: personalProcedure
      .input(z.object({
        studentId: z.number(),
        workoutId1: z.number(),
        workoutId2: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar os dois treinos
        const [workout1, workout2] = await Promise.all([
          db.getWorkoutById(input.workoutId1),
          db.getWorkoutById(input.workoutId2),
        ]);
        
        if (!workout1 || !workout2) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Treino não encontrado' });
        }
        
        // Buscar medidas do período de cada treino
        const measurements = await db.getMeasurementsByStudentId(input.studentId);
        const workoutLogs = await db.getWorkoutLogsByStudentId(input.studentId);
        
        // Filtrar logs por treino
        const logsWorkout1 = workoutLogs.filter(log => log.workoutId === input.workoutId1);
        const logsWorkout2 = workoutLogs.filter(log => log.workoutId === input.workoutId2);
        
        // Calcular métricas de cada treino
        const metrics1 = {
          totalSessions: logsWorkout1.length,
          averageDuration: logsWorkout1.length > 0 ? 
            logsWorkout1.reduce((sum, log) => sum + (log.totalDuration || 0), 0) / logsWorkout1.length : 0,
        };
        
        const metrics2 = {
          totalSessions: logsWorkout2.length,
          averageDuration: logsWorkout2.length > 0 ? 
            logsWorkout2.reduce((sum, log) => sum + (log.totalDuration || 0), 0) / logsWorkout2.length : 0,
        };
        
        // Montar prompt para análise
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um personal trainer especialista em análise de desempenho esportivo.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NÃO use markdown (**, ##, ---, |, etc)
- NÃO use tabelas
- Use emojis para deixar o texto mais visual e agradável
- Escreva em parágrafos curtos e diretos
- Use quebras de linha para separar seções
- Seja objetivo e prático`
            },
            {
              role: 'user',
              content: `Compare a eficiência destes dois treinos de forma clara e visual:

TREINO 1: ${workout1.name}
• Sessões realizadas: ${metrics1.totalSessions}
• Duração média: ${metrics1.averageDuration.toFixed(0)} min

TREINO 2: ${workout2.name}
• Sessões realizadas: ${metrics2.totalSessions}
• Duração média: ${metrics2.averageDuration.toFixed(0)} min

Escreva uma análise com estas seções (use emojis nos títulos):

🎯 VEREDITO - Qual treino foi mais eficiente e por quê (2-3 frases)

📊 CONSISTÊNCIA - Análise da aderência do aluno (2-3 frases)

💡 RECOMENDAÇÕES - O que manter e o que mudar (lista com 3-4 pontos)

Lembre-se: texto limpo, sem markdown, com emojis, fácil de ler.`
            }
          ]
        });
        
        const analysis = response.choices?.[0]?.message?.content || 'Não foi possível gerar a análise.';
        
        return {
          analysis,
          workout1: {
            id: workout1.id,
            name: workout1.name,
            metrics: metrics1,
          },
          workout2: {
            id: workout2.id,
            name: workout2.name,
            metrics: metrics2,
          },
        };
      }),
    
    // Salvar treino gerado pela IA
    saveAIGenerated: personalProcedure
      .input(z.object({
        studentId: z.number(),
        workout: z.object({
          name: z.string(),
          description: z.string(),
          goal: z.string(),
          difficulty: z.string(),
          type: z.string(),
          days: z.array(z.object({
            name: z.string(),
            exercises: z.array(z.object({
              name: z.string(),
              muscleGroup: z.string(),
              sets: z.number(),
              reps: z.string(),
              restSeconds: z.number(),
              notes: z.string().optional(),
            })),
          })),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { workout } = input;
        
        // Criar o treino principal
        const workoutId = await db.createWorkout({
          studentId: input.studentId,
          personalId: ctx.personal.id,
          name: workout.name,
          description: workout.description,
          type: workout.type as any,
          goal: workout.goal as any,
          difficulty: workout.difficulty as any,
          isTemplate: false,
          generatedByAI: true,
        });
        
        // Criar os dias e exercícios
        const dayOfWeekMap = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (let i = 0; i < workout.days.length; i++) {
          const day = workout.days[i];
          const dayId = await db.createWorkoutDay({
            workoutId,
            dayOfWeek: dayOfWeekMap[i % 7] as any,
            name: day.name,
            order: i,
          });
          
          for (let j = 0; j < day.exercises.length; j++) {
            const exercise = day.exercises[j];
            await db.createExercise({
              workoutDayId: dayId,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              sets: exercise.sets,
              reps: exercise.reps,
              restSeconds: exercise.restSeconds,
              notes: exercise.notes,
              order: j,
            });
          }
        }
        
        return { id: workoutId, name: workout.name };
      }),
    
    // Duplicar treino para outro aluno
    duplicate: personalProcedure
      .input(z.object({
        workoutId: z.number(),
        targetStudentId: z.number(),
        customName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar treino original com dias e exercícios
        const originalWorkout = await db.getWorkoutById(input.workoutId);
        if (!originalWorkout) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Treino não encontrado' });
        }
        
        const days = await db.getWorkoutDaysByWorkoutId(input.workoutId);
        
        // Criar novo treino
        const newWorkoutId = await db.createWorkout({
          studentId: input.targetStudentId,
          personalId: ctx.personal.id,
          name: input.customName || `${originalWorkout.name} (Cópia)`,
          description: originalWorkout.description,
          type: originalWorkout.type,
          goal: originalWorkout.goal as any,
          difficulty: originalWorkout.difficulty,
          isTemplate: false,
          generatedByAI: originalWorkout.generatedByAI,
        });
        
        // Duplicar dias e exercícios
        for (const day of days) {
          const newDayId = await db.createWorkoutDay({
            workoutId: newWorkoutId,
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            notes: day.notes,
            order: day.order,
          });
          
          const exercises = await db.getExercisesByWorkoutDayId(day.id);
          for (const exercise of exercises) {
            await db.createExercise({
              workoutDayId: newDayId,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restSeconds: exercise.restSeconds,
              tempo: exercise.tempo,
              notes: exercise.notes,
              videoUrl: exercise.videoUrl,
              order: exercise.order,
            });
          }
        }
        
        return { id: newWorkoutId, name: input.customName || `${originalWorkout.name} (Cópia)` };
      }),
    
    // Listar histórico de análises de um aluno
    getAnalysisHistory: personalProcedure
      .input(z.object({
        studentId: z.number(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const analyses = await db.getAiAnalysesByStudentId(input.studentId, input.limit);
        return analyses.map(a => ({
          ...a,
          strengths: a.strengths ? JSON.parse(a.strengths) : [],
          attentionPoints: a.attentionPoints ? JSON.parse(a.attentionPoints) : [],
          muscleGroupsEvolving: a.muscleGroupsEvolving ? JSON.parse(a.muscleGroupsEvolving) : [],
          muscleGroupsToFocus: a.muscleGroupsToFocus ? JSON.parse(a.muscleGroupsToFocus) : [],
          recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
          measurementSnapshot: a.measurementSnapshot ? JSON.parse(a.measurementSnapshot) : null,
          workoutSnapshot: a.workoutSnapshot ? JSON.parse(a.workoutSnapshot) : null,
        }));
      }),
    
    // Buscar análise específica
    getAnalysisById: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAiAnalysisById(input.id);
        if (!analysis) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Análise não encontrada' });
        }
        return {
          ...analysis,
          strengths: analysis.strengths ? JSON.parse(analysis.strengths) : [],
          attentionPoints: analysis.attentionPoints ? JSON.parse(analysis.attentionPoints) : [],
          muscleGroupsEvolving: analysis.muscleGroupsEvolving ? JSON.parse(analysis.muscleGroupsEvolving) : [],
          muscleGroupsToFocus: analysis.muscleGroupsToFocus ? JSON.parse(analysis.muscleGroupsToFocus) : [],
          recommendations: analysis.recommendations ? JSON.parse(analysis.recommendations) : [],
          measurementSnapshot: analysis.measurementSnapshot ? JSON.parse(analysis.measurementSnapshot) : null,
          workoutSnapshot: analysis.workoutSnapshot ? JSON.parse(analysis.workoutSnapshot) : null,
        };
      }),
    
    // Marcar análise como compartilhada via WhatsApp
    markAnalysisShared: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAiAnalysis(input.id, {
          sharedViaWhatsapp: true,
          sharedAt: new Date(),
        });
        return { success: true };
      }),
    
    // Marcar análise como exportada em PDF
    markAnalysisExported: personalProcedure
      .input(z.object({ id: z.number(), pdfUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAiAnalysis(input.id, {
          exportedAsPdf: true,
          pdfUrl: input.pdfUrl,
        });
        return { success: true };
      }),
    
    // Vincular treino gerado à análise
    linkGeneratedWorkout: personalProcedure
      .input(z.object({ analysisId: z.number(), workoutId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAiAnalysis(input.analysisId, {
          generatedWorkoutId: input.workoutId,
        });
        return { success: true };
      }),
  }),

  // ==================== WORKOUT DAYS ====================
  workoutDays: router({
    create: personalProcedure
      .input(z.object({
        workoutId: z.number(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        name: z.string().optional(),
        notes: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createWorkoutDay(input);
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
        name: z.string().optional(),
        notes: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateWorkoutDay(id, data);
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWorkoutDay(input.id);
        return { success: true };
      }),
  }),

  // ==================== EXERCISES ====================
  exercises: router({
    create: personalProcedure
      .input(z.object({
        workoutDayId: z.number(),
        name: z.string().min(1),
        muscleGroup: z.string().optional(),
        sets: z.number().optional(),
        reps: z.string().optional(),
        weight: z.string().optional(),
        restSeconds: z.number().optional(),
        tempo: z.string().optional(),
        notes: z.string().optional(),
        videoUrl: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createExercise(input);
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        muscleGroup: z.string().optional(),
        sets: z.number().optional(),
        reps: z.string().optional(),
        weight: z.string().optional(),
        restSeconds: z.number().optional(),
        tempo: z.string().optional(),
        notes: z.string().optional(),
        videoUrl: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateExercise(id, data);
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteExercise(input.id);
        return { success: true };
      }),
  }),

  // ==================== WORKOUT LOGS (Diário de Treino) ====================
  workoutLogs: router({
    list: personalProcedure
      .input(z.object({ workoutId: z.number() }))
      .query(async ({ ctx, input }) => {
        const logs = await db.getWorkoutLogsByWorkoutId(input.workoutId);
        // Get exercise logs for each workout log
        const logsWithExercises = await Promise.all(
          logs.map(async (log) => {
            const exerciseLogs = await db.getExerciseLogsByWorkoutLogId(log.id);
            return { ...log, exerciseLogs };
          })
        );
        return logsWithExercises;
      }),
    
    get: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const log = await db.getWorkoutLogById(input.id);
        if (!log) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registro não encontrado' });
        }
        const exerciseLogs = await db.getExerciseLogsByWorkoutLogId(log.id);
        return { ...log, exerciseLogs };
      }),
    
    create: personalProcedure
      .input(z.object({
        workoutId: z.number(),
        workoutDayId: z.number(),
        studentId: z.number(),
        trainingDate: z.string(),
        duration: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { trainingDate, ...data } = input;
        const id = await db.createWorkoutLog({
          ...data,
          personalId: ctx.personal.id,
          trainingDate: new Date(trainingDate),
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        trainingDate: z.string().optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, trainingDate, ...data } = input;
        await db.updateWorkoutLog(id, {
          ...data,
          trainingDate: trainingDate ? new Date(trainingDate) : undefined,
        });
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWorkoutLog(input.id);
        return { success: true };
      }),
    
    // Initialize exercise logs for a new session based on workout day exercises
    initializeExercises: personalProcedure
      .input(z.object({
        workoutLogId: z.number(),
        workoutDayId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const exercises = await db.getExercisesByWorkoutDayId(input.workoutDayId);
        const exerciseLogs = exercises.map((exercise, index) => ({
          workoutLogId: input.workoutLogId,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          order: index,
        }));
        await db.bulkCreateExerciseLogs(exerciseLogs);
        return { count: exerciseLogs.length };
      }),
  }),

  // ==================== EXERCISE LOGS ====================
  exerciseLogs: router({
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        set1Weight: z.string().optional(),
        set1Reps: z.number().optional(),
        set2Weight: z.string().optional(),
        set2Reps: z.number().optional(),
        set3Weight: z.string().optional(),
        set3Reps: z.number().optional(),
        set4Weight: z.string().optional(),
        set4Reps: z.number().optional(),
        set5Weight: z.string().optional(),
        set5Reps: z.number().optional(),
        notes: z.string().optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateExerciseLog(id, data);
        return { success: true };
      }),
    
    bulkUpdate: personalProcedure
      .input(z.object({
        logs: z.array(z.object({
          id: z.number(),
          set1Weight: z.string().optional(),
          set1Reps: z.number().optional(),
          set2Weight: z.string().optional(),
          set2Reps: z.number().optional(),
          set3Weight: z.string().optional(),
          set3Reps: z.number().optional(),
          set4Weight: z.string().optional(),
          set4Reps: z.number().optional(),
          set5Weight: z.string().optional(),
          set5Reps: z.number().optional(),
          notes: z.string().optional(),
          completed: z.boolean().optional(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const updates = input.logs.map(({ id, ...data }) => ({ id, data }));
        await db.bulkUpdateExerciseLogs(updates);
        return { success: true };
      }),
    
    // Get exercise history for progression tracking
    history: personalProcedure
      .input(z.object({ exerciseId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getExerciseHistory(input.exerciseId, input.limit || 10);
      }),
  }),

  // ==================== SESSIONS ====================
  sessions: router({
    list: personalProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        studentId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const filters = input ? {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          studentId: input.studentId,
          status: input.status,
        } : undefined;
        
        const sessions = await db.getSessionsByPersonalId(ctx.personal.id, filters);
        
        // Get student names for each session
        const studentIds = Array.from(new Set(sessions.map(s => s.studentId)));
        const studentsMap = new Map();
        
        for (const studentId of studentIds) {
          const student = await db.getStudentById(studentId, ctx.personal.id);
          if (student) studentsMap.set(studentId, student);
        }
        
        // Get workout log IDs for ALL sessions (to know which ones have been filled)
        const sessionsWithLogs = await Promise.all(
          sessions.map(async (session) => {
            const log = await db.getWorkoutLogBySessionId(session.id);
            const workoutLogId = log ? log.id : null;
            return {
              ...session,
              student: studentsMap.get(session.studentId),
              workoutLogId,
              hasWorkoutLog: !!log, // Flag to indicate if session has a workout log
            };
          })
        );
        
        return sessionsWithLogs;
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        scheduledAt: z.string(),
        duration: z.number().optional(),
        type: z.enum(['regular', 'trial', 'makeup', 'extra']).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        packageId: z.number().optional(),
        workoutId: z.number().optional(),
        workoutDayIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { scheduledAt, ...data } = input;
        // Parsear a data local e armazenar como UTC
        // O formato esperado é "yyyy-MM-ddTHH:mm" (datetime-local)
        // O usuário está no Brasil (GMT-3), então precisamos armazenar o horário como se fosse UTC
        // para que ao exibir (que também interpreta como UTC) mostre o horário correto
        const [datePart, timePart] = scheduledAt.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        // Criar data UTC diretamente com os valores do usuário
        // Isso evita qualquer conversão de timezone
        const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
        
        // Verificar conflito de horário
        const duration = input.duration || 60;
        const endTime = new Date(localDate.getTime() + duration * 60 * 1000);
        const conflict = await db.checkSessionConflict(ctx.personal.id, localDate, endTime);
        if (conflict) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: `Conflito de horário! Já existe uma sessão agendada para ${conflict.studentName} às ${conflict.time}` 
          });
        }
        
        const id = await db.createSession({
          ...data,
          personalId: ctx.personal.id,
          scheduledAt: localDate,
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        scheduledAt: z.string().optional(),
        duration: z.number().optional(),
        status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
        type: z.enum(['regular', 'trial', 'makeup', 'extra']).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        cancelReason: z.string().optional(),
        workoutId: z.number().nullable().optional(),
        workoutDayIndex: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, scheduledAt, ...data } = input;
        
        // Parsear a data local e armazenar como UTC
        let parsedDate: Date | undefined;
        if (scheduledAt) {
          const [datePart, timePart] = scheduledAt.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const timeStr = timePart || '00:00';
          const [hours, minutes] = timeStr.split(':').map(Number);
          // Criar data UTC diretamente com os valores do usuário
          parsedDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
          
          // Verificar conflito de horário (excluindo a sessão atual)
          const duration = input.duration || 60;
          const endTime = new Date(parsedDate.getTime() + duration * 60 * 1000);
          const conflict = await db.checkSessionConflict(ctx.personal.id, parsedDate, endTime, id);
          if (conflict) {
            throw new TRPCError({ 
              code: 'CONFLICT', 
              message: `Conflito de horário! Já existe uma sessão agendada para ${conflict.studentName} às ${conflict.time}` 
            });
          }
        }
        
        await db.updateSession(id, {
          ...data,
          scheduledAt: parsedDate,
          completedAt: data.status === 'completed' ? new Date() : undefined,
        });
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSession(input.id);
        return { success: true };
      }),
    
    // Listar sessões por aluno (para portal do aluno)
    listByStudent: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const sessions = await db.getSessionsByStudentId(input.studentId);
        
        // Buscar informações dos treinos vinculados
        const workoutIds = Array.from(new Set(sessions.filter(s => s.workoutId).map(s => s.workoutId!)));
        const workoutsMap = new Map();
        
        for (const workoutId of workoutIds) {
          const workout = await db.getWorkoutById(workoutId);
          if (workout) {
            // Buscar os dias do treino
            const days = await db.getWorkoutDaysByWorkoutId(workoutId);
            workoutsMap.set(workoutId, { ...workout, days });
          }
        }
        
        return sessions.map(s => {
          const workout = s.workoutId ? workoutsMap.get(s.workoutId) : null;
          const workoutDay = workout && s.workoutDayIndex !== null && workout.days 
            ? workout.days[s.workoutDayIndex] 
            : null;
          
          return {
            id: s.id,
            date: s.scheduledAt,
            time: s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            duration: s.duration || 60,
            status: s.status,
            notes: s.notes,
            workoutId: s.workoutId,
            workoutDayIndex: s.workoutDayIndex,
            workoutName: workout?.name || null,
            workoutDayName: workoutDay?.name || null,
          };
        });
      }),
    
    getById: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.id);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        const student = await db.getStudentById(session.studentId, ctx.personal.id);
        return { ...session, student };
      }),
    
    // Estatísticas de frequência por aluno
    studentStats: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const sessions = await db.getSessionsByStudentId(input.studentId);
        
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        
        const completed = sessions.filter(s => s.status === 'completed');
        const noShow = sessions.filter(s => s.status === 'no_show');
        const cancelled = sessions.filter(s => s.status === 'cancelled');
        
        const thisMonthCompleted = completed.filter(s => new Date(s.scheduledAt) >= thisMonth);
        const lastMonthCompleted = completed.filter(s => {
          const d = new Date(s.scheduledAt);
          return d >= lastMonth && d < thisMonth;
        });
        
        // Frequência por mês (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'short' });
          
          const monthCompleted = completed.filter(s => {
            const d = new Date(s.scheduledAt);
            return d >= monthStart && d <= monthEnd;
          }).length;
          
          const monthNoShow = noShow.filter(s => {
            const d = new Date(s.scheduledAt);
            return d >= monthStart && d <= monthEnd;
          }).length;
          
          monthlyData.push({
            month: monthName,
            presencas: monthCompleted,
            faltas: monthNoShow,
          });
        }
        
        const totalSessions = sessions.length;
        const attendanceRate = totalSessions > 0 
          ? Math.round((completed.length / totalSessions) * 100) 
          : 0;
        
        return {
          total: totalSessions,
          completed: completed.length,
          noShow: noShow.length,
          cancelled: cancelled.length,
          thisMonth: thisMonthCompleted.length,
          lastMonth: lastMonthCompleted.length,
          attendanceRate,
          monthlyData,
        };
      }),
    
    // Lixeira de sessões
    listDeleted: personalProcedure
      .query(async ({ ctx }) => {
        return await db.getDeletedSessionsByPersonalId(ctx.personal.id);
      }),
    
    restore: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.restoreSession(input.id);
        return { success: true };
      }),
    
    deletePermanently: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSessionPermanently(input.id);
        return { success: true };
      }),
    
    // Cancelar sessões futuras em lote
    cancelFuture: personalProcedure
      .input(z.object({
        studentId: z.number(),
        fromDate: z.string().optional(), // Se não informado, cancela todas
        toDate: z.string().optional(), // Se não informado, cancela todas futuras
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Se não informar fromDate, cancela todas as sessões (sem filtro de data)
        const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
        const toDate = input.toDate ? new Date(input.toDate) : undefined;
        
        const count = await db.cancelFutureSessions({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          fromDate,
          toDate,
          reason: input.reason,
        });
        
        return { success: true, count, message: `${count} sessão(s) cancelada(s) com sucesso` };
      }),
    
    // Excluir sessões futuras em lote
    deleteFuture: personalProcedure
      .input(z.object({
        studentId: z.number(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Se não informar fromDate, exclui todas as sessões (sem filtro de data)
        const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
        const toDate = input.toDate ? new Date(input.toDate) : undefined;
        
        const count = await db.deleteFutureSessions({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          fromDate,
          toDate,
        });
        
        return { success: true, count, message: `${count} sessão(s) excluída(s) com sucesso` };
      }),
  }),

  // ==================== PLANS ====================
  plans: router({
    list: personalProcedure.query(async ({ ctx }) => {
      return await db.getPlansByPersonalId(ctx.personal.id);
    }),
    
    create: personalProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['recurring', 'fixed', 'sessions']),
        billingCycle: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']).optional(),
        billingDay: z.number().min(1).max(28).optional(),
        durationMonths: z.number().optional(),
        totalSessions: z.number().optional(),
        price: z.string(),
        sessionsPerWeek: z.number().optional(),
        sessionDuration: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createPlan({
          ...input,
          personalId: ctx.personal.id,
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(['recurring', 'fixed', 'sessions']).optional(),
        billingCycle: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']).optional(),
        billingDay: z.number().min(1).max(28).optional(),
        durationMonths: z.number().optional(),
        totalSessions: z.number().optional(),
        price: z.string().optional(),
        sessionsPerWeek: z.number().optional(),
        sessionDuration: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePlan(id, data);
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePlan(input.id);
        return { success: true };
      }),
  }),

  // ==================== PACKAGES ====================
  packages: router({
    listByStudent: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPackagesByStudentId(input.studentId);
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        planId: z.number(),
        startDate: z.string(),
        endDate: z.string().optional(),
        price: z.string(),
        notes: z.string().optional(),
        // Novos campos para agendamento automático
        trainingDays: z.array(z.number()).optional(), // [1, 3, 5] para Seg, Qua, Sex
        defaultTime: z.string().optional(), // "08:00"
        weeksToSchedule: z.number().optional().default(4), // Número de semanas para agendar
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getPlanById(input.planId);
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const { startDate, endDate, trainingDays, defaultTime, weeksToSchedule, ...data } = input;
        const id = await db.createPackage({
          ...data,
          personalId: ctx.personal.id,
          startDate: new Date(startDate + 'T12:00:00'),
          endDate: endDate ? new Date(endDate + 'T12:00:00') : undefined,
          totalSessions: plan.totalSessions,
          remainingSessions: plan.totalSessions,
          trainingDays: trainingDays ? JSON.stringify(trainingDays) : undefined,
          defaultTime: defaultTime || '08:00',
          status: 'active',
        });
        
        // Gerar sessões automaticamente se dias de treino foram definidos
        if (trainingDays && trainingDays.length > 0 && defaultTime) {
          const weeks = weeksToSchedule || 4;
          const start = new Date(startDate + 'T12:00:00');
          const sessionsToCreate = [];
          
          for (let week = 0; week < weeks; week++) {
            for (const dayOfWeek of trainingDays) {
              // Calcular a data da sessão
              const sessionDate = new Date(start);
              sessionDate.setDate(start.getDate() + (week * 7));
              
              // Ajustar para o dia da semana correto
              const currentDay = sessionDate.getDay();
              const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
              sessionDate.setDate(sessionDate.getDate() + daysToAdd);
              
              // Se a data for antes da data de início, pular
              if (sessionDate < start) continue;
              
              // Criar a sessão
              const [hours, minutes] = defaultTime.split(':').map(Number);
              sessionDate.setHours(hours, minutes, 0, 0);
              
              sessionsToCreate.push({
                studentId: input.studentId,
                personalId: ctx.personal.id,
                packageId: id,
                scheduledAt: sessionDate,
                duration: plan.sessionDuration || 60,
                status: 'scheduled' as const,
              });
            }
          }
          
          // Criar todas as sessões
          for (const session of sessionsToCreate) {
            await db.createSession(session);
          }
        }
        
        return { id, sessionsCreated: trainingDays ? trainingDays.length * (weeksToSchedule || 4) : 0 };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['active', 'paused', 'cancelled', 'defaulted', 'expired', 'pending']).optional(),
        usedSessions: z.number().optional(),
        remainingSessions: z.number().optional(),
        notes: z.string().optional(),
        trainingDays: z.array(z.number()).optional(),
        defaultTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, trainingDays, ...data } = input;
        await db.updatePackage(id, {
          ...data,
          trainingDays: trainingDays ? JSON.stringify(trainingDays) : undefined,
        } as any);
        return { success: true };
      }),
    
    // Pausar contrato e cancelar sessões futuras
    pause: personalProcedure
      .input(z.object({ id: z.number(), cancelFutureSessions: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        const pkg = await db.getPackageById(input.id);
        if (!pkg) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pacote não encontrado' });
        }
        
        await db.updatePackage(input.id, { status: 'paused' });
        
        if (input.cancelFutureSessions) {
          await db.cancelFutureSessionsByStudentId(pkg.studentId);
        }
        
        return { success: true };
      }),
    
    // Reativar contrato
    reactivate: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePackage(input.id, { status: 'active' });
        return { success: true };
      }),
    
    // Marcar como inadimplente
    markDefaulted: personalProcedure
      .input(z.object({ id: z.number(), cancelFutureSessions: z.boolean().default(true), cancelFutureCharges: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        const pkg = await db.getPackageById(input.id);
        if (!pkg) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pacote não encontrado' });
        }
        
        await db.updatePackage(input.id, { status: 'defaulted' });
        
        if (input.cancelFutureSessions) {
          await db.cancelFutureSessionsByStudentId(pkg.studentId);
        }
        
        if (input.cancelFutureCharges) {
          await db.cancelFutureChargesByStudentId(pkg.studentId);
        }
        
        return { success: true };
      }),
    
    // Cancelar pacote e excluir todas as sessões futuras
    cancel: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Buscar o pacote
        const pkg = await db.getPackageById(input.id);
        if (!pkg) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pacote não encontrado' });
        }
        
        // Atualizar status do pacote para cancelado
        await db.updatePackage(input.id, { status: 'cancelled' });
        
        // Excluir todas as sessões futuras do pacote
        await db.deleteSessionsByPackageId(input.id);
        
        return { success: true };
      }),
  }),

  // ==================== CHARGES ====================
  charges: router({
    stats: personalProcedure.query(async ({ ctx }) => {
      const charges = await db.getChargesByPersonalId(ctx.personal.id);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      let totalPending = 0;
      let totalOverdue = 0;
      let totalPaidThisMonth = 0;
      let expectedThisMonth = 0;
      let pendingCount = 0;
      let overdueCount = 0;
      let paidThisMonthCount = 0;
      
      for (const { charge } of charges) {
        const amount = parseFloat(charge.amount);
        const dueDate = new Date(charge.dueDate);
        
        if (charge.status === 'pending') {
          totalPending += amount;
          pendingCount++;
        } else if (charge.status === 'overdue') {
          totalOverdue += amount;
          overdueCount++;
        } else if (charge.status === 'paid' && charge.paidAt) {
          const paidAt = new Date(charge.paidAt);
          if (paidAt >= startOfMonth && paidAt <= endOfMonth) {
            totalPaidThisMonth += amount;
            paidThisMonthCount++;
          }
        }
        
        if (dueDate >= startOfMonth && dueDate <= endOfMonth) {
          expectedThisMonth += amount;
        }
      }
      
      return {
        totalPending,
        totalOverdue,
        totalPaidThisMonth,
        expectedThisMonth,
        pendingCount,
        overdueCount,
        paidThisMonthCount,
      };
    }),
    
    list: personalProcedure
      .input(z.object({
        status: z.string().optional(),
        studentId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getChargesByPersonalId(ctx.personal.id, input);
      }),
    
    listByStudent: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const charges = await db.getChargesByStudentId(input.studentId);
        return charges.map(c => ({
          id: c.id,
          description: c.description,
          amount: c.amount,
          dueDate: c.dueDate,
          status: c.status,
          paidAt: c.paidAt,
        }));
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        description: z.string(),
        amount: z.string(),
        dueDate: z.string(),
        packageId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { dueDate, ...data } = input;
        const id = await db.createCharge({
          ...data,
          personalId: ctx.personal.id,
          dueDate: new Date(dueDate),
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
        paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'transfer', 'other']).optional(),
        paidAmount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        
        if (data.status === 'paid') {
          updateData.paidAt = new Date();
        }
        
        await db.updateCharge(id, updateData);
        return { success: true };
      }),
    
    markAsPaid: personalProcedure
      .input(z.object({
        id: z.number(),
        paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'transfer', 'other']),
        paidAmount: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCharge(input.id, {
          status: 'paid',
          paymentMethod: input.paymentMethod,
          paidAmount: input.paidAmount,
          paidAt: new Date(),
          notes: input.notes,
        });
        return { success: true };
      }),
    
    // Gerar cobranças automáticas ao vincular plano
    generateFromPackage: personalProcedure
      .input(z.object({
        studentId: z.number(),
        planId: z.number(),
        startDate: z.string(),
        billingDay: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getPlanById(input.planId, ctx.personal.id);
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        const startDate = new Date(input.startDate);
        const billingDay = input.billingDay || 5;
        const charges: { id: number }[] = [];
        
        // Calcular número de cobranças baseado no ciclo
        let numCharges = 1;
        let monthsPerCharge = 1;
        
        if (plan.type === 'recurring') {
          switch (plan.billingCycle) {
            case 'weekly':
              numCharges = 4; // 4 semanas
              break;
            case 'biweekly':
              numCharges = 2; // 2 quinzenas
              break;
            case 'monthly':
              numCharges = 12; // 12 meses
              break;
            case 'quarterly':
              numCharges = 4; // 4 trimestres
              monthsPerCharge = 3;
              break;
            case 'semiannual':
              numCharges = 2; // 2 semestres
              monthsPerCharge = 6;
              break;
            case 'annual':
              numCharges = 1; // 1 ano
              monthsPerCharge = 12;
              break;
          }
        }
        
        // Criar cobranças
        for (let i = 0; i < numCharges; i++) {
          const dueDate = new Date(startDate);
          
          if (plan.billingCycle === 'weekly') {
            dueDate.setDate(dueDate.getDate() + (i * 7));
          } else if (plan.billingCycle === 'biweekly') {
            dueDate.setDate(dueDate.getDate() + (i * 14));
          } else {
            dueDate.setMonth(dueDate.getMonth() + (i * monthsPerCharge));
            dueDate.setDate(billingDay);
          }
          
          const chargeId = await db.createCharge({
            studentId: input.studentId,
            personalId: ctx.personal.id,
            description: `${plan.name} - ${student.name}`,
            amount: plan.price,
            dueDate,
            status: 'pending',
          });
          
          charges.push({ id: chargeId });
        }
        
        return { 
          success: true, 
          chargesCreated: charges.length,
          message: `${charges.length} cobrança(s) gerada(s) automaticamente`
        };
      }),
    
    // Criar link de pagamento Stripe para uma cobrança
    createPaymentLink: personalProcedure
      .input(z.object({
        chargeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const charge = await db.getChargeById(input.chargeId);
        if (!charge) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobrança não encontrada' });
        }
        
        const student = await db.getStudentById(charge.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        const amount = priceToCents(parseFloat(charge.amount));
        const paymentLink = await createPaymentLink({
          amount,
          description: charge.description,
          metadata: {
            charge_id: charge.id.toString(),
            student_id: student.id.toString(),
            personal_id: ctx.personal.id.toString(),
          },
        });
        
        return { url: paymentLink.url };
      }),
    
    // Cancelar cobranças pendentes em lote
    cancelFuture: personalProcedure
      .input(z.object({
        studentId: z.number(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fromDate = input.fromDate ? new Date(input.fromDate) : new Date();
        const toDate = input.toDate ? new Date(input.toDate) : undefined;
        
        const count = await db.cancelFutureCharges({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          fromDate,
          toDate,
        });
        
        return { success: true, count, message: `${count} cobrança(s) cancelada(s) com sucesso` };
      }),
    
    // Excluir cobranças pendentes em lote
    deleteFuture: personalProcedure
      .input(z.object({
        studentId: z.number(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fromDate = input.fromDate ? new Date(input.fromDate) : new Date();
        const toDate = input.toDate ? new Date(input.toDate) : undefined;
        
        const count = await db.deleteFutureCharges({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          fromDate,
          toDate,
        });
        
        return { success: true, count, message: `${count} cobrança(s) excluída(s) com sucesso` };
      }),
  }),

  // ==================== STRIPE ====================
  stripe: router({
    // Criar sessão de checkout para pagamento de cobrança
    createCheckoutSession: personalProcedure
      .input(z.object({
        chargeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const charge = await db.getChargeById(input.chargeId);
        if (!charge) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cobrança não encontrada' });
        }
        
        const student = await db.getStudentById(charge.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Criar ou recuperar cliente Stripe
        const stripeCustomer = await getOrCreateStripeCustomer(
          student.email || `student-${student.id}@fitprime.app`,
          student.name,
          {
            student_id: student.id.toString(),
            personal_id: ctx.personal.id.toString(),
          }
        );
        
        // Atualizar Stripe Customer ID no aluno
        if (!student.stripeCustomerId) {
          await db.updateStudent(student.id, ctx.personal.id, { stripeCustomerId: stripeCustomer.id } as any);
        }
        
        const origin = ctx.req.headers.origin || 'https://fitprime-manager.manus.space';
        const amount = priceToCents(parseFloat(charge.amount));
        
        // Criar produto e preço temporário
        const { stripe } = await import('./stripe');
        if (!stripe) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado' });
        }
        const product = await stripe.products.create({
          name: charge.description,
          metadata: {
            charge_id: charge.id.toString(),
          },
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: amount,
          currency: 'brl',
        });
        
        const session = await createCheckoutSession({
          customerId: stripeCustomer.id,
          priceId: price.id,
          mode: 'payment',
          successUrl: `${origin}/cobrancas?success=true&charge_id=${charge.id}`,
          cancelUrl: `${origin}/cobrancas?cancelled=true&charge_id=${charge.id}`,
          metadata: {
            charge_id: charge.id.toString(),
            student_id: student.id.toString(),
            personal_id: ctx.personal.id.toString(),
            user_id: ctx.user.id.toString(),
            customer_email: student.email || '',
            customer_name: student.name,
          },
          clientReferenceId: ctx.user.id.toString(),
          allowPromotionCodes: true,
        });
        
        return { url: session.url };
      }),
    
    // Criar assinatura para um pacote
    createSubscription: personalProcedure
      .input(z.object({
        packageId: z.number(),
        planId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pkg = await db.getPackageById(input.packageId);
        if (!pkg) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pacote não encontrado' });
        }
        
        const plan = await db.getPlanById(input.planId, ctx.personal.id);
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const student = await db.getStudentById(pkg.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Criar ou recuperar cliente Stripe
        const stripeCustomer = await getOrCreateStripeCustomer(
          student.email || `student-${student.id}@fitprime.app`,
          student.name,
          {
            student_id: student.id.toString(),
            personal_id: ctx.personal.id.toString(),
          }
        );
        
        if (!student.stripeCustomerId) {
          await db.updateStudent(student.id, ctx.personal.id, { stripeCustomerId: stripeCustomer.id } as any);
        }
        
        const origin = ctx.req.headers.origin || 'https://fitprime-manager.manus.space';
        const amount = priceToCents(parseFloat(plan.price));
        
        // Criar produto e preço recorrente
        const { stripe } = await import('./stripe');
        if (!stripe) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado' });
        }
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description || undefined,
          metadata: {
            plan_id: plan.id.toString(),
            personal_id: ctx.personal.id.toString(),
          },
        });
        
        // Mapear ciclo de cobrança para intervalo do Stripe
        const billingInterval = plan.billingCycle 
          ? billingCycleToStripeInterval[plan.billingCycle] 
          : { interval: 'month' as const, intervalCount: 1 };
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: amount,
          currency: 'brl',
          recurring: {
            interval: billingInterval.interval,
            interval_count: billingInterval.intervalCount,
          },
        });
        
        // Atualizar plano com IDs do Stripe
        await db.updatePlan(plan.id, {
          stripeProductId: product.id,
          stripePriceId: price.id,
        } as any);
        
        const session = await createCheckoutSession({
          customerId: stripeCustomer.id,
          priceId: price.id,
          mode: 'subscription',
          successUrl: `${origin}/alunos/${student.id}?tab=plano&success=true`,
          cancelUrl: `${origin}/alunos/${student.id}?tab=plano&cancelled=true`,
          metadata: {
            package_id: pkg.id.toString(),
            plan_id: plan.id.toString(),
            student_id: student.id.toString(),
            personal_id: ctx.personal.id.toString(),
            user_id: ctx.user.id.toString(),
            customer_email: student.email || '',
            customer_name: student.name,
          },
          clientReferenceId: ctx.user.id.toString(),
          allowPromotionCodes: true,
        });
        
        return { url: session.url };
      }),
    
    // Cancelar assinatura
    cancelSubscription: personalProcedure
      .input(z.object({
        packageId: z.number(),
        immediately: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pkg = await db.getPackageById(input.packageId);
        if (!pkg || !pkg.stripeSubscriptionId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Assinatura não encontrada' });
        }
        
        await cancelSubscription(pkg.stripeSubscriptionId, input.immediately);
        
        if (input.immediately) {
          await db.updatePackage(input.packageId, { status: 'cancelled' });
        }
        
        return { success: true };
      }),
    
    // Criar sessão de checkout para assinatura de plano FitPrime
    createPlanCheckout: publicProcedure
      .input(z.object({
        planId: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { FITPRIME_PLANS, getPlanById } = await import('./stripe/plans');
        const plan = getPlanById(input.planId);
        
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const { stripe } = await import('./stripe');
        if (!stripe) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado' });
        }
        
        // Criar ou recuperar cliente Stripe
        const stripeCustomer = await getOrCreateStripeCustomer(
          input.email,
          input.name || input.email,
          { plan_id: input.planId }
        );
        
        const origin = ctx.req.headers.origin || 'https://fitprime-manager.manus.space';
        const amount = Math.round(plan.price * 100); // Converter para centavos
        
        // Criar produto para o plano
        const product = await stripe.products.create({
          name: `FitPrime ${plan.name}`,
          description: plan.description,
          metadata: {
            plan_id: plan.id,
            student_limit: plan.studentLimit.toString(),
          },
        });
        
        // Criar preço recorrente mensal
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: amount,
          currency: 'brl',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        });
        
        // Criar sessão de checkout
        const session = await createCheckoutSession({
          customerId: stripeCustomer.id,
          priceId: price.id,
          mode: 'subscription',
          successUrl: `${origin}/dashboard?success=true&plan=${plan.id}`,
          cancelUrl: `${origin}/pricing?cancelled=true`,
          metadata: {
            plan_id: plan.id,
            customer_email: input.email,
            customer_name: input.name || '',
          },
          allowPromotionCodes: true,
        });
        
        return { url: session.url, sessionId: session.id };
      }),

    // Verificar status da assinatura
    getSubscriptionStatus: personalProcedure
      .input(z.object({
        packageId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const pkg = await db.getPackageById(input.packageId);
        if (!pkg || !pkg.stripeSubscriptionId) {
          return { status: 'no_subscription' };
        }
        
        const subscription = await getSubscription(pkg.stripeSubscriptionId);
        return {
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        };
      }),
  }),

  // ==================== MATERIALS ====================
  materials: router({
    list: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getMaterialsByStudentId(input.studentId, ctx.personal.id);
      }),
    
    create: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['pdf', 'video', 'image', 'link', 'other']).optional(),
        url: z.string(),
        fileKey: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createMaterial({
          ...input,
          personalId: ctx.personal.id,
        });
        return { id };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMaterial(input.id, ctx.personal.id);
        return { success: true };
      }),
  }),

  // ==================== AUTOMATIONS ====================
  automations: router({
    list: personalProcedure.query(async ({ ctx }) => {
      const automations = await db.getAutomationsByPersonalId(ctx.personal.id);
      // Se não houver automações, criar as padrões automaticamente
      if (automations.length === 0) {
        await db.createDefaultAutomations(ctx.personal.id);
        return await db.getAutomationsByPersonalId(ctx.personal.id);
      }
      return automations;
    }),
    
    createDefaults: personalProcedure.mutation(async ({ ctx }) => {
      const existing = await db.getAutomationsByPersonalId(ctx.personal.id);
      if (existing.length > 0) {
        return { created: 0, message: 'Automações já existem' };
      }
      const count = await db.createDefaultAutomations(ctx.personal.id);
      return { created: count, message: 'Automações padrão criadas com sucesso' };
    }),
    
    create: personalProcedure
      .input(z.object({
        name: z.string(),
        trigger: z.enum(['session_reminder', 'session_confirmation', 'payment_reminder', 'payment_overdue', 'birthday', 'inactive_student', 'welcome', 'custom']),
        messageTemplate: z.string(),
        triggerHoursBefore: z.number().optional(),
        triggerDaysAfter: z.number().optional(),
        sendWindowStart: z.string().optional(),
        sendWindowEnd: z.string().optional(),
        maxMessagesPerDay: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAutomation({
          ...input,
          personalId: ctx.personal.id,
        });
        return { id };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        messageTemplate: z.string().optional(),
        isActive: z.boolean().optional(),
        triggerHoursBefore: z.number().optional(),
        triggerDaysAfter: z.number().optional(),
        sendWindowStart: z.string().optional(),
        sendWindowEnd: z.string().optional(),
        maxMessagesPerDay: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateAutomation(id, data);
        return { success: true };
      }),
    
    delete: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAutomation(input.id);
        return { success: true };
      }),
    
    // Disparar automação manualmente para todos os alunos elegíveis
    triggerManual: personalProcedure
      .input(z.object({ 
        automationId: z.number(),
        studentId: z.number().optional(), // Se informado, envia só para esse aluno
      }))
      .mutation(async ({ ctx, input }) => {
        const automation = await db.getAutomationById(input.automationId);
        if (!automation || automation.personalId !== ctx.personal.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Automação não encontrada' });
        }
        
        const personal = ctx.personal;
        if (!personal.evolutionApiKey || !personal.evolutionInstance) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não configurado. Configure nas Configurações.' });
        }
        
        // Buscar alunos elegíveis
        let students;
        if (input.studentId) {
          const student = await db.getStudentById(input.studentId, ctx.personal.id);
          if (!student) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
          }
          students = [student];
        } else {
          // Buscar todos os alunos ativos com telefone e opt-in
          const allStudents = await db.getStudentsByPersonalId(ctx.personal.id);
          students = allStudents.filter(s => s.phone && s.whatsappOptIn && s.status === 'active');
        }
        
        if (students.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum aluno elegível encontrado' });
        }
        
        const { sendWhatsAppMessage } = await import('./stevo');
        const results = { sent: 0, failed: 0, errors: [] as string[] };
        
        for (const student of students) {
          try {
            // Substituir variáveis na mensagem
            let message = automation.messageTemplate
              .replace(/{nome}/g, student.name)
              .replace(/{telefone}/g, student.phone || '')
              .replace(/{email}/g, student.email || '');
            
            // Adicionar variáveis específicas por tipo de automação
            if (automation.trigger === 'birthday') {
              message = message.replace(/{data_aniversario}/g, student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '');
            }
            
            const result = await sendWhatsAppMessage({
              phone: student.phone!,
              message,
              config: {
                apiKey: personal.evolutionApiKey,
                instanceName: personal.evolutionInstance,
                server: (personal as any).stevoServer || 'sm15',
              },
            });
            
            // Registrar no log
            await db.createMessageLog({
              personalId: ctx.personal.id,
              studentId: student.id,
              phone: student.phone!,
              message,
              direction: 'outbound',
              status: result.success ? 'sent' : 'failed',
            });
            
            if (result.success) {
              results.sent++;
            } else {
              results.failed++;
              results.errors.push(`${student.name}: ${result.error}`);
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push(`${student.name}: ${error.message}`);
          }
        }
        
        return results;
      }),
    
    // Disparar automação para um aluno específico
    sendToStudent: personalProcedure
      .input(z.object({ 
        automationId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const automation = await db.getAutomationById(input.automationId);
        if (!automation || automation.personalId !== ctx.personal.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Automação não encontrada' });
        }
        
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        if (!student.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno não possui telefone cadastrado' });
        }
        
        const personal = ctx.personal;
        if (!personal.evolutionApiKey || !personal.evolutionInstance) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não configurado. Configure nas Configurações.' });
        }
        
        // Substituir variáveis na mensagem
        let message = automation.messageTemplate
          .replace(/{nome}/g, student.name)
          .replace(/{telefone}/g, student.phone || '')
          .replace(/{email}/g, student.email || '');
        
        const { sendWhatsAppMessage } = await import('./stevo');
        const result = await sendWhatsAppMessage({
          phone: student.phone,
          message,
          config: {
            apiKey: personal.evolutionApiKey,
            instanceName: personal.evolutionInstance,
            server: (personal as any).stevoServer || 'sm15',
          },
        });
        
        // Registrar no log
        await db.createMessageLog({
          personalId: ctx.personal.id,
          studentId: student.id,
          phone: student.phone,
          message,
          direction: 'outbound',
          status: result.success ? 'sent' : 'failed',
        });
        
        if (!result.success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error || 'Erro ao enviar mensagem' });
        }
        
        return { success: true, message: 'Mensagem enviada com sucesso!' };
      }),
  }),

  // ==================== MESSAGE QUEUE ====================
  messages: router({
    queue: personalProcedure.query(async ({ ctx }) => {
      return await db.getMessageQueueByPersonalId(ctx.personal.id);
    }),
    
    log: personalProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getMessageLogByPersonalId(ctx.personal.id, input?.limit);
      }),
    
    send: personalProcedure
      .input(z.object({
        studentId: z.number(),
        message: z.string(),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student || !student.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno não possui telefone cadastrado' });
        }
        
        if (!student.whatsappOptIn) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno optou por não receber mensagens' });
        }
        
        const id = await db.createMessageQueue({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          phone: student.phone,
          message: input.message,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
        });
        
        return { id };
      }),
    
    // Enviar mensagem WhatsApp imediatamente via Stevo
    sendNow: personalProcedure
      .input(z.object({
        studentId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student || !student.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno não possui telefone cadastrado' });
        }
        
        if (!student.whatsappOptIn) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno optou por não receber mensagens' });
        }
        
        // Verificar se o personal tem Stevo configurado
        const personal = ctx.personal;
        if (!personal.evolutionApiKey || !personal.evolutionInstance) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não configurado. Configure nas Configurações.' });
        }
        
        // Importar e enviar via Stevo
        const { sendWhatsAppMessage } = await import('./stevo');
        const result = await sendWhatsAppMessage({
          phone: student.phone,
          message: input.message,
          config: {
            apiKey: personal.evolutionApiKey,
            instanceName: personal.evolutionInstance,
            server: (personal as any).stevoServer || 'sm15',
          },
        });
        
        // Registrar no log
        await db.createMessageLog({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          phone: student.phone,
          message: input.message,
          direction: 'outbound',
          status: result.success ? 'sent' : 'failed',
        });
        
        if (!result.success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error || 'Erro ao enviar mensagem' });
        }
        
        return { success: true, messageId: result.messageId };
      }),
    
    // Enviar lembrete de sessão
    sendSessionReminder: personalProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        
        const student = await db.getStudentById(session.studentId, ctx.personal.id);
        if (!student || !student.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aluno não possui telefone cadastrado' });
        }
        
        const personal = ctx.personal;
        if (!personal.evolutionApiKey || !personal.evolutionInstance) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não configurado' });
        }
        
        const { sendSessionReminder } = await import('./stevo');
        const result = await sendSessionReminder({
          studentName: student.name,
          studentPhone: student.phone,
          sessionDate: new Date(session.scheduledAt),
          sessionTime: new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          personalName: personal.businessName || 'Seu Personal',
          config: {
            apiKey: personal.evolutionApiKey,
            instanceName: personal.evolutionInstance,
            server: (personal as any).stevoServer || 'sm15',
          },
        });
        
        await db.createMessageLog({
          personalId: ctx.personal.id,
          studentId: student.id,
          phone: student.phone,
          message: 'Lembrete de sessão enviado',
          direction: 'outbound',
          status: result.success ? 'sent' : 'failed',
        });
        
        return { success: result.success, error: result.error };
      }),
  }),

  // ==================== STUDENT PORTAL ====================
  studentPortal: router({
    profile: studentProcedure.query(async ({ ctx }) => {
      return ctx.student;
    }),
    
    workouts: studentProcedure.query(async ({ ctx }) => {
      const workouts = await db.getWorkoutsByStudentId(ctx.student.id);
      // Incluir os dias de cada treino
      const workoutsWithDays = await Promise.all(
        workouts.map(async (workout) => {
          const days = await db.getWorkoutDaysByWorkoutId(workout.id);
          return { ...workout, days };
        })
      );
      return workoutsWithDays;
    }),
    
    workout: studentProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.id);
        if (!workout || workout.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Treino não encontrado' });
        }
        
        const days = await db.getWorkoutDaysByWorkoutId(input.id);
        const daysWithExercises = await Promise.all(
          days.map(async (day) => {
            const exercises = await db.getExercisesByWorkoutDayId(day.id);
            return { ...day, exercises };
          })
        );
        
        return { ...workout, days: daysWithExercises };
      }),
    
    anamnesis: studentProcedure.query(async ({ ctx }) => {
      return await db.getAnamnesisByStudentId(ctx.student.id);
    }),
    
    photos: studentProcedure.query(async ({ ctx }) => {
      return await db.getPhotosByStudentId(ctx.student.id);
    }),
    
    measurements: studentProcedure.query(async ({ ctx }) => {
      return await db.getMeasurementsByStudentId(ctx.student.id);
    }),
    
    sessions: studentProcedure.query(async ({ ctx }) => {
      const sessions = await db.getSessionsByStudentId(ctx.student.id);
      
      // Adicionar informações do treino vinculado a cada sessão
      const sessionsWithWorkoutInfo = await Promise.all(
        sessions.map(async (session: any) => {
          if (session.workoutId && session.workoutDayIndex !== null) {
            const workout = await db.getWorkoutById(session.workoutId);
            if (workout) {
              const days = await db.getWorkoutDaysByWorkoutId(session.workoutId);
              const day = days[session.workoutDayIndex];
              if (day) {
                const exercises = await db.getExercisesByWorkoutDayId(day.id);
                return {
                  ...session,
                  workoutInfo: {
                    workoutName: workout.name,
                    dayName: day.name,
                    exercises: exercises.map(ex => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest: ex.restSeconds,
                    })),
                  },
                };
              }
            }
          }
          return session;
        })
      );
      
      return sessionsWithWorkoutInfo;
    }),
    
    charges: studentProcedure.query(async ({ ctx }) => {
      return await db.getChargesByStudentId(ctx.student.id);
    }),
    
    activePackage: studentProcedure.query(async ({ ctx }) => {
      return await db.getActivePackageByStudentId(ctx.student.id);
    }),
    
    // Buscar logs de treino do aluno (com exercícios)
    workoutLogs: studentProcedure.query(async ({ ctx }) => {
      const logs = await db.getWorkoutLogsByStudentId(ctx.student.id);
      // Buscar exercícios para cada log
      const logsWithExercises = await Promise.all(
        logs.map(async (log) => {
          const exerciseLogs = await db.getExerciseLogsByWorkoutLogId(log.id);
          // Buscar séries para cada exercício
          const exercisesWithSets = await Promise.all(
            exerciseLogs.map(async (exLog) => {
              const sets = await db.getSetLogsByExerciseLogId(exLog.id);
              // Deserializar drops e restPauses das notes de cada série
              const setsWithExtras = sets.map((set: any) => {
                if (set.notes && set.notes.includes('[[EXTRAS]]')) {
                  const [notes, extrasJson] = set.notes.split('[[EXTRAS]]');
                  set.notes = notes.trim();
                  try {
                    const extras = JSON.parse(extrasJson);
                    if (extras.drops) {
                      set.drops = extras.drops;
                    }
                    if (extras.restPauses) {
                      set.restPauses = extras.restPauses;
                    }
                  } catch (e) {
                    // Ignorar erros de parse
                  }
                }
                // Garantir que hasDropSet e hasRestPause estejam definidos
                set.hasDropSet = set.isDropSet || (set.drops && set.drops.length > 0);
                set.hasRestPause = set.isRestPause || (set.restPauses && set.restPauses.length > 0);
                return set;
              });
              return { ...exLog, sets: setsWithExtras };
            })
          );
          return { 
            ...log, 
            exerciseLogs: exercisesWithSets,
            isManual: log.workoutId === 0, // Indica se é treino manual
            exerciseCount: exerciseLogs.length,
          };
        })
      );
      return logsWithExercises;
    }),
    
    // Criar registro de treino pelo aluno
    createWorkoutLog: studentProcedure
      .input(z.object({
        workoutId: z.number(),
        workoutDayId: z.number(),
        trainingDate: z.string(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        exercises: z.array(z.object({
          exerciseId: z.number(),
          exerciseName: z.string(),
          set1Weight: z.string().optional(),
          set1Reps: z.number().optional(),
          set1Type: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
          set2Weight: z.string().optional(),
          set2Reps: z.number().optional(),
          set2Type: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
          set3Weight: z.string().optional(),
          set3Reps: z.number().optional(),
          set3Type: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
          set4Weight: z.string().optional(),
          set4Reps: z.number().optional(),
          set4Type: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
          set5Weight: z.string().optional(),
          set5Reps: z.number().optional(),
          set5Type: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
          notes: z.string().optional(),
          completed: z.boolean().optional(),
          // Drop set extras
          dropWeight: z.string().optional(),
          dropReps: z.number().optional(),
          // Rest-pause extras
          restPausePause: z.number().optional(),
          restPauseReps: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { trainingDate, exercises, ...data } = input;
        
        // Buscar o personal do aluno
        const student = ctx.student;
        
        // Criar o log de treino
        const logId = await db.createWorkoutLog({
          ...data,
          personalId: student.personalId,
          studentId: student.id,
          trainingDate: new Date(trainingDate),
          status: 'completed',
        });
        
        // Criar logs de exercícios se fornecidos
        if (exercises && exercises.length > 0) {
          for (let index = 0; index < exercises.length; index++) {
            const ex = exercises[index];
            // Criar o exercício log
            const exerciseLogId = await db.createExerciseLog({
              workoutLogId: logId,
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              notes: ex.notes,
              completed: ex.completed ?? true,
              order: index,
            });
            
            // Criar as séries individuais com seus tipos
            const setsToCreate = [];
            if (ex.set1Weight || ex.set1Reps) {
              setsToCreate.push({
                workoutLogExerciseId: exerciseLogId,
                setNumber: 1,
                setType: ex.set1Type || 'working',
                weight: ex.set1Weight,
                reps: ex.set1Reps,
              });
            }
            if (ex.set2Weight || ex.set2Reps) {
              setsToCreate.push({
                workoutLogExerciseId: exerciseLogId,
                setNumber: 2,
                setType: ex.set2Type || 'working',
                weight: ex.set2Weight,
                reps: ex.set2Reps,
              });
            }
            if (ex.set3Weight || ex.set3Reps) {
              setsToCreate.push({
                workoutLogExerciseId: exerciseLogId,
                setNumber: 3,
                setType: ex.set3Type || 'working',
                weight: ex.set3Weight,
                reps: ex.set3Reps,
              });
            }
            if (ex.set4Weight || ex.set4Reps) {
              setsToCreate.push({
                workoutLogExerciseId: exerciseLogId,
                setNumber: 4,
                setType: ex.set4Type || 'working',
                weight: ex.set4Weight,
                reps: ex.set4Reps,
              });
            }
            if (ex.set5Weight || ex.set5Reps) {
              setsToCreate.push({
                workoutLogExerciseId: exerciseLogId,
                setNumber: 5,
                setType: ex.set5Type || 'working',
                weight: ex.set5Weight,
                reps: ex.set5Reps,
              });
            }
            
            // Criar as séries no banco
            for (const set of setsToCreate) {
              await db.createWorkoutLogSet(set);
            }
          }
        }
        
        // Notificar o personal (owner)
        const { notifyOwner } = await import('./_core/notification');
        const workout = await db.getWorkoutById(input.workoutId);
        await notifyOwner({
          title: `🏋️ Treino Registrado - ${student.name}`,
          content: `O aluno ${student.name} registrou um treino:\n\n📝 Treino: ${workout?.name || 'N/A'}\n📅 Data: ${new Date(trainingDate).toLocaleDateString('pt-BR')}\n⏱️ Duração: ${input.duration || 60} minutos\n\n${input.notes ? `Observações: ${input.notes}` : ''}`,
        });
        
        return { id: logId };
      }),
    
    // Criar registro de treino manual (sem sessão vinculada)
    createManualWorkoutLog: studentProcedure
      .input(z.object({
        trainingDate: z.string(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        feeling: z.string().optional(),
        exercises: z.array(z.object({
          exerciseName: z.string(),
          muscleGroup: z.string().optional(),
          sets: z.array(z.object({
            weight: z.string().optional(),
            reps: z.number().optional(),
            setType: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
            restTime: z.number().optional(),
            isDropSet: z.boolean().optional(),
            dropWeight: z.number().optional(),
            dropReps: z.number().optional(),
            drops: z.array(z.object({
              weight: z.number().optional(),
              reps: z.number().optional(),
              restTime: z.number().optional(),
            })).optional(),
            isRestPause: z.boolean().optional(),
            restPauseWeight: z.number().optional(),
            restPauseReps: z.number().optional(),
            restPausePause: z.number().optional(),
            restPauses: z.array(z.object({
              pauseTime: z.number().optional(),
              weight: z.number().optional(),
              reps: z.number().optional(),
            })).optional(),
            notes: z.string().optional(),
          })),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = ctx.student;
        
        // Criar o log de treino manual (sem workoutId/workoutDayId)
        const logId = await db.createWorkoutLog({
          personalId: student.personalId,
          studentId: student.id,
          workoutId: 0, // 0 indica treino manual
          workoutDayId: 0, // 0 indica treino manual
          trainingDate: new Date(input.trainingDate),
          totalDuration: input.duration || 60,
          notes: input.notes,
          status: 'completed',
        });
        
        // Criar logs de exercícios
        if (input.exercises && input.exercises.length > 0) {
          for (let index = 0; index < input.exercises.length; index++) {
            const ex = input.exercises[index];
            
            // Criar o exercício log
            const exerciseLogId = await db.createWorkoutLogExercise({
              workoutLogId: logId,
              exerciseName: ex.exerciseName,
              notes: ex.notes,
              isCompleted: true,
              orderIndex: index,
            });
            
            // Criar as séries
            for (let setIndex = 0; setIndex < ex.sets.length; setIndex++) {
              const set = ex.sets[setIndex];
              if (set.weight || set.reps) {
                // Serializar drops e restPauses extras no campo notes como JSON
                let notesWithExtras = set.notes || '';
                const extras: { drops?: typeof set.drops; restPauses?: typeof set.restPauses } = {};
                if (set.drops && set.drops.length > 0) {
                  extras.drops = set.drops;
                }
                if (set.restPauses && set.restPauses.length > 0) {
                  extras.restPauses = set.restPauses;
                }
                if (Object.keys(extras).length > 0) {
                  const existingNotes = notesWithExtras.replace(/\n?\[\[EXTRAS\]\][\s\S]*$/, '');
                  notesWithExtras = existingNotes + (existingNotes ? '\n' : '') + '[[EXTRAS]]' + JSON.stringify(extras);
                }
                
                await db.createWorkoutLogSet({
                  workoutLogExerciseId: exerciseLogId,
                  setNumber: setIndex + 1,
                  setType: set.setType || 'working',
                  weight: set.weight,
                  reps: set.reps ? parseInt(String(set.reps)) : 0,
                  restTime: set.restTime,
                  isDropSet: set.isDropSet || (set.drops && set.drops.length > 0),
                  dropWeight: set.dropWeight?.toString() || (set.drops?.[0]?.weight?.toString()),
                  dropReps: set.dropReps || set.drops?.[0]?.reps,
                  isRestPause: set.isRestPause || (set.restPauses && set.restPauses.length > 0),
                  restPauseWeight: set.restPauseWeight?.toString() || (set.restPauses?.[0]?.weight?.toString()),
                  restPauseReps: set.restPauseReps || set.restPauses?.[0]?.reps,
                  restPausePause: set.restPausePause || set.restPauses?.[0]?.pauseTime,
                  notes: notesWithExtras,
                });
              }
            }
          }
        }
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `🏋️ Treino Manual Registrado - ${student.name}`,
          content: `O aluno ${student.name} registrou um treino manual:\n\n📅 Data: ${new Date(input.trainingDate).toLocaleDateString('pt-BR')}\n⏱️ Duração: ${input.duration || 60} minutos\n💪 Exercícios: ${input.exercises.length}\n\n${input.notes ? `Observações: ${input.notes}` : ''}`,
        });
        
        return { id: logId };
      }),
    
    // Atualizar registro de treino manual
    updateWorkoutLog: studentProcedure
      .input(z.object({
        logId: z.number(),
        trainingDate: z.string().optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        feeling: z.string().optional(),
        status: z.enum(['in_progress', 'completed']).optional(),
        exercises: z.array(z.object({
          exerciseName: z.string(),
          sets: z.array(z.object({
            weight: z.string().optional(),
            reps: z.number().optional(),
            setType: z.string().optional(),
            restTime: z.number().optional(),
            isDropSet: z.boolean().optional(),
            dropWeight: z.number().optional(),
            dropReps: z.number().optional(),
            drops: z.array(z.object({
              weight: z.number().optional(),
              reps: z.number().optional(),
              restTime: z.number().optional(),
            })).optional(),
            isRestPause: z.boolean().optional(),
            restPauseWeight: z.number().optional(),
            restPauseReps: z.number().optional(),
            restPausePause: z.number().optional(),
            restPauses: z.array(z.object({
              pauseTime: z.number().optional(),
              weight: z.number().optional(),
              reps: z.number().optional(),
            })).optional(),
            notes: z.string().optional(),
          })),
          notes: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o log pertence ao aluno
        const existingLog = await db.getWorkoutLogById(input.logId);
        if (!existingLog) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registro não encontrado' });
        }
        if (existingLog.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para editar este registro' });
        }
        
        // Atualizar o log
        await db.updateWorkoutLog(input.logId, {
          trainingDate: input.trainingDate ? new Date(input.trainingDate) : undefined,
          totalDuration: input.duration,
          notes: input.notes,
          feeling: input.feeling as 'great' | 'good' | 'normal' | 'tired' | 'exhausted' | undefined,
          status: input.status,
        });
        
        // Se houver exercícios, deletar os antigos e criar novos
        if (input.exercises && input.exercises.length > 0) {
          // Deletar exercícios e séries existentes
          await db.deleteExerciseLogsByWorkoutLogId(input.logId);
          
          // Criar novos exercícios e séries
          for (let index = 0; index < input.exercises.length; index++) {
            const ex = input.exercises[index];
            const exerciseLogId = await db.createWorkoutLogExercise({
              workoutLogId: input.logId,
              exerciseName: ex.exerciseName,
              notes: ex.notes,
              isCompleted: true,
              orderIndex: index,
            });
            
            // Criar as séries com serialização de drops e restPauses
            for (let setIndex = 0; setIndex < ex.sets.length; setIndex++) {
              const set = ex.sets[setIndex];
              if (set.weight || set.reps) {
                // Serializar drops e restPauses extras no campo notes como JSON
                let notesWithExtras = set.notes || '';
                const extras: { drops?: typeof set.drops; restPauses?: typeof set.restPauses } = {};
                if (set.drops && set.drops.length > 0) {
                  extras.drops = set.drops;
                }
                if (set.restPauses && set.restPauses.length > 0) {
                  extras.restPauses = set.restPauses;
                }
                if (Object.keys(extras).length > 0) {
                  const existingNotes = notesWithExtras.replace(/\n?\[\[EXTRAS\]\][\s\S]*$/, '');
                  notesWithExtras = existingNotes + (existingNotes ? '\n' : '') + '[[EXTRAS]]' + JSON.stringify(extras);
                }
                
                const validSetType = ['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure'].includes(set.setType || '') 
                  ? (set.setType as 'warmup' | 'feeler' | 'working' | 'drop' | 'rest_pause' | 'failure') 
                  : 'working';
                
                await db.createWorkoutLogSet({
                  workoutLogExerciseId: exerciseLogId,
                  setNumber: setIndex + 1,
                  setType: validSetType,
                  weight: set.weight,
                  reps: set.reps ? parseInt(String(set.reps)) : 0,
                  restTime: set.restTime,
                  isDropSet: set.isDropSet || (set.drops && set.drops.length > 0),
                  dropWeight: set.dropWeight?.toString() || (set.drops?.[0]?.weight?.toString()),
                  dropReps: set.dropReps || set.drops?.[0]?.reps,
                  isRestPause: set.isRestPause || (set.restPauses && set.restPauses.length > 0),
                  restPauseWeight: set.restPauseWeight?.toString() || (set.restPauses?.[0]?.weight?.toString()),
                  restPauseReps: set.restPauseReps || set.restPauses?.[0]?.reps,
                  restPausePause: set.restPausePause || set.restPauses?.[0]?.pauseTime,
                  notes: notesWithExtras,
                });
              }
            }
          }
        }
        
        return { success: true };
      }),
    
    // Solicitar alteração de dados (cria pending change)
    requestChange: studentProcedure
      .input(z.object({
        entityType: z.enum(['student', 'anamnesis', 'measurement']),
        entityId: z.number(),
        fieldName: z.string(),
        oldValue: z.string().optional(),
        newValue: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createPendingChange({
          personalId: ctx.student.personalId,
          studentId: ctx.student.id,
          entityType: input.entityType,
          entityId: input.entityId,
          fieldName: input.fieldName,
          oldValue: input.oldValue,
          newValue: input.newValue,
          requestedBy: 'student',
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `📝 Solicitação de Alteração - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} solicitou uma alteração:\n\n📋 Campo: ${input.fieldName}\n📤 Valor atual: ${input.oldValue || 'N/A'}\n📥 Novo valor: ${input.newValue}\n\nAcesse o sistema para aprovar ou rejeitar.`,
        });
        
        return { id };
      }),
    
    // Listar alterações pendentes do aluno
    myPendingChanges: studentProcedure.query(async ({ ctx }) => {
      return await db.getPendingChangesByStudentId(ctx.student.id);
    }),
    
    // Confirmar presença em sessão
    confirmSession: studentProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        if (session.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para esta sessão' });
        }
        if (session.status !== 'scheduled') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta sessão não pode ser confirmada' });
        }
        
        // Verificar se está dentro do prazo (até 48h antes)
        const sessionDate = new Date(session.scheduledAt);
        const now = new Date();
        const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil > 48) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Confirmação disponível apenas 48h antes da sessão' });
        }
        if (hoursUntil <= 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sessão já passou' });
        }
        
        await db.updateSession(input.sessionId, { status: 'confirmed' });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `✅ Presença Confirmada - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} confirmou presença na sessão:\n\n📅 Data: ${sessionDate.toLocaleDateString('pt-BR')}\n⏰ Horário: ${sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        });
        
        // Enviar email de confirmação ao aluno
        if (ctx.student.email) {
          const { sendSessionConfirmationEmail } = await import('./email');
          await sendSessionConfirmationEmail(
            ctx.student.email,
            ctx.student.name,
            sessionDate,
            'confirmed'
          );
        }
        
        return { success: true };
      }),
    
    // Cancelar sessão
    cancelSession: studentProcedure
      .input(z.object({
        sessionId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        if (session.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para esta sessão' });
        }
        if (session.status !== 'scheduled' && session.status !== 'confirmed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta sessão não pode ser cancelada' });
        }
        
        // Verificar se está com antecedência mínima (24h)
        const sessionDate = new Date(session.scheduledAt);
        const now = new Date();
        const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil <= 24) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cancelamento deve ser feito com pelo menos 24h de antecedência' });
        }
        
        const notes = input.reason ? `Cancelado pelo aluno: ${input.reason}` : 'Cancelado pelo aluno';
        await db.updateSession(input.sessionId, { 
          status: 'cancelled',
          notes: session.notes ? `${session.notes}\n${notes}` : notes,
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `❌ Sessão Cancelada - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} cancelou uma sessão:\n\n📅 Data: ${sessionDate.toLocaleDateString('pt-BR')}\n⏰ Horário: ${sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n📝 Motivo: ${input.reason || 'Não informado'}`,
        });
        
        // Enviar email de cancelamento ao aluno
        if (ctx.student.email) {
          const { sendSessionConfirmationEmail } = await import('./email');
          await sendSessionConfirmationEmail(
            ctx.student.email,
            ctx.student.name,
            sessionDate,
            'cancelled'
          );
        }
        
        return { success: true };
      }),
    
    // Verificar permissões de edição do aluno
    editPermissions: studentProcedure.query(async ({ ctx }) => {
      return {
        canEditAnamnesis: ctx.student.canEditAnamnesis ?? true,
        canEditMeasurements: ctx.student.canEditMeasurements ?? true,
        canEditPhotos: ctx.student.canEditPhotos ?? true,
        canViewCharges: ctx.student.canViewCharges ?? true,
        canScheduleSessions: ctx.student.canScheduleSessions ?? true,
        canCancelSessions: ctx.student.canCancelSessions ?? true,
        canSendMessages: ctx.student.canSendMessages ?? true,
        canViewWorkouts: ctx.student.canViewWorkouts ?? true,
      };
    }),
    
    // Adicionar nova medida pelo aluno
    addMeasurement: studentProcedure
      .input(z.object({
        measureDate: z.string(),
        weight: z.string().optional(),
        height: z.string().optional(),
        bodyFat: z.string().optional(),
        muscleMass: z.string().optional(),
        neck: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hip: z.string().optional(),
        rightArm: z.string().optional(),
        leftArm: z.string().optional(),
        rightThigh: z.string().optional(),
        leftThigh: z.string().optional(),
        rightCalf: z.string().optional(),
        leftCalf: z.string().optional(),
        notes: z.string().optional(),
        // Bioimpedância
        bioBodyFat: z.string().optional(),
        bioMuscleMass: z.string().optional(),
        bioFatMass: z.string().optional(),
        bioVisceralFat: z.string().optional(),
        bioBasalMetabolism: z.string().optional(),
        // Adipômetro
        adipBodyFat: z.string().optional(),
        adipMuscleMass: z.string().optional(),
        adipFatMass: z.string().optional(),
        // Dobras cutâneas
        tricepsFold: z.string().optional(),
        subscapularFold: z.string().optional(),
        suprailiacFold: z.string().optional(),
        abdominalFold: z.string().optional(),
        thighFold: z.string().optional(),
        chestFold: z.string().optional(),
        axillaryFold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar permissão
        if (!ctx.student.canEditMeasurements) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para adicionar medidas. Solicite ao seu personal.' });
        }
        
        const { measureDate, ...measurements } = input;
        
        // Verificar se já existe uma medida na mesma data para evitar duplicação
        const existingMeasurements = await db.getMeasurementsByStudentId(ctx.student.id);
        const measureDateObj = new Date(measureDate + 'T12:00:00');
        const existingOnSameDate = existingMeasurements.find(m => {
          const existingDate = new Date(m.measureDate);
          return existingDate.toDateString() === measureDateObj.toDateString();
        });
        
        if (existingOnSameDate) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'Já existe uma medida registrada nesta data. Edite a medida existente ou escolha outra data.' 
          });
        }
        
        // Calcular IMC se tiver peso e altura
        let bmi: string | undefined;
        if (measurements.weight && measurements.height) {
          const w = parseFloat(measurements.weight);
          const h = parseFloat(measurements.height) / 100;
          if (w > 0 && h > 0) {
            bmi = (w / (h * h)).toFixed(1);
          }
        }
        
        const id = await db.createMeasurement({
          studentId: ctx.student.id,
          personalId: ctx.student.personalId,
          measureDate: new Date(measureDate + 'T12:00:00'),
          ...measurements,
          bmi,
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `📏 Nova Medida Registrada - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} registrou novas medidas:

📅 Data: ${new Date(measureDate).toLocaleDateString('pt-BR')}${measurements.weight ? `\n⚖️ Peso: ${measurements.weight} kg` : ''}${measurements.bodyFat ? `\n📉 Gordura: ${measurements.bodyFat}%` : ''}${measurements.waist ? `\n📏 Cintura: ${measurements.waist} cm` : ''}\n\nAcesse o sistema para ver os detalhes.`,
        });
        
        return { id };
      }),
    
    // Atualizar medida existente pelo aluno
    updateMeasurement: studentProcedure
      .input(z.object({
        id: z.number(),
        measureDate: z.string().optional(),
        weight: z.string().optional(),
        height: z.string().optional(),
        bodyFat: z.string().optional(),
        muscleMass: z.string().optional(),
        neck: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hip: z.string().optional(),
        rightArm: z.string().optional(),
        leftArm: z.string().optional(),
        rightThigh: z.string().optional(),
        leftThigh: z.string().optional(),
        rightCalf: z.string().optional(),
        leftCalf: z.string().optional(),
        notes: z.string().optional(),
        // Bioimpedância
        bioBodyFat: z.string().optional(),
        bioMuscleMass: z.string().optional(),
        bioFatMass: z.string().optional(),
        bioVisceralFat: z.string().optional(),
        bioBasalMetabolism: z.string().optional(),
        // Adipômetro
        adipBodyFat: z.string().optional(),
        adipMuscleMass: z.string().optional(),
        adipFatMass: z.string().optional(),
        // Dobras cutâneas
        tricepsFold: z.string().optional(),
        subscapularFold: z.string().optional(),
        suprailiacFold: z.string().optional(),
        abdominalFold: z.string().optional(),
        thighFold: z.string().optional(),
        chestFold: z.string().optional(),
        axillaryFold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar permissão
        if (!ctx.student.canEditMeasurements) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para editar medidas. Solicite ao seu personal.' });
        }
        
        const { id, measureDate, ...measurements } = input;
        
        // Verificar se a medida pertence ao aluno
        const existingMeasurement = await db.getMeasurementById(id);
        if (!existingMeasurement || existingMeasurement.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Medida não encontrada' });
        }
        
        // Calcular IMC se tiver peso e altura
        let bmi: string | undefined;
        const weight = measurements.weight || existingMeasurement.weight;
        const height = measurements.height || existingMeasurement.height;
        if (weight && height) {
          const w = parseFloat(weight);
          const h = parseFloat(height) / 100;
          if (w > 0 && h > 0) {
            bmi = (w / (h * h)).toFixed(1);
          }
        }
        
        await db.updateMeasurement(id, {
          ...measurements,
          measureDate: measureDate ? new Date(measureDate + 'T12:00:00') : undefined,
          bmi,
        } as any);
        
        return { success: true };
      }),
    
    // Atualizar anamnese pelo aluno
    updateAnamnesis: studentProcedure
      .input(z.object({
        occupation: z.string().optional(),
        sleepHours: z.number().optional(),
        stressLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
        medicalHistory: z.string().optional(),
        medications: z.string().optional(),
        injuries: z.string().optional(),
        allergies: z.string().optional(),
        mainGoal: z.enum(['weight_loss', 'muscle_gain', 'conditioning', 'health', 'rehabilitation', 'sports', 'other']).optional(),
        secondaryGoals: z.string().optional(),
        targetWeight: z.string().optional(),
        observations: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar permissão
        if (!ctx.student.canEditAnamnesis) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para editar a anamnese. Solicite ao seu personal.' });
        }
        
        // Verificar se já existe anamnese
        const existing = await db.getAnamnesisByStudentId(ctx.student.id);
        
        if (existing) {
          // Atualizar anamnese existente
          await db.updateAnamnesis(existing.id, input as any);
        } else {
          // Criar nova anamnese
          await db.createAnamnesis({
            studentId: ctx.student.id,
            personalId: ctx.student.personalId,
            ...input,
          } as any);
        }
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `📋 Anamnese Atualizada - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} atualizou sua anamnese.\n\nAcesse o sistema para ver os detalhes.`,
        });
        
        return { success: true };
      }),
    
    // Chat com o personal
    chatMessages: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const messages = await db.getChatMessages(ctx.student.personalId, ctx.student.id, input.limit || 50);
        // Marcar mensagens do personal como lidas
        await db.markChatMessagesAsRead(ctx.student.personalId, ctx.student.id, 'student');
        return messages.reverse(); // Retornar em ordem cronológica
      }),
    
    sendChatMessage: studentProcedure
      .input(z.object({ 
        message: z.string().optional(),
        messageType: z.enum(['text', 'audio', 'image', 'video', 'file', 'link']).default('text'),
        mediaUrl: z.string().optional(),
        mediaName: z.string().optional(),
        mediaMimeType: z.string().optional(),
        mediaSize: z.number().optional(),
        mediaDuration: z.number().optional(),
        audioTranscription: z.string().optional(),
        linkPreviewUrl: z.string().optional(),
        linkPreviewTitle: z.string().optional(),
        linkPreviewDescription: z.string().optional(),
        linkPreviewImage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar que tem mensagem ou mídia
        if (!input.message && !input.mediaUrl) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mensagem ou mídia é obrigatória' });
        }
        
        const messageId = await db.createChatMessage({
          personalId: ctx.student.personalId,
          studentId: ctx.student.id,
          senderType: 'student',
          message: input.message || null,
          messageType: input.messageType,
          mediaUrl: input.mediaUrl,
          mediaName: input.mediaName,
          mediaMimeType: input.mediaMimeType,
          mediaSize: input.mediaSize,
          mediaDuration: input.mediaDuration,
          audioTranscription: input.audioTranscription,
          linkPreviewUrl: input.linkPreviewUrl,
          linkPreviewTitle: input.linkPreviewTitle,
          linkPreviewDescription: input.linkPreviewDescription,
          linkPreviewImage: input.linkPreviewImage,
        });
        
        // Verificar se a IA está habilitada para chat interno
        let aiResponse = null;
        try {
          const aiAssistant = await import('./aiAssistant');
          const aiConfig = await aiAssistant.default.getAiConfig(ctx.student.personalId);
          
          if (aiConfig && aiConfig.isEnabled && (aiConfig as any).enabledForInternalChat && input.messageType === 'text' && input.message) {
            // Verificar horário de atendimento
            const now = new Date();
            const currentHour = now.getHours();
            const isWeekend = now.getDay() === 0 || now.getDay() === 6;
            
            const isWithinWorkingHours = 
              currentHour >= (aiConfig.autoReplyStartHour || 8) && 
              currentHour < (aiConfig.autoReplyEndHour || 22) &&
              (aiConfig.autoReplyWeekends || !isWeekend);
            
            if (isWithinWorkingHours && aiConfig.autoReplyEnabled) {
              // Processar mensagem com IA
              const response = await aiAssistant.default.processMessage({
                personalId: ctx.student.personalId,
                phone: ctx.student.phone || '',
                message: input.message,
                messageType: 'text',
              });
              
              if (response.message && !response.shouldEscalate) {
                // Salvar resposta da IA como mensagem do personal
                await db.createChatMessage({
                  personalId: ctx.student.personalId,
                  studentId: ctx.student.id,
                  senderType: 'personal',
                  message: response.message,
                  messageType: 'text',
                  source: 'internal',
                });
                aiResponse = response.message;
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar IA no chat interno:', error);
        }
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        const notificationContent = input.messageType === 'text' 
          ? (input.message?.substring(0, 200) || '') + ((input.message?.length || 0) > 200 ? '...' : '')
          : input.messageType === 'audio' ? '🎤 Mensagem de áudio'
          : input.messageType === 'image' ? '🖼️ Foto enviada'
          : input.messageType === 'video' ? '🎥 Vídeo enviado'
          : input.messageType === 'file' ? `📄 Arquivo: ${input.mediaName || 'arquivo'}`
          : input.messageType === 'link' ? `🔗 Link: ${input.linkPreviewTitle || input.linkPreviewUrl || 'link'}`
          : 'Nova mensagem';
        
        await notifyOwner({
          title: `💬 Nova mensagem de ${ctx.student.name}`,
          content: notificationContent,
        });
        
        return { success: true, messageId, aiResponse };
      }),
    
    // Editar mensagem
    editChatMessage: studentProcedure
      .input(z.object({ messageId: z.number(), newMessage: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await db.editChatMessage(input.messageId, ctx.student.personalId, 'student', input.newMessage, ctx.student.id);
        return { success: true };
      }),
    
    // Excluir mensagem para mim
    deleteChatMessageForMe: studentProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatMessageForSender(input.messageId, ctx.student.personalId, 'student', ctx.student.id);
        return { success: true };
      }),
    
    // Excluir mensagem para todos
    deleteChatMessageForAll: studentProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatMessageForAll(input.messageId, ctx.student.personalId, 'student', ctx.student.id);
        return { success: true };
      }),
    
    // Transcrever áudio para texto (portal do aluno)
    transcribeAudio: studentProcedure
      .input(z.object({
        messageId: z.number(),
        audioUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { transcribeAudio } = await import('./_core/voiceTranscription');
        
        // Chamar serviço de transcrição
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: 'pt', // Português como padrão
        });
        
        // Verificar se houve erro
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
            cause: result,
          });
        }
        
        // Atualizar a mensagem com a transcrição
        await db.updateChatMessageTranscription(input.messageId, result.text);
        
        return {
          success: true,
          text: result.text,
          language: result.language,
          duration: result.duration,
        };
      }),
    
    // Upload de mídia para o chat
    uploadChatMedia: studentProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        duration: z.number().optional(), // Para áudio/vídeo
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        
        // Validar tamanho (16MB máximo)
        if (input.fileSize > 16 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Arquivo muito grande. Máximo 16MB.' });
        }
        
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const fileKey = `chat/${ctx.student.personalId}/${ctx.student.id}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { 
          url, 
          fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          duration: input.duration,
        };
      }),
    
    unreadChatCount: studentProcedure.query(async ({ ctx }) => {
      return await db.getUnreadChatCount(ctx.student.personalId, ctx.student.id, 'student');
    }),
    
    // Badges/Conquistas
    badges: studentProcedure.query(async ({ ctx }) => {
      // Verificar e conceder novos badges
      await db.checkAndAwardBadges(ctx.student.id, ctx.student.personalId);
      // Retornar todos os badges
      const badges = await db.getStudentBadges(ctx.student.id);
      return badges.map(badge => ({
        ...badge,
        info: db.BADGE_INFO[badge.badgeType] || { name: badge.badgeType, description: '', icon: '🏅', color: 'gray' }
      }));
    }),
    
    badgeInfo: studentProcedure.query(async () => {
      return db.BADGE_INFO;
    }),
    
    // Sessões que precisam de feedback
    sessionsNeedingFeedback: studentProcedure.query(async ({ ctx }) => {
      return await db.getSessionsNeedingFeedback(ctx.student.id);
    }),
    
    // Enviar feedback de sessão
    submitFeedback: studentProcedure
      .input(z.object({
        sessionId: z.number(),
        energyLevel: z.number().min(1).max(5).optional(),
        painLevel: z.number().min(1).max(5).optional(),
        satisfactionLevel: z.number().min(1).max(5).optional(),
        difficultyLevel: z.number().min(1).max(5).optional(),
        mood: z.enum(['great', 'good', 'neutral', 'tired', 'exhausted']).optional(),
        highlights: z.string().optional(),
        improvements: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se a sessão pertence ao aluno
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        
        if (session.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Só é possível dar feedback em sessões realizadas' });
        }
        
        const { sessionId, ...feedbackData } = input;
        const feedbackId = await db.createSessionFeedback({
          sessionId,
          studentId: ctx.student.id,
          personalId: ctx.student.personalId,
          ...feedbackData,
        });
        
        // Notificar o personal se houver feedback negativo
        if (input.satisfactionLevel && input.satisfactionLevel <= 2) {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `⚠️ Feedback de ${ctx.student.name}`,
            content: `O aluno ${ctx.student.name} deu um feedback com baixa satisfação (${input.satisfactionLevel}/5).\n\n${input.improvements ? `Sugestões: ${input.improvements}` : ''}`,
          });
        }
        
        return { success: true, feedbackId };
      }),
    
    // Histórico de feedbacks
    feedbackHistory: studentProcedure.query(async ({ ctx }) => {
      return await db.getStudentFeedbacks(ctx.student.id);
    }),
    
    // Sugerir horários disponíveis para reagendamento
    suggestReschedule: studentProcedure
      .input(z.object({
        sessionId: z.number(),
        preferredDays: z.array(z.number()).optional(), // 0-6, domingo-sábado
      }))
      .query(async ({ ctx, input }) => {
        // Buscar sessão original
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        
        // Buscar sessões existentes do personal nos próximos 14 dias
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        const existingSessions = await db.getSessionsByPersonalIdAndDateRange(
          ctx.student.personalId,
          now,
          twoWeeksLater
        );
        
        // Gerar slots disponíveis (8h-20h, a cada hora)
        const availableSlots: { date: Date; dayOfWeek: string; time: string }[] = [];
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        for (let day = 1; day <= 14; day++) {
          const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
          const dayOfWeek = date.getDay();
          
          // Filtrar por dias preferidos se informado
          if (input.preferredDays && input.preferredDays.length > 0) {
            if (!input.preferredDays.includes(dayOfWeek)) continue;
          }
          
          // Gerar slots de 6h às 21h
          for (let hour = 6; hour <= 21; hour++) {
            const slotDate = new Date(date);
            slotDate.setHours(hour, 0, 0, 0);
            
            // Verificar se o slot está ocupado
            const isOccupied = existingSessions.some((s: any) => {
              const sessionDate = new Date(s.scheduledAt);
              return Math.abs(sessionDate.getTime() - slotDate.getTime()) < 60 * 60 * 1000; // Dentro de 1 hora
            });
            
            if (!isOccupied) {
              availableSlots.push({
                date: slotDate,
                dayOfWeek: daysOfWeek[dayOfWeek],
                time: `${hour.toString().padStart(2, '0')}:00`,
              });
            }
          }
        }
        
        // Retornar os primeiros 20 slots disponíveis
        return availableSlots.slice(0, 20);
      }),
    
    // Solicitar reagendamento
    requestReschedule: studentProcedure
      .input(z.object({
        sessionId: z.number(),
        newDate: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar sessão original
        const session = await db.getSessionById(input.sessionId);
        if (!session || session.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }
        
        if (session.status !== 'scheduled' && session.status !== 'confirmed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta sessão não pode ser reagendada' });
        }
        
        const newDate = new Date(input.newDate);
        const oldDate = new Date(session.scheduledAt);
        
        // Atualizar sessão
        const notes = `Reagendado pelo aluno de ${oldDate.toLocaleDateString('pt-BR')} ${oldDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} para ${newDate.toLocaleDateString('pt-BR')} ${newDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${input.reason ? `. Motivo: ${input.reason}` : ''}`;
        
        await db.updateSession(input.sessionId, {
          scheduledAt: newDate,
          status: 'scheduled', // Volta para agendada
          notes: session.notes ? `${session.notes}\n${notes}` : notes,
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `📅 Reagendamento - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} reagendou uma sessão:\n\n📅 Data anterior: ${oldDate.toLocaleDateString('pt-BR')} às ${oldDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n📅 Nova data: ${newDate.toLocaleDateString('pt-BR')} às ${newDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n📝 Motivo: ${input.reason || 'Não informado'}`,
        });
        
        return { success: true };
      }),
    
    // Criar sugestão de alteração no treino
    createWorkoutSuggestion: studentProcedure
      .input(z.object({
        workoutId: z.number(),
        exerciseId: z.number().optional(),
        suggestionType: z.enum(['weight_change', 'reps_change', 'exercise_change', 'add_exercise', 'remove_exercise', 'note', 'other']),
        currentValue: z.string().optional(),
        suggestedValue: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o treino pertence ao aluno
        const workout = await db.getWorkoutById(input.workoutId);
        if (!workout || workout.studentId !== ctx.student.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Treino não encontrado' });
        }
        
        // Criar a sugestão como pending change
        const id = await db.createPendingChange({
          personalId: ctx.student.personalId,
          studentId: ctx.student.id,
          entityType: 'workout',
          entityId: input.workoutId,
          fieldName: `${input.suggestionType}${input.exerciseId ? `_exercise_${input.exerciseId}` : ''}`,
          oldValue: input.currentValue,
          newValue: input.suggestedValue,
          requestedBy: 'student',
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        const suggestionTypeLabels: Record<string, string> = {
          weight_change: 'Alteração de Carga',
          reps_change: 'Alteração de Repetições',
          exercise_change: 'Alteração de Exercício',
          add_exercise: 'Adicionar Exercício',
          remove_exercise: 'Remover Exercício',
          note: 'Observação',
          other: 'Outra Sugestão',
        };
        
        await notifyOwner({
          title: `💡 Sugestão de Treino - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} sugeriu uma alteração no treino:

🏋️ Treino: ${workout.name}
📝 Tipo: ${suggestionTypeLabels[input.suggestionType] || input.suggestionType}${input.currentValue ? `\n📤 Valor atual: ${input.currentValue}` : ''}
📥 Sugestão: ${input.suggestedValue}${input.reason ? `\n💬 Motivo: ${input.reason}` : ''}

Acesse Alterações Pendentes para aprovar ou rejeitar.`,
        });
        
        return { id };
      }),
    
    // Listar sugestões do aluno
    mySuggestions: studentProcedure.query(async ({ ctx }) => {
      const changes = await db.getPendingChangesByStudentId(ctx.student.id);
      // Filtrar apenas sugestões de treino
      return changes.filter(c => c.entityType === 'workout');
    }),
    
    // Salvar anamnese com medidas (para onboarding do aluno)
    saveWithMeasurements: studentProcedure
      .input(z.object({
        occupation: z.string().optional(),
        lifestyle: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        stressLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
        medicalHistory: z.string().optional(),
        injuries: z.string().optional(),
        surgeries: z.string().optional(),
        medications: z.string().optional(),
        allergies: z.string().optional(),
        mainGoal: z.enum(['weight_loss', 'muscle_gain', 'conditioning', 'health', 'rehabilitation', 'sports', 'other']).optional(),
        secondaryGoals: z.string().optional(),
        targetWeight: z.string().optional(),
        motivation: z.string().optional(),
        mealsPerDay: z.number().optional(),
        waterIntake: z.string().optional(),
        dietRestrictions: z.string().optional(),
        supplements: z.string().optional(),
        dailyCalories: z.number().optional(),
        doesCardio: z.boolean().optional(),
        cardioActivities: z.string().optional(),
        exerciseExperience: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional(),
        previousActivities: z.string().optional(),
        availableDays: z.string().optional(),
        preferredTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
        weeklyFrequency: z.number().optional(),
        sessionDuration: z.number().optional(),
        trainingLocation: z.enum(['full_gym', 'home_gym', 'home_basic', 'outdoor', 'studio']).optional(),
        availableEquipment: z.string().optional(),
        trainingRestrictions: z.string().optional(),
        restrictionNotes: z.string().optional(),
        muscleEmphasis: z.string().optional(),
        observations: z.string().optional(),
        measurements: z.object({
          weight: z.string().optional(),
          height: z.string().optional(),
          bodyFat: z.string().optional(),
          muscleMass: z.string().optional(),
          neck: z.string().optional(),
          chest: z.string().optional(),
          waist: z.string().optional(),
          hip: z.string().optional(),
          rightArm: z.string().optional(),
          leftArm: z.string().optional(),
          rightThigh: z.string().optional(),
          leftThigh: z.string().optional(),
          rightCalf: z.string().optional(),
          leftCalf: z.string().optional(),
          notes: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { measurements, ...anamnesisData } = input;
        const existing = await db.getAnamnesisByStudentId(ctx.student.id);
        
        let anamnesisId: number;
        let updated = false;
        
        if (existing) {
          await db.updateAnamnesis(existing.id, anamnesisData as any);
          anamnesisId = existing.id;
          updated = true;
        } else {
          anamnesisId = await db.createAnamnesis({
            ...anamnesisData,
            studentId: ctx.student.id,
            personalId: ctx.student.personalId,
          } as any);
        }
        
        // Criar registro de medidas se houver dados
        if (measurements && Object.values(measurements).some(v => v)) {
          const hasMeasurementData = measurements.weight || measurements.height || 
            measurements.bodyFat || measurements.chest || measurements.waist || 
            measurements.hip || measurements.neck;
          
          if (hasMeasurementData) {
            // Calcular IMC se tiver peso e altura
            let bmi: string | undefined;
            if (measurements.weight && measurements.height) {
              const w = parseFloat(measurements.weight);
              const h = parseFloat(measurements.height) / 100;
              if (w > 0 && h > 0) {
                bmi = (w / (h * h)).toFixed(1);
              }
            }
            
            await db.createMeasurement({
              studentId: ctx.student.id,
              personalId: ctx.student.personalId,
              measureDate: new Date(),
              ...measurements,
              bmi,
            });
          }
        }
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `📋 ${updated ? 'Anamnese Atualizada' : 'Onboarding Completo'} - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} ${updated ? 'atualizou sua anamnese' : 'completou o onboarding inicial'}.\n\nAcesse o sistema para ver os detalhes.`,
        });
        
        return { success: true, anamnesisId, updated };
      }),
    
    // Dashboard de treinos do aluno
    dashboard: studentProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getStudentTrainingDashboard(ctx.student.id, input);
      }),
    
    // Análise por grupo muscular do aluno
    muscleGroupAnalysis: studentProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getStudentMuscleGroupAnalysis(ctx.student.id, input);
      }),
    
    // Evolução de carga por exercício do aluno
    exerciseProgress: studentProcedure
      .input(z.object({
        exerciseName: z.string(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getStudentExerciseProgress(ctx.student.id, input.exerciseName, input.limit);
      }),
    
    // Listar exercícios únicos do aluno
    uniqueExercises: studentProcedure
      .query(async ({ ctx }) => {
        const db = await import('./db');
        return await db.getStudentUniqueExercises(ctx.student.id);
      }),
    
    // ==================== ANÁLISE COMPLETA POR IA ====================
    
    // Análise completa do aluno (cruza todos os dados)
    aiCompleteAnalysis: studentProcedure
      .input(z.object({
        includePhotos: z.boolean().optional().default(true),
        includeMeasurements: z.boolean().optional().default(true),
        includeAnamnesis: z.boolean().optional().default(true),
        includeWorkoutLogs: z.boolean().optional().default(true),
        includeBioimpedance: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Coletar todos os dados do aluno
        const [anamnesis, measurements, photos, workoutLogs] = await Promise.all([
          input.includeAnamnesis ? db.getAnamnesisByStudentId(ctx.student.id) : null,
          input.includeMeasurements ? db.getMeasurementsByStudentId(ctx.student.id) : [],
          input.includePhotos ? db.getPhotosByStudentId(ctx.student.id) : [],
          input.includeWorkoutLogs ? db.getWorkoutLogsByStudentId(ctx.student.id) : [],
        ]);
        
        // Preparar dados para análise
        const analysisData: any = {
          student: {
            name: ctx.student.name,
            birthDate: ctx.student.birthDate,
            gender: ctx.student.gender,
          },
        };
        
        if (anamnesis) {
          analysisData.anamnesis = {
            mainGoal: anamnesis.mainGoal,
            secondaryGoals: anamnesis.secondaryGoals,
            medicalHistory: anamnesis.medicalHistory,
            injuries: anamnesis.injuries,
            medications: anamnesis.medications,
            exerciseExperience: anamnesis.exerciseExperience,
            weeklyFrequency: anamnesis.weeklyFrequency,
            trainingLocation: anamnesis.trainingLocation,
            availableEquipment: anamnesis.availableEquipment,
            trainingRestrictions: anamnesis.trainingRestrictions,
            muscleEmphasis: anamnesis.muscleEmphasis,
          };
        }
        
        if (measurements.length > 0) {
          // Ordenar por data e pegar as últimas 3
          const sortedMeasurements = [...measurements].sort((a, b) => 
            new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
          ).slice(0, 3);
          
          analysisData.measurements = sortedMeasurements.map(m => ({
            date: m.measureDate,
            weight: m.weight,
            bodyFat: m.bodyFat,
            muscleMass: m.muscleMass,
            waist: m.waist,
            chest: m.chest,
            hip: m.hip,
            bioBodyFat: m.bioBodyFat,
            bioMuscleMass: m.bioMuscleMass,
            bioFatMass: m.bioFatMass,
            bioVisceralFat: m.bioVisceralFat,
          }));
          
          // Calcular evolução
          if (sortedMeasurements.length >= 2) {
            const latest = sortedMeasurements[0];
            const oldest = sortedMeasurements[sortedMeasurements.length - 1];
            analysisData.evolution = {
              weightChange: latest.weight && oldest.weight ? 
                (parseFloat(latest.weight) - parseFloat(oldest.weight)).toFixed(1) : null,
              bodyFatChange: latest.bodyFat && oldest.bodyFat ?
                (parseFloat(latest.bodyFat) - parseFloat(oldest.bodyFat)).toFixed(1) : null,
              waistChange: latest.waist && oldest.waist ?
                (parseFloat(latest.waist) - parseFloat(oldest.waist)).toFixed(1) : null,
              periodDays: Math.round((new Date(latest.measureDate).getTime() - new Date(oldest.measureDate).getTime()) / (1000 * 60 * 60 * 24)),
            };
          }
        }
        
        if (workoutLogs.length > 0) {
          // Agrupar por mês e calcular estatísticas
          const last30Days = workoutLogs.filter(log => {
            const logDate = new Date(log.trainingDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return logDate >= thirtyDaysAgo;
          });
          
          analysisData.workoutStats = {
            totalWorkoutsLast30Days: last30Days.length,
            totalWorkoutsAllTime: workoutLogs.length,
            averageWorkoutsPerWeek: (last30Days.length / 4.3).toFixed(1),
            lastWorkoutDate: workoutLogs[0]?.trainingDate,
          };
        }
        
        // Preparar conteúdo para a IA (incluindo fotos se houver)
        const content: any[] = [
          {
            type: 'text',
            text: `Analise os dados deste aluno e forneça uma análise completa:

${JSON.stringify(analysisData, null, 2)}

Forneça:
1. RESUMO GERAL: Visão geral do aluno e seu progresso
2. PONTOS FORTES: O que está funcionando bem
3. DÉFICITS IDENTIFICADOS: Áreas que precisam de atenção (grupos musculares, frequência, etc)
4. RECOMENDAÇÕES: Sugestões específicas para o próximo treino
5. METAS SUGERIDAS: Metas realistas para os próximos 30 dias

Responda em português de forma profissional e motivadora.`
          }
        ];
        
        // Adicionar fotos para análise visual se houver
        if (photos.length > 0) {
          // Pegar as 2 fotos mais recentes para comparação
          const recentPhotos = [...photos].sort((a, b) => 
            new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime()
          ).slice(0, 2);
          
          for (const photo of recentPhotos) {
            content.push({
              type: 'image_url',
              image_url: {
                url: photo.url,
                detail: 'high'
              }
            });
          }
          
          content[0].text += '\n\nTambém analise as fotos anexadas para avaliar a progressão visual do aluno.';
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Você é um personal trainer experiente e especialista em avaliação física. Analise os dados do aluno de forma profissional, identificando pontos fortes, déficits e oportunidades de melhoria. Seja motivador mas realista.'
            },
            {
              role: 'user',
              content: content
            }
          ]
        });
        
        const analysis = response.choices?.[0]?.message?.content || 'Não foi possível gerar a análise.';
        
        return {
          analysis,
          dataUsed: {
            hasAnamnesis: !!anamnesis,
            measurementsCount: measurements.length,
            photosCount: photos.length,
            workoutLogsCount: workoutLogs.length,
          },
          generatedAt: new Date().toISOString(),
        };
      }),
    
    // Análise de fotos de evolução (antes/depois)
    aiPhotoAnalysis: studentProcedure
      .input(z.object({
        photoIds: z.array(z.number()).optional(), // Se não informado, usa as 2 mais recentes
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        let photos = await db.getPhotosByStudentId(ctx.student.id);
        
        if (photos.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Nenhuma foto encontrada para análise.' });
        }
        
        // Filtrar por IDs se informado
        if (input.photoIds && input.photoIds.length > 0) {
          photos = photos.filter(p => input.photoIds!.includes(p.id));
        } else {
          // Pegar as 2 mais recentes
          photos = [...photos].sort((a, b) => 
            new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime()
          ).slice(0, 2);
        }
        
        if (photos.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Fotos não encontradas.' });
        }
        
        const content: any[] = [
          {
            type: 'text',
            text: `Analise as fotos de evolução física deste aluno.

Informações das fotos:
${photos.map(p => `- ${p.category || 'Geral'} (${new Date(p.photoDate).toLocaleDateString('pt-BR')})`).join('\n')}

Forneça:
1. MUDANÇAS VISÍVEIS: O que mudou entre as fotos
2. PROGRESSÃO: Avaliação da evolução corporal
3. ÁREAS DE DESTAQUE: Grupos musculares que mostraram mais desenvolvimento
4. OPORTUNIDADES: Áreas que podem melhorar
5. FEEDBACK MOTIVACIONAL: Comentário positivo sobre o progresso

Seja profissional, respeitoso e motivador.`
          }
        ];
        
        // Adicionar as fotos
        for (const photo of photos) {
          content.push({
            type: 'image_url',
            image_url: {
              url: photo.url,
              detail: 'high'
            }
          });
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em avaliação física e transformação corporal. Analise as fotos de forma profissional, identificando mudanças visíveis e fornecendo feedback construtivo. Seja respeitoso e motivador.'
            },
            {
              role: 'user',
              content: content
            }
          ]
        });
        
        const analysis = response.choices?.[0]?.message?.content || 'Não foi possível gerar a análise.';
        
        return {
          analysis,
          photosAnalyzed: photos.map(p => ({
            id: p.id,
            category: p.category,
            date: p.photoDate,
          })),
          generatedAt: new Date().toISOString(),
        };
      }),
    // Upload de foto guiada (para evolução)
    uploadPhoto: studentProcedure
      .input(z.object({
        poseId: z.string(), // Identificador da pose (frontal-relaxado, lateral-esquerda, etc)
        imageBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar permissão
        if (!ctx.student.canEditPhotos) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para enviar fotos. Solicite ao seu personal.' });
        }
        
        // Converter base64 para buffer
        const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Gerar chave única para o arquivo
        const fileKey = `photos/${ctx.student.personalId}/${ctx.student.id}/poses/${input.poseId}-${nanoid()}.jpg`;
        
        // Upload para S3
        const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
        
        // Mapear poseId para categoria do banco
        const categoryMap: Record<string, 'front' | 'back' | 'side_left' | 'side_right' | 'other'> = {
          'frontal-relaxado': 'front',
          'frontal-contraido': 'front',
          'lateral-esquerda': 'side_left',
          'lateral-direita': 'side_right',
          'costas-relaxado': 'back',
          'costas-contraido': 'back',
          'biceps-direito': 'other',
          'biceps-esquerdo': 'other',
          'perna-direita-relaxada': 'other',
          'perna-direita-contraida': 'other',
          'perna-esquerda-relaxada': 'other',
          'perna-esquerda-contraida': 'other',
        };
        const category = categoryMap[input.poseId] || 'other';
        
        // Salvar no banco de dados (usando notes para armazenar o poseId completo)
        const photoId = await db.createPhoto({
          studentId: ctx.student.id,
          personalId: ctx.student.personalId,
          url,
          fileKey,
          category,
          photoDate: new Date(),
          notes: `pose:${input.poseId}`, // Armazena o poseId completo nas notas
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        const poseLabels: Record<string, string> = {
          'frontal-relaxado': 'Frontal Relaxado',
          'frontal-contraido': 'Frontal Contraído',
          'lateral-esquerda': 'Lateral Esquerda',
          'lateral-direita': 'Lateral Direita',
          'costas-relaxado': 'Costas Relaxado',
          'costas-contraido': 'Costas Contraído',
          'biceps-direito': 'Bíceps Direito',
          'biceps-esquerdo': 'Bíceps Esquerdo',
          'perna-direita-relaxada': 'Perna Direita Relaxada',
          'perna-direita-contraida': 'Perna Direita Contraída',
          'perna-esquerda-relaxada': 'Perna Esquerda Relaxada',
          'perna-esquerda-contraida': 'Perna Esquerda Contraída',
        };
        await notifyOwner({
          title: `📸 Nova Foto de Evolução - ${ctx.student.name}`,
          content: `O aluno ${ctx.student.name} enviou uma nova foto de evolução.\n\n📍 Pose: ${poseLabels[input.poseId] || input.poseId}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\nAcesse o sistema para visualizar.`,
        });
        
        return { id: photoId, url };
      }),
    
    // Listar fotos guiadas do aluno
    guidedPhotos: studentProcedure
      .query(async ({ ctx }) => {
        const photos = await db.getPhotosByStudentId(ctx.student.id);
        
        // Extrair poseId das notas e organizar por pose com histórico
        const photosByPose: Record<string, Array<{
          id: number;
          url: string;
          date: Date;
          category: string | null;
        }>> = {};
        
        photos.forEach(photo => {
          const poseMatch = photo.notes?.match(/^pose:(.+)$/);
          const poseId = poseMatch ? poseMatch[1] : null;
          
          if (poseId) {
            if (!photosByPose[poseId]) {
              photosByPose[poseId] = [];
            }
            photosByPose[poseId].push({
              id: photo.id,
              url: photo.url,
              date: photo.createdAt,
              category: photo.category,
            });
          }
        });
        
        // Ordenar cada pose por data (mais recente primeiro)
        Object.keys(photosByPose).forEach(poseId => {
          photosByPose[poseId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        
        return {
          photosByPose,
          allPhotos: photos.map(photo => {
            const poseMatch = photo.notes?.match(/^pose:(.+)$/);
            return {
              ...photo,
              poseId: poseMatch ? poseMatch[1] : null,
            };
          }),
        };
      }),
    
    // Análise de fotos com IA
    analyzePhotos: studentProcedure
      .input(z.object({
        poseId: z.string(),
        firstPhotoUrl: z.string(),
        lastPhotoUrl: z.string(),
        poseName: z.string(),
        daysBetween: z.number(),
        // Medidas opcionais para enriquecer a análise
        measurementsBefore: z.object({
          weight: z.number().optional(),
          bodyFat: z.number().optional(),
          chest: z.number().optional(),
          waist: z.number().optional(),
          hips: z.number().optional(),
          arm: z.number().optional(),
          thigh: z.number().optional(),
        }).optional(),
        measurementsAfter: z.object({
          weight: z.number().optional(),
          bodyFat: z.number().optional(),
          chest: z.number().optional(),
          waist: z.number().optional(),
          hips: z.number().optional(),
          arm: z.number().optional(),
          thigh: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Construir seção de medidas se disponível
        let measurementsSection = '';
        if (input.measurementsBefore || input.measurementsAfter) {
          measurementsSection = '\n\n**MEDIDAS CORPORAIS:**\n';
          
          const formatMeasurement = (label: string, before?: number, after?: number, unit: string = '') => {
            if (before !== undefined && after !== undefined) {
              const diff = after - before;
              const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
              return `- ${label}: ${before}${unit} → ${after}${unit} (${diffStr}${unit})\n`;
            } else if (after !== undefined) {
              return `- ${label} atual: ${after}${unit}\n`;
            }
            return '';
          };
          
          measurementsSection += formatMeasurement('Peso', input.measurementsBefore?.weight, input.measurementsAfter?.weight, 'kg');
          measurementsSection += formatMeasurement('Gordura corporal', input.measurementsBefore?.bodyFat, input.measurementsAfter?.bodyFat, '%');
          measurementsSection += formatMeasurement('Peito', input.measurementsBefore?.chest, input.measurementsAfter?.chest, 'cm');
          measurementsSection += formatMeasurement('Cintura', input.measurementsBefore?.waist, input.measurementsAfter?.waist, 'cm');
          measurementsSection += formatMeasurement('Quadril', input.measurementsBefore?.hips, input.measurementsAfter?.hips, 'cm');
          measurementsSection += formatMeasurement('Braço', input.measurementsBefore?.arm, input.measurementsAfter?.arm, 'cm');
          measurementsSection += formatMeasurement('Coxa', input.measurementsBefore?.thigh, input.measurementsAfter?.thigh, 'cm');
        }
        
        const prompt = `Você é um personal trainer especialista em análise de evolução física.

Analise as duas fotos do aluno na pose "${input.poseName}" com ${input.daysBetween} dias de diferença entre elas.

Primeira foto (antes): ${input.firstPhotoUrl}
Segunda foto (depois): ${input.lastPhotoUrl}${measurementsSection}

Forneça uma análise detalhada em português brasileiro, incluindo:
1. **Mudanças visíveis**: O que mudou visivelmente entre as fotos (massa muscular, definição, postura, etc.)${measurementsSection ? '\n2. **Análise das medidas**: Correlacione as mudanças visuais com os dados numéricos' : ''}
${measurementsSection ? '3' : '2'}. **Pontos positivos**: Aspectos que melhoraram
${measurementsSection ? '4' : '3'}. **Pontos de atenção**: Áreas que podem receber mais foco
${measurementsSection ? '5' : '4'}. **Recomendações**: Sugestões para continuar evoluindo
${measurementsSection ? '6. **Score de evolução**: Dê uma nota de 1 a 10 para o progresso geral' : ''}

Seja motivador mas realista. Se não conseguir identificar mudanças significativas, seja honesto mas encorajador.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um personal trainer especialista em análise de evolução física. Responda sempre em português brasileiro de forma profissional e motivadora.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: input.firstPhotoUrl, detail: 'high' } },
                  { type: 'image_url', image_url: { url: input.lastPhotoUrl, detail: 'high' } },
                ]
              },
            ],
          });
          
          const rawContent = response.choices[0]?.message?.content;
          const analysisText = typeof rawContent === 'string' ? rawContent : 'Não foi possível gerar a análise.';
          
          // Tentar extrair score se presente na análise
          let evolutionScore: number | undefined;
          const scoreMatch = analysisText.match(/(?:score|nota)[^:]*:\s*(\d+(?:\.\d+)?)/i);
          if (scoreMatch) {
            evolutionScore = parseFloat(scoreMatch[1]);
          }
          
          // Salvar análise no banco se tiver fotos com IDs
          // (para histórico de análises)
          
          return {
            analysis: analysisText,
            evolutionScore,
            analyzedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Erro na análise de fotos:', error);
          return {
            analysis: 'Desculpe, não foi possível analisar as fotos no momento. Tente novamente mais tarde.',
            evolutionScore: undefined,
            analyzedAt: new Date().toISOString(),
          };
        }
      }),
    
    // Nova rota para análise completa de evolução (fotos + medidas + histórico)
    analyzeFullEvolution: studentProcedure
      .input(z.object({
        beforePhotoId: z.number().optional(),
        afterPhotoId: z.number().optional(),
        beforePhotoUrl: z.string().optional(),
        afterPhotoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar fotos
        let beforeUrl = input.beforePhotoUrl;
        let afterUrl = input.afterPhotoUrl;
        let beforeDate: Date | null = null;
        let afterDate: Date | null = null;
        
        if (input.beforePhotoId || input.afterPhotoId) {
          const photos = await db.getPhotosByStudentId(ctx.student.id);
          if (input.beforePhotoId) {
            const photo = photos.find(p => p.id === input.beforePhotoId);
            if (photo) {
              beforeUrl = photo.url;
              beforeDate = new Date(photo.photoDate);
            }
          }
          if (input.afterPhotoId) {
            const photo = photos.find(p => p.id === input.afterPhotoId);
            if (photo) {
              afterUrl = photo.url;
              afterDate = new Date(photo.photoDate);
            }
          }
        }
        
        if (!beforeUrl || !afterUrl) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fotos não encontradas para análise.' });
        }
        
        // Buscar medidas do aluno
        const measurements = await db.getMeasurementsByStudentId(ctx.student.id);
        const sortedMeasurements = [...measurements].sort((a, b) => 
          new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
        );
        
        // Pegar primeira e última medição
        const latestMeasurement = sortedMeasurements[0];
        const oldestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];
        
        // Construir contexto de medidas
        let measurementsContext = '';
        if (latestMeasurement && oldestMeasurement && sortedMeasurements.length > 1) {
          measurementsContext = `\n\n**EVOLUÇÃO DAS MEDIDAS:**\n`;
          measurementsContext += `Período: ${new Date(oldestMeasurement.measureDate).toLocaleDateString('pt-BR')} até ${new Date(latestMeasurement.measureDate).toLocaleDateString('pt-BR')}\n\n`;
          
          const addMeasure = (label: string, before: number | null, after: number | null, unit: string) => {
            if (before !== null && after !== null) {
              const diff = after - before;
              const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
              return `- ${label}: ${before}${unit} → ${after}${unit} (${diffStr}${unit})\n`;
            }
            return '';
          };
          
          const toNum = (v: string | null) => v ? parseFloat(v) : null;
          measurementsContext += addMeasure('Peso', toNum(oldestMeasurement.weight), toNum(latestMeasurement.weight), 'kg');
          measurementsContext += addMeasure('Gordura corporal', toNum(oldestMeasurement.bodyFat), toNum(latestMeasurement.bodyFat), '%');
          measurementsContext += addMeasure('Peito', toNum(oldestMeasurement.chest), toNum(latestMeasurement.chest), 'cm');
          measurementsContext += addMeasure('Cintura', toNum(oldestMeasurement.waist), toNum(latestMeasurement.waist), 'cm');
          measurementsContext += addMeasure('Quadril', toNum(oldestMeasurement.hip), toNum(latestMeasurement.hip), 'cm');
          measurementsContext += addMeasure('Braço D', toNum(oldestMeasurement.rightArm), toNum(latestMeasurement.rightArm), 'cm');
          measurementsContext += addMeasure('Braço E', toNum(oldestMeasurement.leftArm), toNum(latestMeasurement.leftArm), 'cm');
          measurementsContext += addMeasure('Coxa D', toNum(oldestMeasurement.rightThigh), toNum(latestMeasurement.rightThigh), 'cm');
          measurementsContext += addMeasure('Coxa E', toNum(oldestMeasurement.leftThigh), toNum(latestMeasurement.leftThigh), 'cm');
        }
        
        // Buscar anamnese para contexto
        const anamnesis = await db.getAnamnesisByStudentId(ctx.student.id);
        let goalContext = '';
        if (anamnesis?.mainGoal) {
          goalContext = `\n\n**OBJETIVO DO ALUNO:** ${anamnesis.mainGoal}`;
        }
        
        const daysBetween = beforeDate && afterDate 
          ? Math.abs(Math.floor((afterDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        
        const prompt = `Você é um personal trainer especialista em análise de evolução física.

Analise a evolução física completa deste aluno com base nas fotos e dados fornecidos.${goalContext}${measurementsContext}

${daysBetween > 0 ? `Período entre as fotos: ${daysBetween} dias` : ''}

Forneça uma análise completa em português brasileiro:

1. **ANÁLISE VISUAL** (baseada nas fotos)
   - Mudanças na composição corporal
   - Desenvolvimento muscular visível
   - Postura e simetria

2. **ANÁLISE DAS MEDIDAS** (se disponível)
   - Interpretação dos números
   - Correlação com as mudanças visuais

3. **PROGRESSO EM RELAÇÃO AO OBJETIVO**
   - Avaliação do progresso
   - Está no caminho certo?

4. **PONTOS FORTES**
   - O que está funcionando bem

5. **ÁREAS DE MELHORIA**
   - O que pode melhorar

6. **RECOMENDAÇÕES**
   - Sugestões práticas

7. **SCORES DE EVOLUÇÃO** (de 1 a 10)
   - Ganho muscular: X/10
   - Perda de gordura: X/10
   - Postura: X/10
   - Progresso geral: X/10

Seja motivador mas realista e profissional.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um personal trainer especialista em análise de evolução física. Responda sempre em português brasileiro de forma profissional, detalhada e motivadora.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: beforeUrl, detail: 'high' } },
                  { type: 'image_url', image_url: { url: afterUrl, detail: 'high' } },
                ]
              },
            ],
          });
          
          const rawContent = response.choices[0]?.message?.content;
          const analysisText = typeof rawContent === 'string' ? rawContent : 'Não foi possível gerar a análise.';
          
          // Extrair scores da análise
          const extractScore = (text: string, pattern: RegExp): number | undefined => {
            const match = text.match(pattern);
            return match ? parseFloat(match[1]) : undefined;
          };
          
          const scores = {
            muscleGain: extractScore(analysisText, /ganho muscular[^:]*:\s*(\d+(?:\.\d+)?)/i),
            fatLoss: extractScore(analysisText, /perda de gordura[^:]*:\s*(\d+(?:\.\d+)?)/i),
            posture: extractScore(analysisText, /postura[^:]*:\s*(\d+(?:\.\d+)?)/i),
            overall: extractScore(analysisText, /progresso geral[^:]*:\s*(\d+(?:\.\d+)?)/i),
          };
          
          return {
            analysis: analysisText,
            scores,
            analyzedAt: new Date().toISOString(),
            measurementsIncluded: !!measurementsContext,
            daysBetween,
          };
        } catch (error) {
          console.error('Erro na análise completa:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao analisar evolução.' });
        }
      }),
  }),
  
  // ==================== PENDING CHANGES (Para o Personal) ====================
  pendingChanges: router({
    list: personalProcedure.query(async ({ ctx }) => {
      return await db.getPendingChangesByPersonalId(ctx.personal.id);
    }),
    
    count: personalProcedure.query(async ({ ctx }) => {
      return await db.countPendingChangesByPersonalId(ctx.personal.id);
    }),
    
    approve: personalProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.approvePendingChange(input.id, input.reviewNotes);
        return { success: true };
      }),
    
    reject: personalProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.rejectPendingChange(input.id, input.reviewNotes);
        return { success: true };
      }),
  }),

  // ==================== TRASH (Lixeira Geral) ====================
  trash: router({
    emptyAll: personalProcedure.mutation(async ({ ctx }) => {
      // Excluir permanentemente todos os itens da lixeira
      await db.emptyTrash(ctx.personal.id);
      return { success: true };
    }),
  }),

  // ==================== STEVO WEBHOOK (Receber mensagens WhatsApp) ====================
  stevoWebhook: router({
    // Processar mensagem recebida do Stevo
    processMessage: publicProcedure
      .input(z.object({
        instanceName: z.string(),
        from: z.string(), // Número do remetente
        message: z.string().optional(),
        messageType: z.enum(['text', 'image', 'document', 'audio', 'video']),
        mediaUrl: z.string().optional(),
        timestamp: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzePaymentMessage, generatePaymentResponseMessage, sendWhatsAppMessage } = await import('./stevo');
        
        // Normalizar número de telefone (remover 55 e formatar)
        let phone = input.from.replace(/\D/g, '');
        if (phone.startsWith('55')) {
          phone = phone.substring(2);
        }
        
        // Buscar aluno pelo telefone
        const student = await db.getStudentByPhone(phone);
        
        if (!student) {
          console.log('[Stevo Webhook] Aluno não encontrado para telefone:', phone);
          return { processed: false, reason: 'student_not_found' };
        }
        
        // Analisar a mensagem
        const analysis = analyzePaymentMessage({
          instanceName: input.instanceName,
          from: input.from,
          message: input.message || '',
          messageType: input.messageType,
          mediaUrl: input.mediaUrl,
          timestamp: input.timestamp || Date.now(),
        });
        
        if (!analysis.isPaymentRelated) {
          return { processed: false, reason: 'not_payment_related' };
        }
        
        // Buscar cobrança pendente mais recente do aluno
        const charges = await db.getChargesByStudentId(student.id);
        const pendingCharge = charges.find(c => c.status === 'pending' || c.status === 'overdue');
        
        if (!pendingCharge) {
          return { processed: false, reason: 'no_pending_charge' };
        }
        
        // Se alta confiança, confirmar automaticamente
        if (analysis.suggestedAction === 'auto_confirm') {
          await db.updateCharge(pendingCharge.id, {
            status: 'paid',
            paidAt: new Date(),
            notes: (pendingCharge.notes || '') + '\n[Auto] Confirmado via WhatsApp em ' + new Date().toLocaleString('pt-BR'),
          });
          
          // Buscar personal para enviar resposta
          const personal = await db.getPersonalByUserId(student.personalId);
          if (personal?.evolutionApiKey && personal?.evolutionInstance) {
            await sendWhatsAppMessage({
              phone: student.phone || '',
              message: generatePaymentResponseMessage(student.name, 'confirmed'),
              config: {
                apiKey: personal.evolutionApiKey,
                instanceName: personal.evolutionInstance,
                server: (personal as any).stevoServer || 'sm15',
              },
            });
          }
          
          // Notificar o personal
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `💳 Pagamento Confirmado Automaticamente - ${student.name}`,
            content: `O aluno ${student.name} enviou comprovante de pagamento via WhatsApp.\n\nValor: R$ ${(Number(pendingCharge.amount) / 100).toFixed(2)}\nDescrição: ${pendingCharge.description}\n\nO pagamento foi confirmado automaticamente.`,
          });
          
          return { 
            processed: true, 
            action: 'auto_confirmed',
            chargeId: pendingCharge.id,
            studentId: student.id,
          };
        }
        
        // Se precisa revisão manual, notificar o personal
        if (analysis.suggestedAction === 'manual_review') {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `💳 Possível Pagamento - ${student.name}`,
            content: `O aluno ${student.name} enviou uma mensagem que pode ser confirmação de pagamento:\n\nMensagem: "${input.message || '[Mídia]'}"\nTipo: ${input.messageType}\n\nValor pendente: R$ ${(Number(pendingCharge.amount) / 100).toFixed(2)}\n\nPor favor, verifique e confirme manualmente se necessário.`,
          });
          
          // Enviar resposta ao aluno
          const personal = await db.getPersonalByUserId(student.personalId);
          if (personal?.evolutionApiKey && personal?.evolutionInstance) {
            await sendWhatsAppMessage({
              phone: student.phone || '',
              message: generatePaymentResponseMessage(student.name, 'pending_review'),
              config: {
                apiKey: personal.evolutionApiKey,
                instanceName: personal.evolutionInstance,
                server: (personal as any).stevoServer || 'sm15',
              },
            });
          }
          
          return { 
            processed: true, 
            action: 'pending_review',
            chargeId: pendingCharge.id,
            studentId: student.id,
          };
        }
        
        return { processed: false, reason: 'no_action_needed' };
      }),
  }),

  // ==================== DIÁRIO DE TREINO DO MAROMBA ====================
  trainingDiary: router({
    // Listar registros de treino com filtro por aluno
    list: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional().default(50),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        const logs = await db.getWorkoutLogsByPersonalId(ctx.personal.id, input);
        return logs;
      }),
    
    // Obter um registro de treino com todos os detalhes
    get: personalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        const log = await db.getWorkoutLogWithDetails(input.id);
        
        // Deserializar drops e restPauses das notes de cada série
        if (log?.exercises) {
          for (const ex of log.exercises) {
            if (ex.sets) {
              for (const set of ex.sets) {
                if (set.notes && set.notes.includes('[[EXTRAS]]')) {
                  const [notes, extrasJson] = set.notes.split('[[EXTRAS]]');
                  set.notes = notes.trim();
                  try {
                    const extras = JSON.parse(extrasJson);
                    if (extras.drops) {
                      (set as any).drops = extras.drops;
                    }
                    if (extras.restPauses) {
                      (set as any).restPauses = extras.restPauses;
                    }
                  } catch (e) {
                    // Ignorar erros de parse
                  }
                }
                // Garantir que hasDropSet e hasRestPause estejam definidos
                (set as any).hasDropSet = set.isDropSet || ((set as any).drops && (set as any).drops.length > 0);
                (set as any).hasRestPause = set.isRestPause || ((set as any).restPauses && (set as any).restPauses.length > 0);
              }
            }
          }
        }
        
        return log;
      }),
    
    // Criar novo registro de treino
    create: personalProcedure
      .input(z.object({
        studentId: z.number(),
        sessionId: z.number().optional(),
        workoutId: z.number().optional(),
        workoutDayId: z.number().optional(),
        trainingDate: z.string(),
        dayName: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        totalDuration: z.number().optional(),
        notes: z.string().optional(),
        feeling: z.enum(['great', 'good', 'normal', 'tired', 'exhausted']).optional(),
        exercises: z.array(z.object({
          exerciseId: z.number().optional(),
          exerciseName: z.string(),
          muscleGroup: z.string().optional(),
          plannedSets: z.number().optional(),
          plannedReps: z.string().optional(),
          plannedRest: z.number().optional(),
          notes: z.string().optional(),
          sets: z.array(z.object({
            setNumber: z.number(),
            setType: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
            weight: z.number().optional(),
            reps: z.number().optional(),
            restTime: z.number().optional(),
            isDropSet: z.boolean().optional(),
            dropWeight: z.number().optional(),
            dropReps: z.number().optional(),
            drops: z.array(z.object({
              weight: z.number().optional(),
              reps: z.number().optional(),
              restTime: z.number().optional(),
            })).optional(),
            isRestPause: z.boolean().optional(),
            restPauseWeight: z.number().optional(),
            restPauseReps: z.number().optional(),
            restPausePause: z.number().optional(),
            restPauses: z.array(z.object({
              pauseTime: z.number().optional(),
              weight: z.number().optional(),
              reps: z.number().optional(),
            })).optional(),
            rpe: z.number().optional(),
            isCompleted: z.boolean().optional(),
            notes: z.string().optional(),
          })).optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        const { exercises, trainingDate, ...logData } = input;
        
        console.log('=== trainingDiary.create ===');
        console.log('Input:', JSON.stringify(input, null, 2));
        console.log('trainingDate:', trainingDate);
        console.log('logData:', JSON.stringify(logData, null, 2));
        
        // Helper para converter number para string (decimal)
        const toDecimal = (val?: number) => val !== undefined ? val.toString() : undefined;
        
        // Formatar a data corretamente para o banco (YYYY-MM-DD)
        const formattedDate = trainingDate.split('T')[0]; // Pegar apenas a parte da data
        
        console.log('formattedDate:', formattedDate);
        
        // Criar o log principal
        const logId = await db.createWorkoutLog({
          ...logData,
          personalId: ctx.personal.id,
          trainingDate: formattedDate,
          status: 'in_progress',
        });
        
        // Criar exercícios e séries
        if (exercises && exercises.length > 0) {
          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            const { sets, ...exData } = ex;
            
            const exerciseId = await db.createWorkoutLogExercise({
              workoutLogId: logId,
              orderIndex: i,
              ...exData,
            });
            
            // Criar séries do exercício
            if (sets && sets.length > 0) {
              for (const set of sets) {
                // Serializar drops e restPauses extras no campo notes como JSON
                let notesWithExtras = set.notes || '';
                const extras: { drops?: typeof set.drops; restPauses?: typeof set.restPauses } = {};
                if (set.drops && set.drops.length > 0) {
                  extras.drops = set.drops;
                }
                if (set.restPauses && set.restPauses.length > 0) {
                  extras.restPauses = set.restPauses;
                }
                if (Object.keys(extras).length > 0) {
                  // Adicionar JSON ao final das notes com separador especial
                  const existingNotes = notesWithExtras.replace(/\n?\[\[EXTRAS\]\][\s\S]*$/, '');
                  notesWithExtras = existingNotes + (existingNotes ? '\n' : '') + '[[EXTRAS]]' + JSON.stringify(extras);
                }
                
                await db.createWorkoutLogSet({
                  workoutLogExerciseId: exerciseId,
                  setNumber: set.setNumber,
                  setType: set.setType,
                  weight: toDecimal(set.weight),
                  reps: set.reps,
                  restTime: set.restTime,
                  isDropSet: set.isDropSet || (set.drops && set.drops.length > 0),
                  dropWeight: toDecimal(set.dropWeight || (set.drops?.[0]?.weight)),
                  dropReps: set.dropReps || set.drops?.[0]?.reps,
                  isRestPause: set.isRestPause || (set.restPauses && set.restPauses.length > 0),
                  restPauseWeight: toDecimal(set.restPauseWeight || (set.restPauses?.[0]?.weight)),
                  restPauseReps: set.restPauseReps || set.restPauses?.[0]?.reps,
                  restPausePause: set.restPausePause || set.restPauses?.[0]?.pauseTime,
                  rpe: set.rpe,
                  isCompleted: set.isCompleted,
                  notes: notesWithExtras,
                });
              }
            }
          }
        }
        
        // Se foi associado a uma sessão, marcar a sessão como concluída
        if (input.sessionId) {
          await db.updateSession(input.sessionId, { status: 'completed' });
        }
        
        return { id: logId };
      }),
    
    // Atualizar registro de treino
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        dayName: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        totalDuration: z.number().optional(),
        notes: z.string().optional(),
        feeling: z.enum(['great', 'good', 'normal', 'tired', 'exhausted']).optional(),
        status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateWorkoutLog(id, {
          ...data,
          completedAt: data.status === 'completed' ? new Date() : undefined,
        });
        return { success: true };
      }),
    
    // Adicionar exercício ao registro
    addExercise: personalProcedure
      .input(z.object({
        workoutLogId: z.number(),
        exerciseId: z.number().optional(),
        exerciseName: z.string(),
        muscleGroup: z.string().optional(),
        plannedSets: z.number().optional(),
        plannedReps: z.string().optional(),
        plannedRest: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        // Obter o próximo índice
        const exercises = await db.getWorkoutLogExercises(input.workoutLogId);
        const orderIndex = exercises.length;
        
        const id = await db.createWorkoutLogExercise({
          ...input,
          orderIndex,
        });
        return { id };
      }),
    
    // Atualizar exercício
    updateExercise: personalProcedure
      .input(z.object({
        id: z.number(),
        exerciseName: z.string().optional(),
        muscleGroup: z.string().optional(),
        plannedSets: z.number().optional(),
        plannedReps: z.string().optional(),
        plannedRest: z.number().optional(),
        notes: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const db = await import('./db');
        await db.updateWorkoutLogExercise(id, data);
        return { success: true };
      }),
    
    // Remover exercício
    deleteExercise: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        await db.deleteWorkoutLogExercise(input.id);
        return { success: true };
      }),
    
    // Adicionar série ao exercício
    addSet: personalProcedure
      .input(z.object({
        workoutLogExerciseId: z.number(),
        setNumber: z.number(),
        setType: z.enum(['warmup', 'feeler', 'working', 'drop', 'rest_pause', 'failure']).optional(),
        weight: z.number().optional(),
        reps: z.number().optional(),
        restTime: z.number().optional(),
        isDropSet: z.boolean().optional(),
        dropWeight: z.number().optional(),
        dropReps: z.number().optional(),
        isRestPause: z.boolean().optional(),
        restPauseWeight: z.number().optional(),
        restPauseReps: z.number().optional(),
        restPausePause: z.number().optional(),
        rpe: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        const toDecimal = (val?: number) => val !== undefined ? val.toString() : undefined;
        const id = await db.createWorkoutLogSet({
          workoutLogExerciseId: input.workoutLogExerciseId,
          setNumber: input.setNumber,
          setType: input.setType,
          weight: toDecimal(input.weight),
          reps: input.reps,
          restTime: input.restTime,
          isDropSet: input.isDropSet,
          dropWeight: toDecimal(input.dropWeight),
          dropReps: input.dropReps,
          isRestPause: input.isRestPause,
          restPauseWeight: toDecimal(input.restPauseWeight),
          restPauseReps: input.restPauseReps,
          restPausePause: input.restPausePause,
          rpe: input.rpe,
          notes: input.notes,
        });
        return { id };
      }),
    
    // Atualizar série
    updateSet: personalProcedure
      .input(z.object({
        id: z.number(),
        weight: z.number().optional(),
        reps: z.number().optional(),
        restTime: z.number().optional(),
        isDropSet: z.boolean().optional(),
        dropWeight: z.number().optional(),
        dropReps: z.number().optional(),
        isRestPause: z.boolean().optional(),
        restPauseWeight: z.number().optional(),
        restPauseReps: z.number().optional(),
        restPausePause: z.number().optional(),
        rpe: z.number().optional(),
        isCompleted: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, weight, dropWeight, restPauseWeight, ...rest } = input;
        const db = await import('./db');
        const toDecimal = (val?: number) => val !== undefined ? val.toString() : undefined;
        await db.updateWorkoutLogSet(id, {
          ...rest,
          weight: toDecimal(weight),
          dropWeight: toDecimal(dropWeight),
          restPauseWeight: toDecimal(restPauseWeight),
        });
        return { success: true };
      }),
    
    // Remover série
    deleteSet: personalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        await db.deleteWorkoutLogSet(input.id);
        return { success: true };
      }),
    
    // Finalizar treino (calcula estatísticas)
    complete: personalProcedure
      .input(z.object({
        id: z.number(),
        feeling: z.enum(['great', 'good', 'normal', 'tired', 'exhausted']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        
        // Calcular estatísticas
        const stats = await db.calculateWorkoutLogStats(input.id);
        
        // Atualizar o log
        await db.updateWorkoutLog(input.id, {
          status: 'completed',
          completedAt: new Date(),
          feeling: input.feeling,
          notes: input.notes,
          totalSets: stats.totalSets,
          totalReps: stats.totalReps,
          totalVolume: stats.totalVolume.toString(),
          totalExercises: stats.totalExercises,
        });
        
        return { success: true, stats };
      }),
    
    // Dashboard de evolução
    dashboard: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getTrainingDashboard(ctx.personal.id, input);
      }),
    
    // Análise por grupo muscular
    muscleGroupAnalysis: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getMuscleGroupAnalysis(ctx.personal.id, input);
      }),
    
    // Histórico de evolução de um exercício
    exerciseProgress: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        exerciseName: z.string(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getExerciseProgressHistory(ctx.personal.id, input.studentId, input.exerciseName, input.limit);
      }),
    
    // Listar exercícios únicos do aluno (para lista de evolução)
    uniqueExercises: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getUniqueExerciseNames(ctx.personal.id, input?.studentId);
      }),
    
    // Listar sugestões pendentes
    suggestions: personalProcedure
      .input(z.object({
        studentId: z.number().optional(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await import('./db');
        return await db.getWorkoutLogSuggestions(ctx.personal.id, input);
      }),
    
    // Aprovar sugestão
    approveSuggestion: personalProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        await db.approveWorkoutLogSuggestion(input.id, input.reviewNotes);
        return { success: true };
      }),
    
    // Rejeitar sugestão
    rejectSuggestion: personalProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import('./db');
        await db.rejectWorkoutLogSuggestion(input.id, input.reviewNotes);
        return { success: true };
      }),
    
    // Análise por IA do aluno
    aiAnalysis: personalProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const db = await import('./db');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar anamnese
        const anamnesis = await db.getAnamnesisByStudentId(input.studentId);
        
        // Buscar medidas
        const allMeasurements = await db.getMeasurementsByStudentId(input.studentId);
        const measurements = allMeasurements.slice(0, 10);
        
        // Buscar fotos de evolução
        const photos = await db.getPhotosByStudentId(input.studentId);
        const photosByCategory = photos.reduce((acc, photo) => {
          const category = photo.category || 'other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(photo);
          return acc;
        }, {} as Record<string, typeof photos>);
        
        // Calcular evolução visual (se tiver fotos suficientes)
        const hasPhotoEvolution = Object.values(photosByCategory).some(arr => arr.length >= 2);
        
        // Buscar análise de grupos musculares (90 dias)
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        const muscleGroupAnalysis = await db.getMuscleGroupAnalysis(
          ctx.personal.id,
          { studentId: input.studentId, startDate, endDate }
        );
        
        // Buscar logs de treino recentes
        const allLogs = await db.getWorkoutLogsByStudentId(input.studentId);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentLogs = allLogs.filter(log => new Date(log.trainingDate).getTime() > thirtyDaysAgo);
        
        // Buscar progressão de exercícios principais
        const mainExercises = ['Supino Reto', 'Agachamento', 'Levantamento Terra', 'Desenvolvimento', 'Remada'];
        const exerciseProgress: Record<string, any[]> = {};
        for (const exercise of mainExercises) {
          const progress = await db.getExerciseProgressHistory(ctx.personal.id, input.studentId, exercise, 10);
          if (progress.length > 0) {
            exerciseProgress[exercise] = progress;
          }
        }
        
        // Calcular estatísticas de frequência
        const trainingDays = new Set(recentLogs.map(log => {
          const date = new Date(log.trainingDate);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        })).size;
        const weeksInPeriod = 4;
        const avgTrainingsPerWeek = trainingDays / weeksInPeriod;
        
        // Calcular sentimento médio
        const feelingsMap: Record<string, number> = {
          'terrible': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'excellent': 5
        };
        const feelings = recentLogs
          .filter(log => log.feeling)
          .map(log => feelingsMap[log.feeling!] || 3);
        const avgFeeling = feelings.length > 0 
          ? feelings.reduce((a, b) => a + b, 0) / feelings.length 
          : 3;
        
        const systemPrompt = `Você é um assistente especializado em análise de treino e evolução física.
Sua função é analisar os dados do aluno e fornecer insights úteis para o personal trainer.
Seja direto, objetivo e use linguagem profissional.
Identifique pontos fortes, pontos de atenção e oportunidades de melhoria.
Sempre baseie suas análises nos dados fornecidos.`;
        
        const userPrompt = `Analise os dados do aluno ${student.name} e forneça insights para o personal trainer:

## ANAMNESE
${anamnesis ? `
- Objetivo principal: ${anamnesis.mainGoal || 'Não informado'}
- Objetivos secundários: ${anamnesis.secondaryGoals || 'Não informado'}
- Peso alvo: ${anamnesis.targetWeight || 'Não informado'}
- Experiência com exercícios: ${(anamnesis as any).exerciseExperience || 'Não informado'}
- Frequência semanal desejada: ${(anamnesis as any).weeklyFrequency || 'Não informado'}x
- Duração da sessão: ${(anamnesis as any).sessionDuration || 'Não informado'} min
- Restrições de treino: ${(anamnesis as any).trainingRestrictions || 'Nenhuma'}
- Histórico médico: ${anamnesis.medicalHistory || 'Nenhum'}
- Lesões: ${anamnesis.injuries || 'Nenhuma'}
- Nível de estresse: ${anamnesis.stressLevel || 'Não informado'}
- Horas de sono: ${anamnesis.sleepHours || 'Não informado'}h
- Ênfases musculares: ${(anamnesis as any).muscleEmphasis || 'Nenhuma'}
` : 'Anamnese não preenchida'}

## EVOLUÇÃO DAS MEDIDAS (${measurements.length} registros)
${measurements.length > 0 ? measurements.slice(0, 5).map((m, i) => `
${i === 0 ? 'Mais recente' : `${i + 1}º registro`} (${new Date(m.measureDate).toLocaleDateString('pt-BR')}):
- Peso: ${m.weight || '-'}kg
- Gordura: ${m.bodyFat || '-'}%
- Peito: ${m.chest || '-'}cm
- Cintura: ${m.waist || '-'}cm
- Quadril: ${m.hip || '-'}cm
- Braço D: ${m.rightArm || '-'}cm | Braço E: ${m.leftArm || '-'}cm
- Coxa D: ${m.rightThigh || '-'}cm | Coxa E: ${m.leftThigh || '-'}cm
`).join('') : 'Nenhuma medida registrada'}

## ANÁLISE DE GRUPOS MUSCULARES (Últimos 90 dias)
${muscleGroupAnalysis.length > 0 ? muscleGroupAnalysis.map(g => 
  `- ${g.name}: ${g.volume}kg volume | ${g.sets} séries | ${g.exercises} exercícios`
).join('\n') : 'Nenhum dado de treino registrado'}

## PROGRESSÃO DE CARGA (Exercícios principais)
${Object.entries(exerciseProgress).length > 0 ? Object.entries(exerciseProgress).map(([exercise, progress]) => {
  const first = progress[progress.length - 1];
  const last = progress[0];
  const improvement = first && last && first.maxWeight && last.maxWeight
    ? ((last.maxWeight - first.maxWeight) / first.maxWeight * 100).toFixed(1)
    : null;
  return `- ${exercise}: ${last?.maxWeight || '-'}kg (${improvement ? (parseFloat(improvement) >= 0 ? '+' : '') + improvement + '%' : 'sem dados anteriores'})`;
}).join('\n') : 'Nenhum dado de progressão'}

## FREQUÊNCIA E CONSISTÊNCIA
- Treinos nos últimos 30 dias: ${trainingDays}
- Média semanal: ${avgTrainingsPerWeek.toFixed(1)} treinos/semana
- Sentimento médio: ${avgFeeling.toFixed(1)}/5

## FOTOS DE EVOLUÇÃO
${hasPhotoEvolution ? `O aluno possui fotos de evolução registradas:
${Object.entries(photosByCategory).map(([category, categoryPhotos]) => {
  const sorted = categoryPhotos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysBetween = Math.floor((new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return `- ${category}: ${categoryPhotos.length} fotos (${daysBetween > 0 ? daysBetween + ' dias de evolução' : 'registro inicial'})`;
}).join('\n')}

Considere a consistência do registro fotográfico na análise.` : 'Nenhuma foto de evolução registrada ainda. Sugira ao aluno registrar fotos para acompanhamento visual.'}

## INSTRUÇÕES
Com base nesses dados, forneça:
1. **Resumo Geral**: Uma visão geral do progresso do aluno (2-3 frases)
2. **Pontos Fortes**: O que está indo bem (lista de 2-4 itens)
3. **Pontos de Atenção**: O que precisa de cuidado ou ajuste (lista de 2-4 itens)
4. **Desequilíbrios Musculares**: Grupos que estão sendo negligenciados ou supertreinados
5. **Recomendações**: Sugestões práticas para o personal (lista de 3-5 itens)
6. **Alerta**: Qualquer preocupação importante baseada nos dados (se houver)

Retorne APENAS o JSON no formato especificado.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'student_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  resumoGeral: { type: 'string', description: 'Visão geral do progresso em 2-3 frases' },
                  pontosFortes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de pontos fortes'
                  },
                  pontosAtencao: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de pontos que precisam de atenção'
                  },
                  desequilibriosMusculares: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Grupos musculares negligenciados ou supertreinados'
                  },
                  recomendacoes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Sugestões práticas para o personal'
                  },
                  alerta: {
                    type: 'string',
                    description: 'Preocupação importante ou string vazia se não houver'
                  },
                },
                required: ['resumoGeral', 'pontosFortes', 'pontosAtencao', 'desequilibriosMusculares', 'recomendacoes', 'alerta'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar análise' });
        }
        
        try {
          const analysis = JSON.parse(content);
          
          // Atualizar lastAnalyzedAt do aluno
          await db.updateStudentLastAnalyzedAt(input.studentId);
          
          return {
            success: true,
            analysis,
            metadata: {
              studentName: student.name,
              analyzedAt: new Date().toISOString(),
              dataPoints: {
                measurements: measurements.length,
                muscleGroups: muscleGroupAnalysis.length,
                trainingDays,
                exercisesTracked: Object.keys(exerciseProgress).length,
              },
            },
          };
        } catch (e) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao processar análise' });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
