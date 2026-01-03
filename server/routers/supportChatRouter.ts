import { publicProcedure, ownerProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

// Base de conhecimento completa do FitPrime
const FITPRIME_KNOWLEDGE_BASE = `
# FitPrime Manager - Base de Conhecimento Completa

## Sobre o FitPrime
O FitPrime Manager é a plataforma mais completa para personal trainers gerenciarem seus negócios. Automatiza cobranças, cria treinos com IA, organiza agenda e muito mais.

## Planos e Preços (MUITO IMPORTANTE - MEMORIZE ISSO)

### Plano Beginner - R$ 39,90/mês
- Até 5 alunos incluídos
- Aluno extra: R$ 7,98/mês
- Ideal para quem está começando
- Todas as funcionalidades básicas

### Plano Starter - R$ 97/mês
- Até 15 alunos incluídos
- Aluno extra: R$ 6,47/mês
- Ideal para personals em crescimento
- Automações WhatsApp

### Plano Pro - R$ 147/mês
- Até 30 alunos incluídos
- Aluno extra: R$ 4,90/mês
- Ideal para personals consolidados
- Relatórios avançados

### Plano Business - R$ 197/mês
- Até 50 alunos incluídos
- Aluno extra: R$ 3,94/mês
- Ideal para negócios em expansão
- Suporte prioritário

### Plano Premium - R$ 297/mês
- Até 100 alunos incluídos
- Aluno extra: R$ 2,97/mês
- Ideal para studios e equipes
- Consultoria mensal

### Plano Enterprise - R$ 497/mês
- Alunos ilimitados
- Ideal para grandes operações
- Suporte VIP dedicado
- API personalizada

## CÁLCULO DE PREÇO (USE ESTA FÓRMULA)
Para calcular o preço exato baseado na quantidade de alunos:

1. Se tem 1-5 alunos: Beginner R$ 39,90
2. Se tem 6-15 alunos: Starter R$ 97
3. Se tem 16-30 alunos: Pro R$ 147
4. Se tem 31-50 alunos: Business R$ 197
5. Se tem 51-100 alunos: Premium R$ 297
6. Se tem 100+ alunos: Enterprise R$ 497

Exemplo: "Tenho 14 alunos" = Plano Starter R$ 97/mês (14 alunos estão dentro do limite de 15)
Exemplo: "Tenho 20 alunos" = Plano Pro R$ 147/mês (20 alunos estão dentro do limite de 30)
Exemplo: "Tenho 8 alunos" = Plano Starter R$ 97/mês (8 alunos estão dentro do limite de 15)

Se o usuário exceder o limite do plano, calcule o valor extra:
Exemplo: "Tenho 18 alunos no Starter" = R$ 97 + (3 alunos extras x R$ 6,47) = R$ 116,41/mês

## Funcionalidades Principais

### Gestão de Alunos
- Cadastro completo com anamnese
- Histórico de evolução
- Fotos de progresso
- Medidas corporais
- Cálculo automático de IMC e BF

### Treinos com IA
- Geração automática de treinos personalizados
- Baseado na anamnese e objetivos do aluno
- Diário de treino para acompanhamento
- Histórico de evolução de cargas

### Agenda Inteligente
- Calendário visual (diário, semanal, mensal)
- Agendamento automático ao fechar plano
- Controle de presença
- Lembretes automáticos

### Cobranças Automáticas
- Integração com Cakto (cartão, Pix, boleto)
- Cobrança recorrente automática
- Controle de inadimplência
- Relatórios financeiros

### Portal do Aluno
- Acesso exclusivo para cada aluno
- Visualização de treinos
- Histórico de pagamentos
- Agenda pessoal

### Automações WhatsApp
- Lembretes de treino (24h e 2h antes)
- Lembretes de pagamento
- Mensagens de aniversário
- Boas-vindas automáticas

### Relatórios e Análises
- Dashboard com KPIs
- Gráficos de evolução
- Taxa de presença
- Receita mensal

## Garantias
- Garantia de 7 dias (dinheiro de volta)
- Cancele quando quiser, sem multa
- Sem fidelidade ou contrato
- Acesso imediato após pagamento

## Suporte
- Chat de suporte em tempo real
- Suporte por email
- Planos Pro+ têm suporte prioritário
- Enterprise tem suporte VIP dedicado

## Pagamento
- Cartão de crédito
- Pix
- Boleto bancário
- Processado pela Cakto (plataforma segura)

## Perguntas Frequentes

P: Posso testar antes de pagar?
R: Sim! Oferecemos 7 dias de garantia. Se não gostar, devolvemos seu dinheiro.

P: Como funciona o aluno extra?
R: Se você exceder o limite do seu plano, paga apenas pelo aluno extra (valor varia por plano).

P: Posso mudar de plano?
R: Sim! Você pode fazer upgrade ou downgrade a qualquer momento.

P: O FitPrime funciona no celular?
R: Sim! É um app web progressivo (PWA) que funciona em qualquer dispositivo.

P: Meus dados estão seguros?
R: Sim! Usamos criptografia e servidores seguros para proteger seus dados.
`;

export const supportChatRouter = router({
  // Criar ou obter conversa de suporte
  getOrCreateConversation: publicProcedure
    .input(z.object({
      visitorId: z.string(),
      visitorName: z.string().optional(),
      visitorEmail: z.string().email().optional(),
      visitorPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Procurar conversa existente
      let conversation = await db.getSupportConversationByVisitorId(input.visitorId);
      
      if (!conversation) {
        // Criar nova conversa
        const conversationId = await db.createSupportConversation({
          visitorId: input.visitorId,
          visitorName: input.visitorName,
          visitorEmail: input.visitorEmail,
          visitorPhone: input.visitorPhone,
          status: 'active',
          source: 'landing',
        });
        conversation = await db.getSupportConversationById(conversationId);
      }
      
      return conversation;
    }),

  // Enviar mensagem de suporte
  sendMessage: publicProcedure
    .input(z.object({
      conversationId: z.number(),
      visitorId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Verificar se a conversa pertence ao visitante
      const conversation = await db.getSupportConversationById(input.conversationId);
      if (!conversation || conversation.visitorId !== input.visitorId) {
        throw new Error("Unauthorized");
      }

      // Salvar mensagem do visitante
      const messageId = await db.createSupportMessage({
        conversationId: input.conversationId,
        sender: 'visitor',
        message: input.message,
        isAutoReply: false,
      });

      // Gerar resposta automática com IA inteligente
      try {
        // Buscar histórico de mensagens para contexto
        const previousMessages = await db.getSupportMessages(input.conversationId);
        const conversationHistory = previousMessages.slice(-10).map(msg => ({
          role: msg.sender === 'visitor' ? 'user' as const : 'assistant' as const,
          content: msg.message,
        }));

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é a Assistente Virtual do FitPrime, uma IA especializada em ajudar personal trainers a escolherem o melhor plano.

SUA PERSONALIDADE:
- Seja amigável, profissional e prestativa
- Use linguagem natural e acolhedora
- Seja direta e objetiva nas respostas
- Use emojis com moderação para tornar a conversa mais humana

REGRAS IMPORTANTES:
1. SEMPRE calcule o preço correto quando o usuário mencionar quantidade de alunos
2. Se o usuário perguntar "quanto vou pagar" ou "qual o preço", PERGUNTE quantos alunos ele tem se não souber
3. Seja específico com valores - nunca diga "depende", calcule e mostre
4. Incentive o usuário a começar com o plano adequado
5. Destaque os benefícios e o ROI (retorno sobre investimento)

BASE DE CONHECIMENTO:
${FITPRIME_KNOWLEDGE_BASE}

EXEMPLOS DE RESPOSTAS:

Usuário: "Tenho 14 alunos, quanto vou pagar?"
Resposta: "Com 14 alunos, o plano ideal pra você é o Starter por R$ 97/mês! 💪 Ele inclui até 15 alunos, então você está dentro do limite. Isso dá menos de R$ 7 por aluno - muito mais barato que qualquer concorrente!"

Usuário: "Quanto custa?"
Resposta: "Depende de quantos alunos você atende! 😊 Nossos planos começam em R$ 39,90/mês (até 5 alunos). Quantos alunos você tem hoje?"

Usuário: "Tenho 8 alunos"
Resposta: "Perfeito! Com 8 alunos, o plano Starter de R$ 97/mês é ideal pra você! 🌟 Ele suporta até 15 alunos, então você ainda tem espaço pra crescer sem pagar mais. Quer começar agora?"

Mantenha respostas concisas (2-4 frases) mas sempre com informação útil e específica.`,
            },
            ...conversationHistory,
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        const aiMessage = typeof response.choices[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : "Obrigado pela sua mensagem. Um membro da nossa equipe responderá em breve.";

        // Salvar resposta automática
        await db.createSupportMessage({
          conversationId: input.conversationId,
          sender: 'ai',
          message: aiMessage,
          isAutoReply: true,
        });

        // Atualizar conversa
        await db.updateSupportConversation(input.conversationId, {
          lastMessageAt: new Date(),
          status: 'waiting',
        });

        return {
          visitorMessage: messageId,
          aiResponse: aiMessage as string,
        };
      } catch (error) {
        // Se a IA falhar, salvar resposta padrão
        const defaultMessage: string = "Obrigado pela sua mensagem! Um membro da nossa equipe responderá em breve.";
        await db.createSupportMessage({
          conversationId: input.conversationId,
          sender: 'ai',
          message: defaultMessage,
          isAutoReply: true,
        });

        await db.updateSupportConversation(input.conversationId, {
          lastMessageAt: new Date(),
          status: 'waiting',
        });

        return {
          visitorMessage: messageId,
          aiResponse: defaultMessage as string,
        };
      }
    }),

  // Obter mensagens de uma conversa
  getMessages: publicProcedure
    .input(z.object({
      conversationId: z.number(),
      visitorId: z.string(),
    }))
    .query(async ({ input }) => {
      // Verificar se a conversa pertence ao visitante
      const conversation = await db.getSupportConversationById(input.conversationId);
      if (!conversation || conversation.visitorId !== input.visitorId) {
        throw new Error("Unauthorized");
      }

      return await db.getSupportMessages(input.conversationId);
    }),

  // ========== ADMIN PROCEDURES ==========

  // Listar todas as conversas (apenas admin)
  getAllConversations: ownerProcedure
    .input(z.object({
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      return await db.getAllSupportConversations(input.limit);
    }),

  // Obter conversas com mensagens não lidas
  getUnreadConversations: ownerProcedure
    .query(async () => {
      return await db.getSupportConversationsWithUnreadMessages();
    }),

  // Responder como personal (admin)
  respondAsPersonal: ownerProcedure
    .input(z.object({
      conversationId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await db.getSupportConversationById(input.conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const messageId = await db.createSupportMessage({
        conversationId: input.conversationId,
        sender: 'personal',
        senderName: ctx.user?.name || 'FitPrime Support',
        message: input.message,
        isAutoReply: false,
      });

      // Atualizar conversa
      await db.updateSupportConversation(input.conversationId, {
        lastMessageAt: new Date(),
        assignedToPersonalId: ctx.user?.id,
        status: 'active',
      });

      return { messageId };
    }),

  // Marcar conversa como resolvida
  resolveConversation: ownerProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.updateSupportConversation(input.conversationId, {
        status: 'closed',
        resolvedAt: new Date(),
      });
      return { success: true };
    }),

  // Adicionar nota à conversa
  addNote: ownerProcedure
    .input(z.object({
      conversationId: z.number(),
      note: z.string(),
    }))
    .mutation(async ({ input }) => {
      const conversation = await db.getSupportConversationById(input.conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const existingNotes = conversation.notes || '';
      const newNotes = existingNotes ? `${existingNotes}\n\n${input.note}` : input.note;

      await db.updateSupportConversation(input.conversationId, {
        notes: newNotes,
      });

      return { success: true };
    }),

  // Obter estatísticas de suporte
  getStats: ownerProcedure
    .query(async () => {
      const conversations = await db.getAllSupportConversations(1000);
      const unreadCount = await db.getUnreadSupportMessagesCount();

      const stats = {
        totalConversations: conversations.length,
        activeConversations: conversations.filter(c => c.status === 'active').length,
        closedConversations: conversations.filter(c => c.status === 'closed').length,
        waitingConversations: conversations.filter(c => c.status === 'waiting').length,
        unreadMessages: unreadCount,
      };

      return stats;
    }),
});
