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
        
        // TODO: Enviar email/WhatsApp com o link de convite
        // Por enquanto retorna o link para o personal copiar
        const inviteLink = `/convite/${inviteToken}`;
        
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
        
        // Gerar PDF
        const pdfBuffer = await generateStudentPDF(
          student as any,
          anamnesis as any,
          measurements as any[],
          workouts as any[]
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
        return await db.getWorkoutsByStudentId(input.studentId);
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
        sessionDate: z.string(),
        duration: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sessionDate, ...data } = input;
        const sessionNumber = await db.getNextSessionNumber(input.workoutId, input.workoutDayId);
        const id = await db.createWorkoutLog({
          ...data,
          personalId: ctx.personal.id,
          sessionDate: new Date(sessionDate),
          sessionNumber,
        });
        return { id, sessionNumber };
      }),
    
    update: personalProcedure
      .input(z.object({
        id: z.number(),
        sessionDate: z.string().optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, sessionDate, ...data } = input;
        await db.updateWorkoutLog(id, {
          ...data,
          sessionDate: sessionDate ? new Date(sessionDate) : undefined,
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
      }))
      .mutation(async ({ ctx, input }) => {
        const { scheduledAt, ...data } = input;
        const id = await db.createSession({
          ...data,
          personalId: ctx.personal.id,
          scheduledAt: new Date(scheduledAt),
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
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, scheduledAt, ...data } = input;
        await db.updateSession(id, {
          ...data,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
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
        return sessions.map(s => ({
          id: s.id,
          date: s.scheduledAt,
          time: s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
          duration: s.duration || 60,
          status: s.status,
          notes: s.notes,
        }));
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
      return await db.getSessionsByStudentId(ctx.student.id);
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
        sessionDate: z.string(),
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
        const { sessionDate, exercises, ...data } = input;
        
        // Buscar o personal do aluno
        const student = ctx.student;
        
        // Criar o log de treino
        const sessionNumber = await db.getNextSessionNumber(input.workoutId, input.workoutDayId);
        const logId = await db.createWorkoutLog({
          ...data,
          personalId: student.personalId,
          studentId: student.id,
          sessionDate: new Date(sessionDate),
          sessionNumber,
          completed: true,
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
          content: `O aluno ${student.name} registrou um treino:\n\n📝 Treino: ${workout?.name || 'N/A'}\n📅 Data: ${new Date(sessionDate).toLocaleDateString('pt-BR')}\n⏱️ Duração: ${input.duration || 60} minutos\n\n${input.notes ? `Observações: ${input.notes}` : ''}`,
        });
        
        return { id: logId, sessionNumber };
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
});

export type AppRouter = typeof appRouter;
