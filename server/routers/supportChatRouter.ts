import { publicProcedure, ownerProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

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

      // Gerar resposta automática com IA
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um assistente de suporte amigável para o FitPrime Manager, um aplicativo de gestão de treinos e alunos para personais trainers. 
              
Responda de forma concisa e útil sobre:
- Preços e planos (Starter R$97, Pro R$147, Business R$197, Premium R$297, Enterprise R$497)
- Funcionalidades principais (gestão de alunos, treinos com IA, agendamento, cobranças automáticas)
- Trial grátis de 7 dias
- Suporte e integração com WhatsApp
- Cancelamento e reembolso

Mantenha as respostas curtas (máximo 2-3 frases).`,
            },
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
