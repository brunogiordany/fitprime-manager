import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { createCheckoutSession, getOrCreateStripeCustomer, cancelSubscription, getSubscription, createPaymentLink } from "./stripe";
import { billingCycleToStripeInterval, priceToCents } from "./stripe/products";

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

// Personal-only procedure
const personalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const personal = await getOrCreatePersonal(ctx.user.id);
  return next({ ctx: { ...ctx, personal: personal! } });
});

// Student procedure - for portal do aluno
const studentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const student = await db.getStudentByUserId(ctx.user.id);
  if (!student) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a alunos' });
  }
  return next({ ctx: { ...ctx, student } });
});

export const appRouter = router({
  system: systemRouter,
  
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
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePersonal(ctx.personal.id, input);
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
      .input(z.object({ studentId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const messages = await db.getChatMessages(ctx.personal.id, input.studentId, input.limit || 50);
        // Marcar mensagens do aluno como lidas
        await db.markChatMessagesAsRead(ctx.personal.id, input.studentId, 'personal');
        return messages.reverse(); // Retornar em ordem cronológica
      }),
    
    // Enviar mensagem para um aluno
    send: personalProcedure
      .input(z.object({ studentId: z.number(), message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o aluno pertence ao personal
        const student = await db.getStudentById(input.studentId, ctx.personal.id);
        if (!student) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Aluno não encontrado' });
        }
        
        const messageId = await db.createChatMessage({
          personalId: ctx.personal.id,
          studentId: input.studentId,
          senderType: 'personal',
          message: input.message,
        });
        
        return { success: true, messageId };
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
        const id = await db.createStudent({
          ...input,
          personalId: ctx.personal.id,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        });
        return { id };
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
    
    // Listar convites de um aluno
    getInvites: personalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentInvitesByStudentId(input.studentId);
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
        await notifyOwner({
          title: `🎉 Novo Cadastro - ${input.name}`,
          content: `O aluno ${input.name} aceitou o convite e criou sua conta!\n\n📧 Email: ${input.email}\n📱 Telefone: ${input.phone}\n\nO aluno agora pode acessar o portal e preencher sua anamnese.`,
        });
        
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
        
        return sessions.map(session => ({
          ...session,
          student: studentsMap.get(session.studentId),
        }));
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
      return await db.getWorkoutsByStudentId(ctx.student.id);
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
    
    // Buscar logs de treino do aluno
    workoutLogs: studentProcedure.query(async ({ ctx }) => {
      return await db.getWorkoutLogsByStudentId(ctx.student.id);
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
          const exerciseLogs = exercises.map((ex, index) => ({
            workoutLogId: logId,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            set1Weight: ex.set1Weight,
            set1Reps: ex.set1Reps,
            set2Weight: ex.set2Weight,
            set2Reps: ex.set2Reps,
            set3Weight: ex.set3Weight,
            set3Reps: ex.set3Reps,
            set4Weight: ex.set4Weight,
            set4Reps: ex.set4Reps,
            set5Weight: ex.set5Weight,
            set5Reps: ex.set5Reps,
            notes: ex.notes,
            completed: ex.completed ?? true,
            order: index,
          }));
          await db.bulkCreateExerciseLogs(exerciseLogs);
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
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.createChatMessage({
          personalId: ctx.student.personalId,
          studentId: ctx.student.id,
          senderType: 'student',
          message: input.message,
        });
        
        // Notificar o personal
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `💬 Nova mensagem de ${ctx.student.name}`,
          content: input.message.substring(0, 200) + (input.message.length > 200 ? '...' : ''),
        });
        
        return { success: true, messageId };
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
            isRestPause: z.boolean().optional(),
            restPauseWeight: z.number().optional(),
            restPauseReps: z.number().optional(),
            restPausePause: z.number().optional(),
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
                await db.createWorkoutLogSet({
                  workoutLogExerciseId: exerciseId,
                  setNumber: set.setNumber,
                  setType: set.setType,
                  weight: toDecimal(set.weight),
                  reps: set.reps,
                  restTime: set.restTime,
                  isDropSet: set.isDropSet,
                  dropWeight: toDecimal(set.dropWeight),
                  dropReps: set.dropReps,
                  isRestPause: set.isRestPause,
                  restPauseWeight: toDecimal(set.restPauseWeight),
                  restPauseReps: set.restPauseReps,
                  restPausePause: set.restPausePause,
                  rpe: set.rpe,
                  isCompleted: set.isCompleted,
                  notes: set.notes,
                });
              }
            }
          }
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
  }),
});

export type AppRouter = typeof appRouter;
