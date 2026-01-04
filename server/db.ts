import { eq, and, desc, asc, gte, lte, gt, lt, like, sql, or, isNull, isNotNull, not, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, User,
  personals, InsertPersonal, Personal,
  students, InsertStudent, Student,
  anamneses, InsertAnamnesis, Anamnesis,
  anamnesisHistory, InsertAnamnesisHistory,
  measurements, InsertMeasurement, Measurement,
  photos, InsertPhoto, Photo,
  photoAnalyses, InsertPhotoAnalysis, PhotoAnalysis,
  workouts, InsertWorkout, Workout,
  workoutDays, InsertWorkoutDay, WorkoutDay,
  exercises, InsertExercise, Exercise,
  sessions, InsertSession, Session,
  plans, InsertPlan, Plan,
  packages, InsertPackage, Package,
  charges, InsertCharge, Charge,
  payments, InsertPayment, Payment,
  materials, InsertMaterial, Material,
  automations, InsertAutomation, Automation,
  messageQueue, InsertMessageQueue, MessageQueueItem,
  messageLog, InsertMessageLog, MessageLogEntry,
  workoutLogs, InsertWorkoutLog, WorkoutLog,
  exerciseLogs, InsertExerciseLog, ExerciseLog,
  studentInvites, InsertStudentInvite, StudentInvite,
  passwordResetTokens, InsertPasswordResetToken, PasswordResetToken,
  pendingChanges, InsertPendingChange, PendingChange,
  chatMessages, InsertChatMessage, ChatMessage,
  chatConversations, InsertChatConversation, ChatConversation,
  chatSupportMessages, InsertChatSupportMessage, ChatSupportMessage,
  studentBadges, InsertStudentBadge, StudentBadge,
  sessionFeedback, InsertSessionFeedback, SessionFeedback,
  workoutLogExercises, InsertWorkoutLogExercise, WorkoutLogExercise,
  workoutLogSets, InsertWorkoutLogSet, WorkoutLogSet,
  workoutLogSuggestions, InsertWorkoutLogSuggestion, WorkoutLogSuggestion,
  personalSubscriptions, InsertPersonalSubscription, PersonalSubscription,
  subscriptionUsageLogs, InsertSubscriptionUsageLog, SubscriptionUsageLog,
  sitePages, InsertSitePage, SitePage,
  pageVersions, InsertPageVersion, PageVersion,
  pageAnalytics, InsertPageAnalytic, PageAnalytic,
  pageBlocks, InsertPageBlock, PageBlock,
  pageAssets, InsertPageAsset, PageAsset,
  abTests, InsertAbTest, AbTest,
  abTestVariants, InsertAbTestVariant, AbTestVariant,
  trackingPixels, InsertTrackingPixel, TrackingPixel,
  pendingActivations, InsertPendingActivation, PendingActivation,
  caktoWebhookLogs, InsertCaktoWebhookLog, CaktoWebhookLog,
  aiAnalysisHistory, InsertAiAnalysisHistory, AiAnalysisHistory,
  featureFlags, InsertFeatureFlag, FeatureFlag,
  systemSettings, InsertSystemSetting, SystemSetting,
  adminActivityLog, InsertAdminActivityLog, AdminActivityLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { logError, notifyOAuthFailure } from './_core/healthCheck';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error: any) {
    logError('Database.upsertUser', error, true);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Atualizar CREF do usuário
export async function updateUserCref(userId: number, cref: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ cref }).where(eq(users.id, userId));
}

// ==================== PERSONAL FUNCTIONS ====================
export async function getPersonalByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(personals).where(eq(personals.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPersonal(data: InsertPersonal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(personals).values(data);
  return result[0].insertId;
}

export async function updatePersonal(id: number, data: Partial<InsertPersonal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(personals).set(data).where(eq(personals.id, id));
}

// Listar todos os personais (para administração) - exclui deletados
export async function getAllPersonals() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: personals.id,
      userId: personals.userId,
      businessName: personals.businessName,
      cref: personals.cref,
      whatsappNumber: personals.whatsappNumber,
      subscriptionStatus: personals.subscriptionStatus,
      subscriptionExpiresAt: personals.subscriptionExpiresAt,
      trialEndsAt: personals.trialEndsAt,
      testAccessEndsAt: personals.testAccessEndsAt,
      testAccessGrantedBy: personals.testAccessGrantedBy,
      testAccessGrantedAt: personals.testAccessGrantedAt,
      createdAt: personals.createdAt,
      userName: users.name,
      userEmail: users.email,
      userCpf: users.cpf,
    })
    .from(personals)
    .leftJoin(users, eq(personals.userId, users.id))
    .where(isNull(personals.deletedAt))
    .orderBy(desc(personals.createdAt));
  
  return result;
}

// Atualizar acesso de teste de um personal
export async function updatePersonalTestAccess(personalId: number, data: {
  testAccessEndsAt: Date | null;
  testAccessGrantedBy: string | null;
  testAccessGrantedAt: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(personals).set(data).where(eq(personals.id, personalId));
}

// Atualizar assinatura de um personal
export async function updatePersonalSubscription(personalId: number, data: {
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  subscriptionExpiresAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(personals).set(data).where(eq(personals.id, personalId));
}

// Soft delete de personal (para admin) - marca como excluído mas mantém no banco
export async function softDeletePersonal(personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  // Buscar o personal para obter o userId
  const personal = await db.select({ userId: personals.userId })
    .from(personals)
    .where(eq(personals.id, personalId))
    .limit(1);
  
  if (!personal[0]) {
    throw new Error("Personal não encontrado");
  }
  
  // Marcar personal como excluído
  await db.update(personals)
    .set({ deletedAt: now })
    .where(eq(personals.id, personalId));
  
  // Marcar usuário como excluído
  if (personal[0].userId) {
    await db.update(users)
      .set({ deletedAt: now })
      .where(eq(users.id, personal[0].userId));
  }
}

// Restaurar personal excluído
export async function restorePersonal(personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar o personal para obter o userId
  const personal = await db.select({ userId: personals.userId })
    .from(personals)
    .where(eq(personals.id, personalId))
    .limit(1);
  
  if (!personal[0]) {
    throw new Error("Personal não encontrado");
  }
  
  // Restaurar personal
  await db.update(personals)
    .set({ deletedAt: null })
    .where(eq(personals.id, personalId));
  
  // Restaurar usuário
  if (personal[0].userId) {
    await db.update(users)
      .set({ deletedAt: null })
      .where(eq(users.id, personal[0].userId));
  }
}

// Listar personais excluídos (lixeira)
export async function getDeletedPersonals() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: personals.id,
      userId: personals.userId,
      businessName: personals.businessName,
      cref: personals.cref,
      whatsappNumber: personals.whatsappNumber,
      subscriptionStatus: personals.subscriptionStatus,
      createdAt: personals.createdAt,
      deletedAt: personals.deletedAt,
      userName: users.name,
      userEmail: users.email,
      userCpf: users.cpf,
    })
    .from(personals)
    .leftJoin(users, eq(personals.userId, users.id))
    .where(isNotNull(personals.deletedAt))
    .orderBy(desc(personals.deletedAt));
  
  return result;
}

// Excluir permanentemente (para limpar da lixeira)
export async function deletePersonalPermanently(personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar o personal para obter o userId
  const personal = await db.select({ userId: personals.userId })
    .from(personals)
    .where(eq(personals.id, personalId))
    .limit(1);
  
  if (!personal[0]) {
    throw new Error("Personal não encontrado");
  }
  
  // Excluir alunos do personal
  await db.delete(students).where(eq(students.personalId, personalId));
  
  // Excluir o personal
  await db.delete(personals).where(eq(personals.id, personalId));
  
  // Excluir o usuário
  if (personal[0].userId) {
    await db.delete(users).where(eq(users.id, personal[0].userId));
  }
}

// ==================== STUDENT FUNCTIONS ====================
export async function getStudentsByPersonalId(personalId: number, filters?: { status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(students.personalId, personalId)];
  
  // Filtros especiais para conta criada/não criada
  if (filters?.status === 'no_account') {
    conditions.push(isNull(students.userId));
  } else if (filters?.status === 'with_account') {
    conditions.push(isNotNull(students.userId));
  } else if (filters?.status) {
    conditions.push(eq(students.status, filters.status as any));
  }
  
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(students.name, searchTerm),
        like(students.email, searchTerm),
        like(students.phone, searchTerm)
      )!
    );
  }
  
  return await db.select().from(students)
    .where(and(...conditions))
    .orderBy(asc(students.name));
}

export async function getStudentById(id: number, personalId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(eq(students.id, id), eq(students.personalId, personalId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(eq(students.email, email), isNull(students.deletedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentByIdPublic(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(data);
  return result[0].insertId;
}

export async function updateStudent(id: number, personalId: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set(data).where(and(eq(students.id, id), eq(students.personalId, personalId)));
}

export async function deleteStudent(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - mover para lixeira
  await db.update(students).set({ deletedAt: new Date() })
    .where(and(eq(students.id, id), eq(students.personalId, personalId)));
}

export async function countStudentsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(students)
    .where(and(eq(students.personalId, personalId), eq(students.status, 'active')));
  return result[0]?.count || 0;
}

export async function getStudentByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Normalizar telefone para busca (remover caracteres não numéricos)
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Buscar aluno pelo telefone (comparando últimos dígitos)
  const result = await db.select().from(students)
    .where(and(
      isNull(students.deletedAt),
      sql`REPLACE(REPLACE(REPLACE(REPLACE(${students.phone}, '(', ''), ')', ''), '-', ''), ' ', '') LIKE ${'%' + normalizedPhone.slice(-9)}`
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ==================== ANAMNESIS FUNCTIONS ====================
export async function getAnamnesisByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(anamneses).where(eq(anamneses.studentId, studentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnamnesis(data: InsertAnamnesis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(anamneses).values(data);
  return result[0].insertId;
}

export async function updateAnamnesis(id: number, data: Partial<InsertAnamnesis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(anamneses).set({ ...data, version: sql`version + 1` }).where(eq(anamneses.id, id));
}

export async function getAnamnesisHistory(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(anamnesisHistory)
    .where(eq(anamnesisHistory.studentId, studentId))
    .orderBy(desc(anamnesisHistory.createdAt));
}

export async function createAnamnesisHistory(data: InsertAnamnesisHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(anamnesisHistory).values(data);
}

// ==================== MEASUREMENT FUNCTIONS ====================
export async function getMeasurementsByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(measurements)
    .where(and(eq(measurements.studentId, studentId), isNull(measurements.deletedAt)))
    .orderBy(desc(measurements.measureDate));
}

export async function getMeasurementById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(measurements).where(eq(measurements.id, id));
  return result[0] || null;
}

export async function createMeasurement(data: InsertMeasurement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(measurements).values(data);
  return result[0].insertId;
}

export async function updateMeasurement(id: number, data: Partial<InsertMeasurement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(measurements).set(data).where(eq(measurements.id, id));
}

export async function deleteMeasurement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - move to trash
  await db.update(measurements).set({ deletedAt: new Date() }).where(eq(measurements.id, id));
}

export async function getDeletedMeasurementsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: measurements.id,
    studentId: measurements.studentId,
    personalId: measurements.personalId,
    measureDate: measurements.measureDate,
    weight: measurements.weight,
    bodyFat: measurements.bodyFat,
    deletedAt: measurements.deletedAt,
    studentName: students.name,
  }).from(measurements)
    .leftJoin(students, eq(measurements.studentId, students.id))
    .where(and(eq(measurements.personalId, personalId), isNotNull(measurements.deletedAt)))
    .orderBy(desc(measurements.deletedAt));
}

export async function restoreMeasurement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(measurements).set({ deletedAt: null }).where(eq(measurements.id, id));
}

export async function permanentlyDeleteMeasurement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(measurements).where(eq(measurements.id, id));
}

// ==================== PHOTO FUNCTIONS ====================
export async function getPhotosByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photos)
    .where(eq(photos.studentId, studentId))
    .orderBy(desc(photos.photoDate));
}

export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(data);
  return result[0].insertId;
}

export async function deletePhoto(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(photos).where(and(eq(photos.id, id), eq(photos.personalId, personalId)));
}

export async function getPhotoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(photos).where(eq(photos.id, id));
  return result[0] || null;
}

export async function updatePhoto(id: number, data: Partial<InsertPhoto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(photos).set(data).where(eq(photos.id, id));
}

export async function getPhotosByPoseId(studentId: number, poseId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photos)
    .where(and(
      eq(photos.studentId, studentId),
      eq(photos.poseId, poseId)
    ))
    .orderBy(desc(photos.photoDate));
}

// ==================== PHOTO ANALYSIS FUNCTIONS ====================
export async function createPhotoAnalysis(data: InsertPhotoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photoAnalyses).values(data);
  return result[0].insertId;
}

export async function getPhotoAnalysesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photoAnalyses)
    .where(eq(photoAnalyses.studentId, studentId))
    .orderBy(desc(photoAnalyses.createdAt));
}

export async function getPhotoAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(photoAnalyses).where(eq(photoAnalyses.id, id));
  return result[0] || null;
}

export async function getLatestPhotoAnalysis(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(photoAnalyses)
    .where(eq(photoAnalyses.studentId, studentId))
    .orderBy(desc(photoAnalyses.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getPhotoAnalysesByPhotoIds(beforePhotoId: number, afterPhotoId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photoAnalyses)
    .where(and(
      eq(photoAnalyses.beforePhotoId, beforePhotoId),
      eq(photoAnalyses.afterPhotoId, afterPhotoId)
    ))
    .orderBy(desc(photoAnalyses.createdAt));
}

// ==================== WORKOUT FUNCTIONS ====================
export async function getWorkoutsByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workouts)
    .where(and(
      eq(workouts.studentId, studentId),
      isNull(workouts.deletedAt) // Filtrar treinos não excluídos
    ))
    .orderBy(desc(workouts.createdAt));
}

export async function getWorkoutById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorkout(data: InsertWorkout) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workouts).values(data);
  return result[0].insertId;
}

export async function updateWorkout(id: number, data: Partial<InsertWorkout>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workouts).set(data).where(eq(workouts.id, id));
}

// Soft delete - move para lixeira
export async function deleteWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - marca como excluído ao invés de deletar
  await db.update(workouts).set({ deletedAt: new Date() }).where(eq(workouts.id, id));
}

// Restaurar treino da lixeira
export async function restoreWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workouts).set({ deletedAt: null }).where(eq(workouts.id, id));
}

// Listar treinos na lixeira
export async function getDeletedWorkoutsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const deletedWorkouts = await db.select().from(workouts)
    .where(and(
      eq(workouts.personalId, personalId),
      not(isNull(workouts.deletedAt))
    ))
    .orderBy(desc(workouts.deletedAt));
  
  // Adicionar nome do aluno
  const result = [];
  for (const workout of deletedWorkouts) {
    const student = await db.select().from(students)
      .where(eq(students.id, workout.studentId))
      .limit(1);
    result.push({
      ...workout,
      studentName: student[0]?.name || 'Aluno desconhecido',
    });
  }
  
  return result;
}

// Exclusão permanente - remove de todos os lugares
export async function permanentlyDeleteWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Buscar todos os dias do treino
  const days = await db.select().from(workoutDays).where(eq(workoutDays.workoutId, id));
  // Excluir exercícios de cada dia
  for (const day of days) {
    await db.delete(exercises).where(eq(exercises.workoutDayId, day.id));
  }
  // Excluir os dias do treino
  await db.delete(workoutDays).where(eq(workoutDays.workoutId, id));
  // Excluir workout logs relacionados
  const logs = await db.select().from(workoutLogs).where(eq(workoutLogs.workoutId, id));
  for (const log of logs) {
    await db.delete(exerciseLogs).where(eq(exerciseLogs.workoutLogId, log.id));
  }
  await db.delete(workoutLogs).where(eq(workoutLogs.workoutId, id));
  // Excluir o treino permanentemente
  await db.delete(workouts).where(eq(workouts.id, id));
}

// ==================== WORKOUT DAY FUNCTIONS ====================
export async function getWorkoutDaysByWorkoutId(workoutId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutDays)
    .where(eq(workoutDays.workoutId, workoutId))
    .orderBy(asc(workoutDays.order));
}

export async function createWorkoutDay(data: InsertWorkoutDay) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutDays).values(data);
  return result[0].insertId;
}

export async function updateWorkoutDay(id: number, data: Partial<InsertWorkoutDay>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutDays).set(data).where(eq(workoutDays.id, id));
}

export async function deleteWorkoutDay(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workoutDays).where(eq(workoutDays.id, id));
}

// ==================== EXERCISE FUNCTIONS ====================
export async function getExercisesByWorkoutDayId(workoutDayId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises)
    .where(eq(exercises.workoutDayId, workoutDayId))
    .orderBy(asc(exercises.order));
}

export async function createExercise(data: InsertExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exercises).values(data);
  return result[0].insertId;
}

export async function updateExercise(id: number, data: Partial<InsertExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exercises).set(data).where(eq(exercises.id, id));
}

export async function deleteExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exercises).where(eq(exercises.id, id));
}

// ==================== SESSION FUNCTIONS ====================
export async function getSessionsByPersonalId(personalId: number, filters?: { startDate?: Date; endDate?: Date; studentId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(sessions.personalId, personalId),
    isNull(sessions.deletedAt), // Filtrar sessões excluídas
  ];
  
  if (filters?.startDate) {
    conditions.push(gte(sessions.scheduledAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(sessions.scheduledAt, filters.endDate));
  }
  if (filters?.studentId) {
    conditions.push(eq(sessions.studentId, filters.studentId));
  }
  if (filters?.status) {
    conditions.push(eq(sessions.status, filters.status as any));
  }
  
  return await db.select().from(sessions)
    .where(and(...conditions))
    .orderBy(asc(sessions.scheduledAt));
}

export async function getSessionsByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessions)
    .where(and(
      eq(sessions.studentId, studentId),
      isNull(sessions.deletedAt) // Filtrar sessões excluídas
    ))
    .orderBy(desc(sessions.scheduledAt));
}

export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getTodaySessions(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return await db.select({
    session: sessions,
    student: students
  }).from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, today),
      lte(sessions.scheduledAt, tomorrow)
    ))
    .orderBy(asc(sessions.scheduledAt));
}

export async function createSession(data: InsertSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessions).values(data);
  return result[0].insertId;
}

export async function updateSession(id: number, data: Partial<InsertSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessions).set(data).where(eq(sessions.id, id));
}

export async function deleteSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - mover para lixeira
  await db.update(sessions).set({ deletedAt: new Date() }).where(eq(sessions.id, id));
}

// Verificar conflito de horário para sessões
export async function checkSessionConflict(
  personalId: number, 
  startTime: Date, 
  endTime: Date, 
  excludeSessionId?: number
): Promise<{ studentName: string; time: string } | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar sessões que se sobreponham ao horário
  // Uma sessão conflita se: (inicio_nova < fim_existente) AND (fim_nova > inicio_existente)
  const conditions = [
    eq(sessions.personalId, personalId),
    isNull(sessions.deletedAt),
    not(eq(sessions.status, 'cancelled')),
    lte(sessions.scheduledAt, endTime),
  ];
  
  if (excludeSessionId) {
    conditions.push(not(eq(sessions.id, excludeSessionId)));
  }
  
  const conflictingSessions = await db.select({
    session: sessions,
    student: students
  }).from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(and(...conditions));
  
  // Verificar se alguma sessão realmente conflita
  for (const { session, student } of conflictingSessions) {
    const sessionStart = new Date(session.scheduledAt);
    const sessionDuration = session.duration || 60;
    const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000);
    
    // Verifica sobreposição: nova sessão começa antes do fim da existente E termina depois do início da existente
    if (startTime < sessionEnd && endTime > sessionStart) {
      return {
        studentName: student.name,
        time: sessionStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
  
  return null;
}

export async function countSessionsThisMonth(personalId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, noShow: 0 };
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const result = await db.select({
    status: sessions.status,
    count: sql<number>`count(*)`
  }).from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, firstDay),
      lte(sessions.scheduledAt, lastDay)
    ))
    .groupBy(sessions.status);
  
  let total = 0, completed = 0, noShow = 0;
  result.forEach(r => {
    total += r.count;
    if (r.status === 'completed') completed = r.count;
    if (r.status === 'no_show') noShow = r.count;
  });
  
  return { total, completed, noShow };
}

// ==================== PLAN FUNCTIONS ====================
export async function getPlansByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(plans)
    .where(eq(plans.personalId, personalId))
    .orderBy(asc(plans.name));
}

export async function getPlanById(id: number, personalId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const conditions = [eq(plans.id, id)];
  if (personalId) {
    conditions.push(eq(plans.personalId, personalId));
  }
  
  const result = await db.select().from(plans).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPlan(data: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(data);
  return result[0].insertId;
}

export async function updatePlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(data).where(eq(plans.id, id));
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set({ isActive: false }).where(eq(plans.id, id));
}

// ==================== PACKAGE FUNCTIONS ====================
export async function getPackagesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    package: packages,
    plan: plans
  }).from(packages)
    .innerJoin(plans, eq(packages.planId, plans.id))
    .where(eq(packages.studentId, studentId))
    .orderBy(desc(packages.createdAt));
}

export async function getActivePackageByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    package: packages,
    plan: plans
  }).from(packages)
    .innerJoin(plans, eq(packages.planId, plans.id))
    .where(and(eq(packages.studentId, studentId), eq(packages.status, 'active')))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPackage(data: InsertPackage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(packages).values(data);
  return result[0].insertId;
}

export async function updatePackage(id: number, data: Partial<InsertPackage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(packages).set(data).where(eq(packages.id, id));
}

// Pausar todos os pacotes ativos de um aluno
export async function pausePackagesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(packages)
    .set({ status: 'paused' })
    .where(and(
      eq(packages.studentId, studentId),
      eq(packages.status, 'active')
    ));
}

// Reativar pacotes pausados de um aluno
export async function reactivatePackagesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(packages)
    .set({ status: 'active' })
    .where(and(
      eq(packages.studentId, studentId),
      eq(packages.status, 'paused')
    ));
}

// Cancelar todos os pacotes de um aluno
export async function cancelPackagesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(packages)
    .set({ status: 'cancelled' })
    .where(and(
      eq(packages.studentId, studentId),
      or(
        eq(packages.status, 'active'),
        eq(packages.status, 'paused')
      )
    ));
}

// Cancelar sessões futuras de um aluno
export async function cancelFutureSessionsByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db.update(sessions)
    .set({ status: 'cancelled' })
    .where(and(
      eq(sessions.studentId, studentId),
      gt(sessions.scheduledAt, now),
      or(
        eq(sessions.status, 'scheduled'),
        eq(sessions.status, 'confirmed')
      )
    ));
}

// Cancelar cobranças futuras/pendentes de um aluno
export async function cancelFutureChargesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db.update(charges)
    .set({ status: 'cancelled' })
    .where(and(
      eq(charges.studentId, studentId),
      or(
        eq(charges.status, 'pending'),
        and(
          eq(charges.status, 'overdue'),
          gt(charges.dueDate, now)
        )
      )
    ));
}

// ==================== CHARGE FUNCTIONS ====================
export async function getChargesByPersonalId(personalId: number, filters?: { status?: string; studentId?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(charges.personalId, personalId)];
  
  if (filters?.status) {
    conditions.push(eq(charges.status, filters.status as any));
  }
  if (filters?.studentId) {
    conditions.push(eq(charges.studentId, filters.studentId));
  }
  
  return await db.select({
    charge: charges,
    student: students
  }).from(charges)
    .innerJoin(students, eq(charges.studentId, students.id))
    .where(and(...conditions))
    .orderBy(desc(charges.dueDate));
}

export async function getChargesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(charges)
    .where(eq(charges.studentId, studentId))
    .orderBy(desc(charges.dueDate));
}

export async function createCharge(data: InsertCharge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(charges).values(data);
  return result[0].insertId;
}

export async function updateCharge(id: number, data: Partial<InsertCharge>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(charges).set(data).where(eq(charges.id, id));
}

export async function getChargeById(id: number): Promise<Charge | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(charges).where(eq(charges.id, id));
  return result[0] || null;
}

export async function getMonthlyRevenue(personalId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const result = await db.select({
    total: sql<string>`COALESCE(SUM(paidAmount), 0)`
  }).from(charges)
    .where(and(
      eq(charges.personalId, personalId),
      eq(charges.status, 'paid'),
      gte(charges.paidAt, firstDay),
      lte(charges.paidAt, lastDay)
    ));
  
  return parseFloat(result[0]?.total || '0');
}

export async function getPendingChargesCount(personalId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    count: sql<number>`count(*)`
  }).from(charges)
    .where(and(
      eq(charges.personalId, personalId),
      or(eq(charges.status, 'pending'), eq(charges.status, 'overdue'))
    ));
  
  return result[0]?.count || 0;
}

// ==================== PAYMENT FUNCTIONS ====================
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function getPaymentsByChargeId(chargeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(eq(payments.chargeId, chargeId))
    .orderBy(desc(payments.paymentDate));
}

// ==================== MATERIAL FUNCTIONS ====================
export async function getMaterialsByStudentId(studentId: number, personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(materials)
    .where(and(
      eq(materials.personalId, personalId),
      or(eq(materials.studentId, studentId), isNull(materials.studentId), eq(materials.isPublic, true))
    ))
    .orderBy(desc(materials.createdAt));
}

export async function createMaterial(data: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materials).values(data);
  return result[0].insertId;
}

export async function deleteMaterial(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(materials).where(and(eq(materials.id, id), eq(materials.personalId, personalId)));
}

// ==================== AUTOMATION FUNCTIONS ====================
export async function getAutomationsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(automations)
    .where(eq(automations.personalId, personalId))
    .orderBy(asc(automations.name));
}

export async function getActiveAutomationsByTrigger(personalId: number, trigger: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(automations)
    .where(and(
      eq(automations.personalId, personalId),
      eq(automations.trigger, trigger as any),
      eq(automations.isActive, true)
    ));
}

export async function createAutomation(data: InsertAutomation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(automations).values(data);
  return result[0].insertId;
}

export async function updateAutomation(id: number, data: Partial<InsertAutomation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(automations).set(data).where(eq(automations.id, id));
}

export async function deleteAutomation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(automations).where(eq(automations.id, id));
}

export async function getAutomationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(automations).where(eq(automations.id, id)).limit(1);
  return result[0] || null;
}

// ==================== MESSAGE QUEUE FUNCTIONS ====================
export async function getPendingMessages(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db.select().from(messageQueue)
    .where(and(
      eq(messageQueue.status, 'pending'),
      lte(messageQueue.scheduledAt, now)
    ))
    .orderBy(asc(messageQueue.scheduledAt))
    .limit(limit);
}

export async function createMessageQueue(data: InsertMessageQueue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messageQueue).values(data);
  return result[0].insertId;
}

export async function updateMessageQueue(id: number, data: Partial<InsertMessageQueue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messageQueue).set(data).where(eq(messageQueue.id, id));
}

export async function getMessageQueueByPersonalId(personalId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messageQueue)
    .where(eq(messageQueue.personalId, personalId))
    .orderBy(desc(messageQueue.createdAt))
    .limit(limit);
}

// ==================== MESSAGE LOG FUNCTIONS ====================
export async function createMessageLog(data: InsertMessageLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messageLog).values(data);
  return result[0].insertId;
}

export async function getMessageLogByPersonalId(personalId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    log: messageLog,
    student: students
  }).from(messageLog)
    .innerJoin(students, eq(messageLog.studentId, students.id))
    .where(eq(messageLog.personalId, personalId))
    .orderBy(desc(messageLog.createdAt))
    .limit(limit);
}

export async function getMessageLogByStudentId(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messageLog)
    .where(eq(messageLog.studentId, studentId))
    .orderBy(desc(messageLog.createdAt))
    .limit(limit);
}

export async function countMessagesSentToday(personalId: number, studentId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await db.select({
    count: sql<number>`count(*)`
  }).from(messageLog)
    .where(and(
      eq(messageLog.personalId, personalId),
      eq(messageLog.studentId, studentId),
      eq(messageLog.direction, 'outbound'),
      gte(messageLog.createdAt, today)
    ));
  
  return result[0]?.count || 0;
}


// ==================== WORKOUT LOG FUNCTIONS ====================
export async function getWorkoutLogsByWorkoutId(workoutId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutLogs)
    .where(eq(workoutLogs.workoutId, workoutId))
    .orderBy(desc(workoutLogs.trainingDate));
}

export async function getWorkoutLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getWorkoutLogsByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutLogs)
    .where(eq(workoutLogs.studentId, studentId))
    .orderBy(desc(workoutLogs.trainingDate));
}

export async function getWorkoutLogBySessionId(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.sessionId, sessionId))
    .limit(1);
  return result[0] || null;
}

export async function createWorkoutLog(data: Omit<InsertWorkoutLog, 'trainingDate'> & { trainingDate: string | Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Converter trainingDate para string YYYY-MM-DD
  let dateStr: string;
  if (typeof data.trainingDate === 'string') {
    dateStr = data.trainingDate.split('T')[0];
  } else if (data.trainingDate instanceof Date) {
    dateStr = data.trainingDate.toISOString().split('T')[0];
  } else {
    dateStr = new Date(String(data.trainingDate)).toISOString().split('T')[0];
  }
  
  console.log('createWorkoutLog - dateStr:', dateStr);
  console.log('createWorkoutLog - data:', JSON.stringify(data, null, 2));
  
  try {
    // Usar SQL raw para inserir com a data no formato correto
    const result = await db.execute(sql`
      INSERT INTO workout_logs (
        studentId, personalId, workoutId, workoutDayId, trainingDate,
        dayName, startTime, status, sessionDate, sessionId
      ) VALUES (
        ${data.studentId}, ${data.personalId}, ${data.workoutId}, ${data.workoutDayId}, ${dateStr},
        ${data.dayName || null}, ${data.startTime || null}, ${data.status || 'in_progress'}, ${dateStr}, ${data.sessionId || null}
      )
    `);
    
    console.log('createWorkoutLog - result:', JSON.stringify(result, null, 2));
    
    // Obter o último ID inserido
    const [lastId] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    console.log('createWorkoutLog - lastId:', JSON.stringify(lastId, null, 2));
    
    return (lastId as any)[0]?.id || (result[0] as any)?.insertId;
  } catch (error) {
    console.error('createWorkoutLog - error:', error);
    throw error;
  }
}

export async function updateWorkoutLog(id: number, data: Partial<InsertWorkoutLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutLogs).set(data).where(eq(workoutLogs.id, id));
}

export async function deleteWorkoutLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete exercise logs first
  await db.delete(exerciseLogs).where(eq(exerciseLogs.workoutLogId, id));
  // Then delete workout log
  await db.delete(workoutLogs).where(eq(workoutLogs.id, id));
}

export async function getNextSessionNumber(workoutId: number, workoutDayId: number) {
  const db = await getDb();
  if (!db) return 1;
  
  const result = await db.select({
    maxSession: sql<number>`COALESCE(MAX(sessionNumber), 0)`
  }).from(workoutLogs)
    .where(and(
      eq(workoutLogs.workoutId, workoutId),
      eq(workoutLogs.workoutDayId, workoutDayId)
    ));
  
  return (result[0]?.maxSession || 0) + 1;
}

// ==================== EXERCISE LOG FUNCTIONS ====================
export async function getExerciseLogsByWorkoutLogId(workoutLogId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exerciseLogs)
    .where(eq(exerciseLogs.workoutLogId, workoutLogId))
    .orderBy(asc(exerciseLogs.order));
}

export async function createExerciseLog(data: InsertExerciseLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exerciseLogs).values(data);
  return result[0].insertId;
}

export async function updateExerciseLog(id: number, data: Partial<InsertExerciseLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exerciseLogs).set(data).where(eq(exerciseLogs.id, id));
}

export async function deleteExerciseLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exerciseLogs).where(eq(exerciseLogs.id, id));
}

export async function bulkCreateExerciseLogs(data: InsertExerciseLog[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return [];
  const result = await db.insert(exerciseLogs).values(data);
  return result;
}

export async function bulkUpdateExerciseLogs(logs: { id: number; data: Partial<InsertExerciseLog> }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const log of logs) {
    await db.update(exerciseLogs).set(log.data).where(eq(exerciseLogs.id, log.id));
  }
}

// Get exercise history for progression tracking
export async function getExerciseHistory(exerciseId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    exerciseLog: exerciseLogs,
    workoutLog: workoutLogs
  }).from(exerciseLogs)
    .innerJoin(workoutLogs, eq(exerciseLogs.workoutLogId, workoutLogs.id))
    .where(eq(exerciseLogs.exerciseId, exerciseId))
    .orderBy(desc(workoutLogs.trainingDate))
    .limit(limit);
}


// ==================== PACKAGES EXTRAS ====================
export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(packages).where(eq(packages.id, id));
  return result[0] || null;
}

export async function deleteSessionsByPackageId(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Excluir apenas sessões futuras (status = 'scheduled')
  await db.delete(sessions)
    .where(and(
      eq(sessions.packageId, packageId),
      eq(sessions.status, 'scheduled')
    ));
}


// ==================== DEFAULT AUTOMATIONS ====================
export async function createDefaultAutomations(personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const defaultAutomations = [
    {
      personalId,
      name: "Lembrete 24h antes do treino",
      trigger: "session_reminder" as const,
      messageTemplate: "Olá {nome}! 👋\n\nLembrete: você tem treino amanhã às {hora}.\n\nPrepare-se e até lá! 💪",
      isActive: true,
      triggerHoursBefore: 24,
      sendWindowStart: "08:00",
      sendWindowEnd: "20:00",
      maxMessagesPerDay: 10,
    },
    {
      personalId,
      name: "Lembrete 2h antes do treino",
      trigger: "session_reminder" as const,
      messageTemplate: "Olá {nome}! 🏋️\n\nSeu treino começa em 2 horas às {hora}.\n\nVamos lá! 💪",
      isActive: true,
      triggerHoursBefore: 2,
      sendWindowStart: "06:00",
      sendWindowEnd: "22:00",
      maxMessagesPerDay: 10,
    },
    {
      personalId,
      name: "Lembrete de pagamento",
      trigger: "payment_reminder" as const,
      messageTemplate: "Olá {nome}! 📋\n\nLembrete: sua mensalidade vence em {vencimento}.\n\nValor: R$ {valor}\n\nQualquer dúvida, estou à disposição!",
      isActive: true,
      triggerHoursBefore: 72, // 3 dias antes
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 5,
    },
    {
      personalId,
      name: "Pagamento em atraso",
      trigger: "payment_overdue" as const,
      messageTemplate: "Olá {nome}! 📋\n\nIdentificamos que sua mensalidade está em atraso.\n\nValor: R$ {valor}\nVencimento: {vencimento}\n\nPor favor, regularize sua situação. Qualquer dúvida, estou à disposição!",
      isActive: true,
      triggerDaysAfter: 3,
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 3,
    },
    {
      personalId,
      name: "Boas-vindas",
      trigger: "welcome" as const,
      messageTemplate: "Olá {nome}! 🎉\n\nSeja muito bem-vindo(a)!\n\nEstou muito feliz em ter você como aluno(a). Vamos juntos alcançar seus objetivos!\n\nQualquer dúvida, é só chamar. 💪",
      isActive: true,
      sendWindowStart: "08:00",
      sendWindowEnd: "20:00",
      maxMessagesPerDay: 10,
    },
    {
      personalId,
      name: "Aniversário",
      trigger: "birthday" as const,
      messageTemplate: "Olá {nome}! 🎂🎉\n\nFeliz aniversário!\n\nQue seu dia seja incrível e cheio de alegrias!\n\nConte comigo sempre! 💪",
      isActive: true,
      sendWindowStart: "08:00",
      sendWindowEnd: "20:00",
      maxMessagesPerDay: 10,
    },
    // Lembretes de pagamento adicionais
    {
      personalId,
      name: "Lembrete 2 dias antes do vencimento",
      trigger: "payment_reminder_2days" as const,
      messageTemplate: "Olá {nome}! 💳\n\nLembrete: sua mensalidade vence em 2 dias ({vencimento}).\n\nValor: R$ {valor}\n\nQualquer dúvida, estou à disposição!",
      isActive: true,
      triggerHoursBefore: 48, // 2 dias antes
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 5,
    },
    {
      personalId,
      name: "Lembrete no dia do vencimento",
      trigger: "payment_reminder_dueday" as const,
      messageTemplate: "Olá {nome}! 💳\n\nHoje é o dia do vencimento da sua mensalidade!\n\nValor: R$ {valor}\n\nSe já pagou, me envie o comprovante. Qualquer dúvida, estou aqui!",
      isActive: true,
      triggerHoursBefore: 0, // No dia
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 5,
    },
    // Datas comemorativas
    {
      personalId,
      name: "Dia das Mães",
      trigger: "mothers_day" as const,
      messageTemplate: "Olá {nome}! 🌹💖\n\nFeliz Dia das Mães!\n\nQue seu dia seja repleto de amor e carinho. Você merece todas as felicidades do mundo!\n\nUm abraço especial! 💪",
      isActive: true,
      targetGender: "female" as const,
      requiresChildren: true,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 50,
    },
    {
      personalId,
      name: "Dia dos Pais",
      trigger: "fathers_day" as const,
      messageTemplate: "Olá {nome}! 👨\u200d👧\u200d👦💪\n\nFeliz Dia dos Pais!\n\nQue seu dia seja incrível ao lado de quem você ama. Parabéns por ser esse pai dedicado!\n\nUm abraço!",
      isActive: true,
      targetGender: "male" as const,
      requiresChildren: true,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 50,
    },
    {
      personalId,
      name: "Natal",
      trigger: "christmas" as const,
      messageTemplate: "Olá {nome}! 🎄🎁\n\nFeliz Natal!\n\nQue essa data especial traga muita paz, amor e saúde para você e sua família!\n\nBoas festas! 🌟",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 100,
    },
    {
      personalId,
      name: "Ano Novo",
      trigger: "new_year" as const,
      messageTemplate: "Olá {nome}! 🎉🎊\n\nFeliz Ano Novo!\n\nQue {ano} seja repleto de conquistas, saúde e muito sucesso nos treinos!\n\nConte comigo nessa jornada! 💪",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 100,
    },
    {
      personalId,
      name: "Dia da Mulher",
      trigger: "womens_day" as const,
      messageTemplate: "Olá {nome}! 🌸💜\n\nFeliz Dia Internacional da Mulher!\n\nVocê é incrível e inspiração! Continue brilhando e conquistando seus objetivos!\n\nUm abraço especial! 💪",
      isActive: true,
      targetGender: "female" as const,
      requiresChildren: false,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 50,
    },
    {
      personalId,
      name: "Dia do Homem",
      trigger: "mens_day" as const,
      messageTemplate: "Olá {nome}! 💪🔵\n\nFeliz Dia do Homem!\n\nParabéns por cuidar da sua saúde e bem-estar. Continue firme nos seus objetivos!\n\nUm abraço!",
      isActive: true,
      targetGender: "male" as const,
      requiresChildren: false,
      sendWindowStart: "08:00",
      sendWindowEnd: "12:00",
      maxMessagesPerDay: 50,
    },
    {
      personalId,
      name: "Dia do Cliente",
      trigger: "customer_day" as const,
      messageTemplate: "Olá {nome}! 🌟🙏\n\nFeliz Dia do Cliente!\n\nObrigado por confiar no meu trabalho. É uma honra fazer parte da sua jornada de saúde e bem-estar!\n\nConte sempre comigo! 💪",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      sendWindowStart: "08:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 100,
    },
    // Reengajamento de alunos inativos
    {
      personalId,
      name: "Reengajamento - 30 dias inativo",
      trigger: "reengagement_30days" as const,
      messageTemplate: "Olá {nome}! 👋\n\nSentimos sua falta! Já faz mais de 30 dias desde seu último treino.\n\n🎁 OFERTA ESPECIAL: Volte agora e ganhe uma sessão de treino GRATUITA!\n\nSua saúde é importante e estou aqui para te ajudar a retomar seus objetivos.\n\nVamos marcar um horário? 💪",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      triggerDaysAfter: 30, // 30 dias de inatividade
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 10,
    },
    // Lembrete de convite não aceito
    {
      personalId,
      name: "Lembrete de convite - 3 dias",
      trigger: "invite_reminder_3days" as const,
      messageTemplate: "Olá {nome}! 👋\n\nVocê recebeu um convite para acessar o portal do aluno, mas ainda não criou sua conta.\n\n📱 Acesse o link enviado por email e crie sua conta para:\n• Ver seus treinos personalizados\n• Acompanhar sua evolução\n• Receber lembretes das sessões\n\nQualquer dúvida, estou à disposição! 💪",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      triggerDaysAfter: 3,
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 10,
    },
    {
      personalId,
      name: "Lembrete de convite - 7 dias",
      trigger: "invite_reminder_7days" as const,
      messageTemplate: "Olá {nome}! 👋\n\nNotei que você ainda não criou sua conta no portal do aluno.\n\n✨ Com o portal você pode:\n• Acessar seus treinos a qualquer momento\n• Registrar seu progresso\n• Comunicar-se comigo diretamente\n\n🔗 Verifique seu email e clique no link de convite para começar!\n\nPrecisa de ajuda? É só me chamar! 💪",
      isActive: true,
      targetGender: "all" as const,
      requiresChildren: false,
      triggerDaysAfter: 7,
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 10,
    },
  ];
  
  for (const automation of defaultAutomations) {
    await db.insert(automations).values(automation);
  }
  
  return defaultAutomations.length;
}


// ==================== STUDENT INVITE FUNCTIONS ====================
export async function createStudentInvite(data: InsertStudentInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(studentInvites).values(data);
  return result[0].insertId;
}

export async function getStudentInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(studentInvites)
    .where(eq(studentInvites.inviteToken, token))
    .limit(1);
  return result[0] || null;
}

export async function getStudentInvitesByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentInvites)
    .where(eq(studentInvites.personalId, personalId))
    .orderBy(desc(studentInvites.createdAt));
}

export async function getStudentInvitesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentInvites)
    .where(eq(studentInvites.studentId, studentId))
    .orderBy(desc(studentInvites.createdAt));
}

// Buscar convites pendentes que precisam de lembrete (não aceitos após X dias)
export async function getPendingInvitesForReminder(personalId: number, daysAfterSent: number) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAfterSent);
  
  // Buscar convites pendentes enviados há mais de X dias
  const invites = await db.select({
    invite: studentInvites,
    student: students,
  })
    .from(studentInvites)
    .innerJoin(students, eq(studentInvites.studentId, students.id))
    .where(and(
      eq(studentInvites.personalId, personalId),
      eq(studentInvites.status, 'pending'),
      lte(studentInvites.createdAt, cutoffDate),
      gt(studentInvites.expiresAt, new Date()), // Ainda não expirou
      isNull(students.userId) // Aluno ainda não criou conta
    ));
  
  return invites.map(row => ({
    ...row.invite,
    studentName: row.student.name,
    studentEmail: row.student.email,
    studentPhone: row.student.phone,
  }));
}

export async function updateStudentInvite(id: number, data: Partial<InsertStudentInvite>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentInvites).set(data).where(eq(studentInvites.id, id));
}

export async function acceptStudentInvite(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get invite
  const invite = await getStudentInviteByToken(token);
  if (!invite) throw new Error("Convite não encontrado");
  if (invite.status !== 'pending') throw new Error("Convite já foi usado ou expirou");
  if (new Date() > invite.expiresAt) throw new Error("Convite expirado");
  
  // Update invite status
  await db.update(studentInvites).set({
    status: 'accepted',
    acceptedAt: new Date(),
  }).where(eq(studentInvites.id, invite.id));
  
  // Link user to student
  await db.update(students).set({
    userId: userId,
    status: 'active',
  }).where(eq(students.id, invite.studentId));
  
  // Update user role to student
  await db.update(users).set({
    role: 'student',
  }).where(eq(users.id, userId));
  
  return invite.studentId;
}

// ==================== PASSWORD RESET FUNCTIONS ====================
export async function createPasswordResetToken(data: InsertPasswordResetToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(passwordResetTokens).values(data);
  return result[0].insertId;
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt)
    ))
    .limit(1);
  return result[0] || null;
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({
    usedAt: new Date(),
  }).where(eq(passwordResetTokens.id, id));
}

// ==================== USER FUNCTIONS EXTRAS ====================
export async function updateUserRole(userId: number, role: 'user' | 'admin' | 'personal' | 'student') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ==================== STUDENT EXTRAS ====================
export async function linkStudentToUser(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set({ userId }).where(eq(students.id, studentId));
}

export async function unlinkStudentFromUser(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set({ userId: null }).where(eq(students.id, studentId));
}

// ==================== TRASH (LIXEIRA) FUNCTIONS ====================

// --- Students Trash ---
export async function getDeletedStudentsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(students)
    .where(and(
      eq(students.personalId, personalId),
      not(isNull(students.deletedAt))
    ))
    .orderBy(desc(students.deletedAt));
}

export async function restoreStudent(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set({ deletedAt: null })
    .where(and(eq(students.id, id), eq(students.personalId, personalId)));
}

export async function deleteStudentPermanently(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o aluno pertence ao personal
  const student = await db.select().from(students)
    .where(and(eq(students.id, id), eq(students.personalId, personalId)))
    .limit(1);
  if (!student[0]) throw new Error("Aluno não encontrado");
  
  // Excluir dados relacionados
  await db.delete(anamneses).where(eq(anamneses.studentId, id));
  await db.delete(anamnesisHistory).where(eq(anamnesisHistory.studentId, id));
  await db.delete(measurements).where(eq(measurements.studentId, id));
  await db.delete(photos).where(eq(photos.studentId, id));
  await db.delete(sessions).where(eq(sessions.studentId, id));
  await db.delete(packages).where(eq(packages.studentId, id));
  await db.delete(charges).where(eq(charges.studentId, id));
  await db.delete(materials).where(eq(materials.studentId, id));
  
  // Excluir treinos e seus dados
  const studentWorkouts = await db.select().from(workouts).where(eq(workouts.studentId, id));
  for (const workout of studentWorkouts) {
    await permanentlyDeleteWorkout(workout.id);
  }
  
  // Excluir o aluno
  await db.delete(students).where(eq(students.id, id));
}

// Soft delete student (mover para lixeira)
export async function softDeleteStudent(id: number, personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set({ deletedAt: new Date() })
    .where(and(eq(students.id, id), eq(students.personalId, personalId)));
}

// --- Sessions Trash ---
export async function getDeletedSessionsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const deletedSessions = await db.select().from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      not(isNull(sessions.deletedAt))
    ))
    .orderBy(desc(sessions.deletedAt));
  
  // Adicionar nome do aluno
  const result = [];
  for (const session of deletedSessions) {
    const student = await db.select().from(students)
      .where(eq(students.id, session.studentId))
      .limit(1);
    result.push({
      ...session,
      studentName: student[0]?.name || 'Aluno desconhecido',
    });
  }
  
  return result;
}

export async function restoreSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessions).set({ deletedAt: null }).where(eq(sessions.id, id));
}

export async function deleteSessionPermanently(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function softDeleteSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessions).set({ deletedAt: new Date() }).where(eq(sessions.id, id));
}

// --- Empty All Trash ---
export async function emptyTrash(personalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Excluir treinos permanentemente
  const deletedWorkouts = await db.select().from(workouts)
    .where(and(eq(workouts.personalId, personalId), not(isNull(workouts.deletedAt))));
  for (const workout of deletedWorkouts) {
    await permanentlyDeleteWorkout(workout.id);
  }
  
  // Excluir alunos permanentemente
  const deletedStudents = await db.select().from(students)
    .where(and(eq(students.personalId, personalId), not(isNull(students.deletedAt))));
  for (const student of deletedStudents) {
    await deleteStudentPermanently(student.id, personalId);
  }
  
  // Excluir sessões permanentemente
  await db.delete(sessions)
    .where(and(eq(sessions.personalId, personalId), not(isNull(sessions.deletedAt))));
}

// ==================== PENDING CHANGES FUNCTIONS ====================
export async function createPendingChange(data: InsertPendingChange) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pendingChanges).values(data);
  return result[0].insertId;
}

export async function getPendingChangesByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    change: pendingChanges,
    student: students,
  })
    .from(pendingChanges)
    .leftJoin(students, eq(pendingChanges.studentId, students.id))
    .where(and(
      eq(pendingChanges.personalId, personalId),
      eq(pendingChanges.status, 'pending')
    ))
    .orderBy(desc(pendingChanges.createdAt));
}

export async function getPendingChangesByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pendingChanges)
    .where(eq(pendingChanges.studentId, studentId))
    .orderBy(desc(pendingChanges.createdAt));
}

export async function updatePendingChange(id: number, data: Partial<InsertPendingChange>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pendingChanges).set(data).where(eq(pendingChanges.id, id));
}

export async function approvePendingChange(id: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the pending change
  const change = await db.select().from(pendingChanges)
    .where(eq(pendingChanges.id, id))
    .limit(1);
  
  if (!change[0]) throw new Error("Alteração não encontrada");
  
  const { entityType, entityId, fieldName, newValue } = change[0];
  
  // Apply the change based on entity type
  if (entityType === 'student') {
    await db.update(students).set({ [fieldName]: newValue }).where(eq(students.id, entityId));
  } else if (entityType === 'anamnesis') {
    await db.update(anamneses).set({ [fieldName]: newValue }).where(eq(anamneses.id, entityId));
  } else if (entityType === 'measurement') {
    await db.update(measurements).set({ [fieldName]: newValue }).where(eq(measurements.id, entityId));
  } else if (entityType === 'workout') {
    // Aplicar alterações de treino
    // fieldName formato: "weight_change_exercise_123" ou "reps_change_exercise_456"
    const parts = fieldName.split('_');
    const suggestionType = parts.slice(0, -2).join('_'); // weight_change, reps_change, exercise_change
    const exerciseId = parseInt(parts[parts.length - 1]);
    
    if (exerciseId && !isNaN(exerciseId)) {
      try {
        const newValues = JSON.parse(newValue || '{}');
        
        if (suggestionType === 'weight_change' && newValues.weight !== undefined) {
          // Atualizar carga do exercício
          await db.update(exercises).set({ weight: newValues.weight }).where(eq(exercises.id, exerciseId));
        } else if (suggestionType === 'reps_change' && newValues.reps !== undefined) {
          // Atualizar repetições do exercício
          await db.update(exercises).set({ reps: newValues.reps }).where(eq(exercises.id, exerciseId));
        } else if (suggestionType === 'exercise_change' && newValues.name !== undefined) {
          // Trocar exercício (atualizar nome)
          await db.update(exercises).set({ name: newValues.name }).where(eq(exercises.id, exerciseId));
        }
      } catch (e) {
        console.error('Erro ao aplicar alteração de treino:', e);
      }
    }
  }
  
  // Mark as approved
  await db.update(pendingChanges).set({
    status: 'approved',
    reviewedAt: new Date(),
    reviewNotes,
  }).where(eq(pendingChanges.id, id));
}

export async function rejectPendingChange(id: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pendingChanges).set({
    status: 'rejected',
    reviewedAt: new Date(),
    reviewNotes,
  }).where(eq(pendingChanges.id, id));
}

export async function countPendingChangesByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(pendingChanges)
    .where(and(
      eq(pendingChanges.personalId, personalId),
      eq(pendingChanges.status, 'pending')
    ));
  return result[0]?.count || 0;
}


// ==================== BATCH SESSION OPERATIONS ====================
export async function cancelFutureSessions(params: {
  personalId: number;
  studentId: number;
  fromDate?: Date;
  toDate?: Date;
  reason?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Build base conditions - cancelar sessões agendadas, confirmadas ou com falta
  const baseConditions = [
    eq(sessions.personalId, params.personalId),
    eq(sessions.studentId, params.studentId),
    inArray(sessions.status, ['scheduled', 'confirmed', 'no_show']),
    isNull(sessions.deletedAt),
  ];
  
  // Só adicionar filtro de data se fromDate foi informado
  if (params.fromDate) {
    baseConditions.push(gte(sessions.scheduledAt, params.fromDate));
  }
  
  if (params.toDate) {
    baseConditions.push(lte(sessions.scheduledAt, params.toDate));
  }
  
  const result = await db.update(sessions)
    .set({ 
      status: 'cancelled',
      cancelReason: params.reason || 'Cancelamento em lote',
    })
    .where(and(...baseConditions));
  
  // MySQL returns affectedRows in different ways depending on driver
  const affectedRows = (result as any)[0]?.affectedRows ?? (result as any).rowCount ?? (result as any).changes ?? 0;
  return affectedRows;
}

export async function deleteFutureSessions(params: {
  personalId: number;
  studentId: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(sessions.personalId, params.personalId),
    eq(sessions.studentId, params.studentId),
    // Excluir todas as sessões exceto as realizadas (completed)
    inArray(sessions.status, ['scheduled', 'confirmed', 'no_show', 'cancelled']),
    isNull(sessions.deletedAt),
  ];
  
  // Só adicionar filtro de data se fromDate foi informado
  if (params.fromDate) {
    conditions.push(gte(sessions.scheduledAt, params.fromDate));
  }
  
  if (params.toDate) {
    conditions.push(lte(sessions.scheduledAt, params.toDate));
  }
  
  // Soft delete - mover para lixeira
  const result = await db.update(sessions)
    .set({ deletedAt: new Date() })
    .where(and(...conditions));
  
  // MySQL returns affectedRows in different ways depending on driver
  const affectedRows = (result as any)[0]?.affectedRows ?? (result as any).rowCount ?? (result as any).changes ?? 0;
  return affectedRows;
}

// ==================== BATCH CHARGE OPERATIONS ====================
export async function cancelFutureCharges(params: {
  personalId: number;
  studentId: number;
  fromDate: Date;
  toDate?: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(charges.personalId, params.personalId),
    eq(charges.studentId, params.studentId),
    gte(charges.dueDate, params.fromDate),
    eq(charges.status, 'pending'),
  ];
  
  if (params.toDate) {
    conditions.push(lte(charges.dueDate, params.toDate));
  }
  
  const result = await db.update(charges)
    .set({ status: 'cancelled' })
    .where(and(...conditions));
  
  return result[0]?.affectedRows || 0;
}

export async function deleteFutureCharges(params: {
  personalId: number;
  studentId: number;
  fromDate: Date;
  toDate?: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(charges.personalId, params.personalId),
    eq(charges.studentId, params.studentId),
    gte(charges.dueDate, params.fromDate),
    eq(charges.status, 'pending'),
  ];
  
  if (params.toDate) {
    conditions.push(lte(charges.dueDate, params.toDate));
  }
  
  const result = await db.delete(charges)
    .where(and(...conditions));
  
  return result[0]?.affectedRows || 0;
}


// ==================== CHAT MESSAGE FUNCTIONS ====================
export async function getChatMessages(personalId: number, studentId: number, limit: number = 50, source: 'internal' | 'whatsapp' | 'all' = 'all') {
  const db = await getDb();
  if (!db) return [];
  
  // Construir condições de filtro
  const conditions = [
    eq(chatMessages.personalId, personalId),
    eq(chatMessages.studentId, studentId)
  ];
  
  // Filtrar por source se especificado
  if (source !== 'all') {
    conditions.push(eq(chatMessages.source, source));
  }
  
  return await db.select().from(chatMessages)
    .where(and(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
}

// Buscar mensagem por ID externo (para evitar duplicação de mensagens do WhatsApp)
export async function getChatMessageByExternalId(personalId: number, studentId: number, externalId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select()
    .from(chatMessages)
    .where(and(
      eq(chatMessages.personalId, personalId),
      eq(chatMessages.studentId, studentId),
      eq(chatMessages.externalId, externalId)
    ))
    .limit(1);
  return result[0] || null;
}

export async function markChatMessagesAsRead(personalId: number, studentId: number, senderType: 'personal' | 'student') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Marcar como lidas as mensagens do outro remetente
  const otherSender = senderType === 'personal' ? 'student' : 'personal';
  await db.update(chatMessages)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(chatMessages.personalId, personalId),
      eq(chatMessages.studentId, studentId),
      eq(chatMessages.senderType, otherSender),
      eq(chatMessages.isRead, false)
    ));
}

export async function getUnreadChatCount(personalId: number, studentId: number, senderType: 'personal' | 'student') {
  const db = await getDb();
  if (!db) return 0;
  // Contar mensagens não lidas do outro remetente
  const otherSender = senderType === 'personal' ? 'student' : 'personal';
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .where(and(
      eq(chatMessages.personalId, personalId),
      eq(chatMessages.studentId, studentId),
      eq(chatMessages.senderType, otherSender),
      eq(chatMessages.isRead, false)
    ));
  return result[0]?.count || 0;
}

export async function getAllUnreadChatCountForPersonal(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  // Retornar contagem de mensagens não lidas por aluno
  const result = await db.select({
    studentId: chatMessages.studentId,
    count: sql<number>`count(*)`
  })
    .from(chatMessages)
    .where(and(
      eq(chatMessages.personalId, personalId),
      eq(chatMessages.senderType, 'student'),
      eq(chatMessages.isRead, false)
    ))
    .groupBy(chatMessages.studentId);
  return result;
}

export async function getStudentsWithUnreadMessages(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar alunos com mensagens não lidas
  const unreadCounts = await getAllUnreadChatCountForPersonal(personalId);
  const studentIds = unreadCounts.map(u => u.studentId);
  
  if (studentIds.length === 0) return [];
  
  const studentsList = await db.select().from(students)
    .where(and(
      eq(students.personalId, personalId),
      inArray(students.id, studentIds)
    ));
  
  return studentsList.map(student => ({
    ...student,
    unreadCount: unreadCounts.find(u => u.studentId === student.id)?.count || 0
  }));
}


// ==================== CHAT MESSAGE EDIT/DELETE FUNCTIONS ====================
export async function editChatMessage(messageId: number, personalId: number, senderType: 'personal' | 'student', newMessage: string, studentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se a mensagem pertence ao remetente
  const conditions = [
    eq(chatMessages.id, messageId),
    eq(chatMessages.personalId, personalId),
    eq(chatMessages.senderType, senderType)
  ];
  
  // Para aluno, verificar também o studentId
  if (senderType === 'student' && studentId) {
    conditions.push(eq(chatMessages.studentId, studentId));
  }
  
  const message = await db.select().from(chatMessages)
    .where(and(...conditions))
    .limit(1);
  
  if (message.length === 0) {
    throw new Error("Mensagem não encontrada ou sem permissão");
  }
  
  // Salvar mensagem original antes de editar
  if (!message[0].originalMessage) {
    await db.update(chatMessages)
      .set({ originalMessage: message[0].message })
      .where(eq(chatMessages.id, messageId));
  }
  
  await db.update(chatMessages)
    .set({ 
      message: newMessage, 
      isEdited: true, 
      editedAt: new Date() 
    })
    .where(eq(chatMessages.id, messageId));
}

export async function deleteChatMessageForSender(messageId: number, personalId: number, senderType: 'personal' | 'student', studentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se a mensagem pertence ao remetente
  const conditions = [
    eq(chatMessages.id, messageId),
    eq(chatMessages.personalId, personalId),
    eq(chatMessages.senderType, senderType)
  ];
  
  // Para aluno, verificar também o studentId
  if (senderType === 'student' && studentId) {
    conditions.push(eq(chatMessages.studentId, studentId));
  }
  
  const message = await db.select().from(chatMessages)
    .where(and(...conditions))
    .limit(1);
  
  if (message.length === 0) {
    throw new Error("Mensagem não encontrada ou sem permissão");
  }
  
  await db.update(chatMessages)
    .set({ deletedForSender: true, deletedAt: new Date() })
    .where(eq(chatMessages.id, messageId));
}

export async function deleteChatMessageForAll(messageId: number, personalId: number, senderType: 'personal' | 'student', studentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se a mensagem pertence ao remetente
  const conditions = [
    eq(chatMessages.id, messageId),
    eq(chatMessages.personalId, personalId),
    eq(chatMessages.senderType, senderType)
  ];
  
  // Para aluno, verificar também o studentId
  if (senderType === 'student' && studentId) {
    conditions.push(eq(chatMessages.studentId, studentId));
  }
  
  const message = await db.select().from(chatMessages)
    .where(and(...conditions))
    .limit(1);
  
  if (message.length === 0) {
    throw new Error("Mensagem não encontrada ou sem permissão");
  }
  
  await db.update(chatMessages)
    .set({ deletedForAll: true, deletedAt: new Date() })
    .where(eq(chatMessages.id, messageId));
}

// Atualizar transcrição de áudio de uma mensagem
export async function updateChatMessageTranscription(messageId: number, transcription: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(chatMessages)
    .set({ audioTranscription: transcription })
    .where(eq(chatMessages.id, messageId));
}

// ==================== STUDENT BADGES FUNCTIONS ====================
export async function getStudentBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentBadges)
    .where(eq(studentBadges.studentId, studentId))
    .orderBy(desc(studentBadges.earnedAt));
}

export async function createStudentBadge(data: InsertStudentBadge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já tem esse badge
  const existing = await db.select().from(studentBadges)
    .where(and(
      eq(studentBadges.studentId, data.studentId),
      eq(studentBadges.badgeType, data.badgeType)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id; // Já tem o badge
  }
  
  const result = await db.insert(studentBadges).values(data);
  return result[0].insertId;
}

export async function checkAndAwardBadges(studentId: number, personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const newBadges: string[] = [];
  
  // Buscar dados do aluno
  const studentSessions = await db.select().from(sessions)
    .where(and(
      eq(sessions.studentId, studentId),
      eq(sessions.status, 'completed')
    ));
  
  const studentMeasurements = await db.select().from(measurements)
    .where(eq(measurements.studentId, studentId));
  
  const existingBadges = await getStudentBadges(studentId);
  const hasBadge = (type: string) => existingBadges.some(b => b.badgeType === type);
  
  // Primeira sessão
  if (studentSessions.length >= 1 && !hasBadge('first_session')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'first_session' });
    newBadges.push('first_session');
  }
  
  // 10 sessões
  if (studentSessions.length >= 10 && !hasBadge('sessions_10')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'sessions_10' });
    newBadges.push('sessions_10');
  }
  
  // 50 sessões
  if (studentSessions.length >= 50 && !hasBadge('sessions_50')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'sessions_50' });
    newBadges.push('sessions_50');
  }
  
  // 100 sessões
  if (studentSessions.length >= 100 && !hasBadge('sessions_100')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'sessions_100' });
    newBadges.push('sessions_100');
  }
  
  // Primeira medição
  if (studentMeasurements.length >= 1 && !hasBadge('first_measurement')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'first_measurement' });
    newBadges.push('first_measurement');
  }
  
  // Verificar perfil completo
  const anamnesis = await db.select().from(anamneses)
    .where(eq(anamneses.studentId, studentId))
    .limit(1);
  
  if (anamnesis.length > 0 && anamnesis[0].mainGoal && anamnesis[0].occupation && !hasBadge('profile_complete')) {
    await createStudentBadge({ studentId, personalId, badgeType: 'profile_complete' });
    newBadges.push('profile_complete');
  }
  
  // Verificar streak de 7 dias
  const recentSessions = studentSessions
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 7);
  
  if (recentSessions.length >= 7 && !hasBadge('streak_7')) {
    // Verificar se são consecutivas (dentro de 10 dias)
    const firstDate = new Date(recentSessions[recentSessions.length - 1].scheduledAt);
    const lastDate = new Date(recentSessions[0].scheduledAt);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 14) { // 7 sessões em 14 dias = consistente
      await createStudentBadge({ studentId, personalId, badgeType: 'streak_7' });
      newBadges.push('streak_7');
    }
  }
  
  return newBadges;
}

// Badge info helper
export const BADGE_INFO: Record<string, { name: string; description: string; icon: string; color: string }> = {
  first_session: { name: "Primeiro Passo", description: "Completou sua primeira sessão de treino", icon: "🎯", color: "emerald" },
  streak_7: { name: "Consistência", description: "7 sessões de treino consistentes", icon: "🔥", color: "orange" },
  streak_30: { name: "Dedicação", description: "30 dias de treino consistente", icon: "💪", color: "red" },
  streak_90: { name: "Lenda", description: "90 dias de treino consistente", icon: "🏆", color: "yellow" },
  perfect_month: { name: "Mês Perfeito", description: "Um mês inteiro sem faltas", icon: "⭐", color: "purple" },
  sessions_10: { name: "Aquecendo", description: "10 sessões realizadas", icon: "🌟", color: "blue" },
  sessions_50: { name: "Em Forma", description: "50 sessões realizadas", icon: "💎", color: "cyan" },
  sessions_100: { name: "Centurião", description: "100 sessões realizadas", icon: "👑", color: "gold" },
  first_measurement: { name: "Ponto de Partida", description: "Primeira avaliação física registrada", icon: "📏", color: "teal" },
  weight_goal: { name: "Meta Alcançada", description: "Atingiu sua meta de peso", icon: "🎉", color: "green" },
  body_fat_goal: { name: "Definição", description: "Atingiu sua meta de gordura corporal", icon: "💯", color: "pink" },
  muscle_gain: { name: "Hipertrofia", description: "Ganho significativo de massa muscular", icon: "💪", color: "red" },
  profile_complete: { name: "Perfil Completo", description: "Preencheu toda a anamnese", icon: "✅", color: "green" },
  early_bird: { name: "Madrugador", description: "5 treinos antes das 7h", icon: "🌅", color: "amber" },
  night_owl: { name: "Coruja", description: "5 treinos depois das 20h", icon: "🌙", color: "indigo" },
  weekend_warrior: { name: "Guerreiro de Fim de Semana", description: "10 treinos no fim de semana", icon: "⚔️", color: "slate" },
  anniversary_1: { name: "Aniversário", description: "1 ano de treino", icon: "🎂", color: "pink" },
  comeback: { name: "Retorno Triunfal", description: "Voltou após período de inatividade", icon: "🔄", color: "blue" },
};


// ==================== SESSION RANGE QUERY ====================
export async function getSessionsByPersonalIdAndDateRange(personalId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, startDate),
      lte(sessions.scheduledAt, endDate),
      not(eq(sessions.status, 'cancelled'))
    ))
    .orderBy(asc(sessions.scheduledAt));
}


// ==================== SESSION FEEDBACK FUNCTIONS ====================
export async function getSessionFeedback(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sessionFeedback)
    .where(eq(sessionFeedback.sessionId, sessionId))
    .limit(1);
  return result[0] || null;
}

export async function createSessionFeedback(data: InsertSessionFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe feedback para esta sessão
  const existing = await getSessionFeedback(data.sessionId);
  if (existing) {
    // Atualizar feedback existente
    await db.update(sessionFeedback)
      .set(data)
      .where(eq(sessionFeedback.id, existing.id));
    return existing.id;
  }
  
  const result = await db.insert(sessionFeedback).values(data);
  return result[0].insertId;
}

export async function getStudentFeedbacks(studentId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessionFeedback)
    .where(eq(sessionFeedback.studentId, studentId))
    .orderBy(desc(sessionFeedback.createdAt))
    .limit(limit);
}

export async function getSessionsNeedingFeedback(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar sessões completadas nos últimos 7 dias sem feedback
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const completedSessions = await db.select().from(sessions)
    .where(and(
      eq(sessions.studentId, studentId),
      eq(sessions.status, 'completed'),
      gte(sessions.scheduledAt, sevenDaysAgo),
      isNull(sessions.deletedAt)
    ))
    .orderBy(desc(sessions.scheduledAt));
  
  // Filtrar sessões que não têm feedback
  const sessionsWithoutFeedback = [];
  for (const session of completedSessions) {
    const feedback = await getSessionFeedback(session.id);
    if (!feedback) {
      sessionsWithoutFeedback.push(session);
    }
  }
  
  return sessionsWithoutFeedback;
}


// ==================== DIÁRIO DE TREINO DO MAROMBA ====================

// Listar registros de treino com filtros
export async function getWorkoutLogsByPersonalId(
  personalId: number, 
  filters?: { studentId?: number; startDate?: string; endDate?: string; limit?: number }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(workoutLogs.personalId, personalId)];
  
  if (filters?.studentId) {
    conditions.push(eq(workoutLogs.studentId, filters.studentId));
  }
  if (filters?.startDate) {
    conditions.push(gte(workoutLogs.trainingDate, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(workoutLogs.trainingDate, new Date(filters.endDate)));
  }
  
  const logs = await db.select().from(workoutLogs)
    .where(and(...conditions))
    .orderBy(desc(workoutLogs.trainingDate))
    .limit(filters?.limit || 50);
  
  // Buscar dados do aluno para cada log
  const logsWithStudent = await Promise.all(logs.map(async (log) => {
    const student = await db.select().from(students)
      .where(eq(students.id, log.studentId))
      .limit(1);
    return {
      ...log,
      student: student[0] || null,
    };
  }));
  
  return logsWithStudent;
}

// Obter registro de treino com todos os detalhes (exercícios e séries)
export async function getWorkoutLogWithDetails(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar log principal
  const logResult = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.id, id))
    .limit(1);
  
  if (!logResult[0]) return null;
  const log = logResult[0];
  
  // Buscar aluno
  const studentResult = await db.select().from(students)
    .where(eq(students.id, log.studentId))
    .limit(1);
  
  // Buscar exercícios
  const exercisesResult = await db.select().from(workoutLogExercises)
    .where(eq(workoutLogExercises.workoutLogId, id))
    .orderBy(asc(workoutLogExercises.orderIndex));
  
  // Buscar séries de cada exercício
  const exercisesWithSets = await Promise.all(exercisesResult.map(async (ex) => {
    const sets = await db.select().from(workoutLogSets)
      .where(eq(workoutLogSets.workoutLogExerciseId, ex.id))
      .orderBy(asc(workoutLogSets.setNumber));
    return {
      ...ex,
      sets,
    };
  }));
  
  return {
    ...log,
    student: studentResult[0] || null,
    exercises: exercisesWithSets,
  };
}

// Obter exercícios de um log
export async function getWorkoutLogExercises(workoutLogId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutLogExercises)
    .where(eq(workoutLogExercises.workoutLogId, workoutLogId))
    .orderBy(asc(workoutLogExercises.orderIndex));
}

// Criar exercício do log
export async function createWorkoutLogExercise(data: InsertWorkoutLogExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogExercises).values(data);
  return result[0].insertId;
}

// Atualizar exercício do log
export async function updateWorkoutLogExercise(id: number, data: Partial<InsertWorkoutLogExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutLogExercises).set(data).where(eq(workoutLogExercises.id, id));
}

// Excluir exercício do log
export async function deleteWorkoutLogExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Excluir séries primeiro
  await db.delete(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, id));
  // Excluir exercício
  await db.delete(workoutLogExercises).where(eq(workoutLogExercises.id, id));
}

// Excluir todos os exercícios de um workout log
export async function deleteExerciseLogsByWorkoutLogId(workoutLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Primeiro buscar todos os exercícios do log
  const exercises = await db.select().from(workoutLogExercises).where(eq(workoutLogExercises.workoutLogId, workoutLogId));
  // Excluir séries de cada exercício
  for (const ex of exercises) {
    await db.delete(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
  }
  // Excluir todos os exercícios
  await db.delete(workoutLogExercises).where(eq(workoutLogExercises.workoutLogId, workoutLogId));
}

// Criar série do exercício
export async function createWorkoutLogSet(data: InsertWorkoutLogSet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogSets).values(data);
  return result[0].insertId;
}

// Atualizar série
export async function updateWorkoutLogSet(id: number, data: Partial<InsertWorkoutLogSet>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutLogSets).set(data).where(eq(workoutLogSets.id, id));
}

// Excluir série
export async function deleteWorkoutLogSet(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workoutLogSets).where(eq(workoutLogSets.id, id));
}

// Calcular estatísticas do treino
export async function calculateWorkoutLogStats(workoutLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todos os exercícios e séries
  const exercises = await getWorkoutLogExercises(workoutLogId);
  
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalExercises = exercises.length;
  
  for (const ex of exercises) {
    // Buscar TODAS as séries do exercício (não apenas isCompleted)
    const allSets = await db.select().from(workoutLogSets)
      .where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
    
    // Filtrar séries que têm peso E reps preenchidos (considera como "feita")
    const completedSets = allSets.filter(s => {
      const weight = parseFloat(s.weight?.toString() || '0');
      const reps = s.reps || 0;
      return weight > 0 && reps > 0;
    });
    
    for (const set of completedSets) {
      totalSets++;
      totalReps += set.reps || 0;
      const weight = parseFloat(set.weight?.toString() || '0');
      totalVolume += weight * (set.reps || 0);
      
      // Adicionar drop set se houver
      if (set.isDropSet && set.dropWeight && set.dropReps) {
        totalReps += set.dropReps;
        totalVolume += parseFloat(set.dropWeight.toString()) * set.dropReps;
      }
      
      // Adicionar rest-pause se houver
      if (set.isRestPause && set.restPauseWeight && set.restPauseReps) {
        totalReps += set.restPauseReps;
        totalVolume += parseFloat(set.restPauseWeight.toString()) * set.restPauseReps;
      }
    }
    
    // Atualizar estatísticas do exercício
    const exSets = completedSets.length;
    const exReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const exVolume = completedSets.reduce((sum, s) => {
      const w = parseFloat(s.weight?.toString() || '0');
      return sum + w * (s.reps || 0);
    }, 0);
    const maxWeight = completedSets.length > 0 
      ? Math.max(...completedSets.map(s => parseFloat(s.weight?.toString() || '0')))
      : 0;
    
    await updateWorkoutLogExercise(ex.id, {
      completedSets: exSets,
      totalReps: exReps,
      totalVolume: exVolume.toFixed(2),
      maxWeight: maxWeight > 0 ? maxWeight.toFixed(2) : null,
      isCompleted: exSets > 0,
    });
  }
  
  return { totalSets, totalReps, totalVolume, totalExercises };
}

// Dashboard de evolução
export async function getTrainingDashboard(
  personalId: number,
  filters?: { studentId?: number; startDate?: string; endDate?: string }
) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [
    eq(workoutLogs.personalId, personalId),
    eq(workoutLogs.status, 'completed'),
  ];
  
  if (filters?.studentId) {
    conditions.push(eq(workoutLogs.studentId, filters.studentId));
  }
  if (filters?.startDate) {
    conditions.push(gte(workoutLogs.trainingDate, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(workoutLogs.trainingDate, new Date(filters.endDate)));
  }
  
  // Buscar logs completados
  const logs = await db.select().from(workoutLogs)
    .where(and(...conditions))
    .orderBy(desc(workoutLogs.trainingDate));
  
  // Calcular totais
  const totalWorkouts = logs.length;
  const totalSets = logs.reduce((sum, l) => sum + (l.totalSets || 0), 0);
  const totalReps = logs.reduce((sum, l) => sum + (l.totalReps || 0), 0);
  const totalVolume = logs.reduce((sum, l) => sum + parseFloat(l.totalVolume?.toString() || '0'), 0);
  const totalExercises = logs.reduce((sum, l) => sum + (l.totalExercises || 0), 0);
  
  // Média de duração
  const avgDuration = logs.length > 0 
    ? logs.reduce((sum, l) => sum + (l.totalDuration || 0), 0) / logs.length 
    : 0;
  
  // Distribuição de sentimento
  const feelingDistribution = {
    great: logs.filter(l => l.feeling === 'great').length,
    good: logs.filter(l => l.feeling === 'good').length,
    normal: logs.filter(l => l.feeling === 'normal').length,
    tired: logs.filter(l => l.feeling === 'tired').length,
    exhausted: logs.filter(l => l.feeling === 'exhausted').length,
  };
  
  // Treinos por mês (últimos 6 meses)
  const workoutsByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthLogs = logs.filter(l => {
      const d = new Date(l.trainingDate);
      return d >= monthStart && d <= monthEnd;
    });
    workoutsByMonth.push({
      month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      count: monthLogs.length,
    });
  }
  
  // Volume por mês (últimos 6 meses)
  const volumeByMonth: { month: string; volume: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthLogs = logs.filter(l => {
      const d = new Date(l.trainingDate);
      return d >= monthStart && d <= monthEnd;
    });
    const monthVolume = monthLogs.reduce((sum, l) => sum + parseFloat(l.totalVolume?.toString() || '0'), 0);
    volumeByMonth.push({
      month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      volume: Math.round(monthVolume),
    });
  }
  
  return {
    totalWorkouts,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    totalExercises,
    avgDuration: Math.round(avgDuration),
    feelingDistribution,
    workoutsByMonth,
    volumeByMonth,
    recentLogs: logs.slice(0, 10),
  };
}

// Análise por grupo muscular
export async function getMuscleGroupAnalysis(
  personalId: number,
  filters?: { studentId?: number; startDate?: string; endDate?: string }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(workoutLogs.personalId, personalId),
    eq(workoutLogs.status, 'completed'),
  ];
  
  if (filters?.studentId) {
    conditions.push(eq(workoutLogs.studentId, filters.studentId));
  }
  if (filters?.startDate) {
    conditions.push(gte(workoutLogs.trainingDate, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(workoutLogs.trainingDate, new Date(filters.endDate)));
  }
  
  // Buscar todos os exercícios dos logs completados
  const logIds = await db.select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(and(...conditions));
  
  if (logIds.length === 0) return [];
  
  const exercises = await db.select({
    muscleGroup: workoutLogExercises.muscleGroup,
    totalVolume: workoutLogExercises.totalVolume,
    completedSets: workoutLogExercises.completedSets,
    totalReps: workoutLogExercises.totalReps,
  })
    .from(workoutLogExercises)
    .where(inArray(workoutLogExercises.workoutLogId, logIds.map(l => l.id)));
  
  // Normalizar nomes de grupos musculares
  const normalizeGroup = (group: string | null): string => {
    if (!group) return 'Outros';
    const g = group.toLowerCase().trim();
    
    // Quadríceps - NÃO mapear "pernas" automaticamente para evitar duplicação
    if (g.includes('quadríceps') || g.includes('quadriceps')) {
      return 'Quadríceps';
    }
    
    // Pernas (genérico) - manter como categoria separada
    if (g === 'pernas') {
      return 'Pernas';
    }
    
    // Glúteos
    if (g.includes('glúteo') || g.includes('gluteo')) {
      return 'Glúteos';
    }
    
    // Posteriores da coxa / Isquiotibiais
    if (g.includes('posterior') || g.includes('isquiotibiai')) {
      return 'Posteriores da Coxa';
    }
    
    // Panturrilha
    if (g.includes('panturrilha')) {
      return 'Panturrilha';
    }
    
    // Peito
    if (g.includes('peito') || g.includes('peitoral')) {
      return 'Peito';
    }
    
    // Costas
    if (g.includes('costa') || g.includes('dorsal') || g.includes('latíssimo')) {
      return 'Costas';
    }
    
    // Ombros
    if (g.includes('ombro') || g.includes('deltóide') || g.includes('deltoide')) {
      return 'Ombros';
    }
    
    // Bíceps
    if (g.includes('bíceps') || g.includes('biceps')) {
      return 'Bíceps';
    }
    
    // Tríceps
    if (g.includes('tríceps') || g.includes('triceps')) {
      return 'Tríceps';
    }
    
    // Abdômen / Core
    if (g.includes('abdômen') || g.includes('abdomen') || g.includes('core') || g.includes('abdominal')) {
      return 'Abdômen';
    }
    
    // Antebraço
    if (g.includes('antebraço') || g.includes('antebraco')) {
      return 'Antebraço';
    }
    
    // Trapézio
    if (g.includes('trapézio') || g.includes('trapezio')) {
      return 'Trapézio';
    }
    
    // Lombar
    if (g.includes('lombar')) {
      return 'Lombar';
    }
    
    // Retornar o grupo original com primeira letra maiúscula
    return group.charAt(0).toUpperCase() + group.slice(1);
  };
  
  // Agrupar por grupo muscular - sem duplicação
  // Cada exercício conta apenas para o grupo que foi especificamente selecionado
  const muscleGroups: Record<string, { volume: number; sets: number; reps: number; count: number }> = {};
  
  for (const ex of exercises) {
    // Normalizar o grupo muscular - sem dividir em múltiplos grupos
    const group = normalizeGroup(ex.muscleGroup);
    const volume = parseFloat(ex.totalVolume?.toString() || '0');
    const sets = ex.completedSets || 0;
    const reps = ex.totalReps || 0;
    
    if (!muscleGroups[group]) {
      muscleGroups[group] = { volume: 0, sets: 0, reps: 0, count: 0 };
    }
    muscleGroups[group].volume += volume;
    muscleGroups[group].sets += sets;
    muscleGroups[group].reps += reps;
    muscleGroups[group].count += 1;
  }
  
  // Converter para array e ordenar por volume
  const result = Object.entries(muscleGroups)
    .map(([name, data]) => ({
      name,
      volume: Math.round(data.volume),
      sets: data.sets,
      reps: data.reps,
      exercises: data.count,
    }))
    .sort((a, b) => b.volume - a.volume);
  
  return result;
}

// Histórico de evolução de um exercício específico
export async function getExerciseProgressHistory(
  personalId: number,
  studentId: number | undefined,
  exerciseName: string,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar exercícios do aluno (ou todos os alunos) com esse nome
  const conditions = [
    eq(workoutLogs.personalId, personalId),
    like(workoutLogExercises.exerciseName, `%${exerciseName}%`),
    eq(workoutLogs.status, 'completed')
  ];
  
  // Se studentId for fornecido, filtrar por aluno específico
  if (studentId) {
    conditions.push(eq(workoutLogs.studentId, studentId));
  }
  
  const exerciseHistory = await db.select({
    exercise: workoutLogExercises,
    log: workoutLogs,
  }).from(workoutLogExercises)
    .innerJoin(workoutLogs, eq(workoutLogExercises.workoutLogId, workoutLogs.id))
    .where(and(...conditions))
    .orderBy(desc(workoutLogs.trainingDate))
    .limit(limit);
  
  // Buscar séries de cada exercício
  const historyWithSets = await Promise.all(exerciseHistory.map(async (item) => {
    const sets = await db.select().from(workoutLogSets)
      .where(eq(workoutLogSets.workoutLogExerciseId, item.exercise.id))
      .orderBy(asc(workoutLogSets.setNumber));
    
    // Calcular carga máxima e volume
    const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight?.toString() || '0')));
    const totalVolume = sets.reduce((sum, s) => {
      const w = parseFloat(s.weight?.toString() || '0');
      return sum + w * (s.reps || 0);
    }, 0);
    
    return {
      date: item.log.trainingDate,
      exerciseName: item.exercise.exerciseName,
      maxWeight,
      totalVolume,
      totalSets: sets.length,
      totalReps: sets.reduce((sum, s) => sum + (s.reps || 0), 0),
      sets,
    };
  }));
  
  return historyWithSets;
}

// Buscar todos os exercícios únicos do aluno (para lista de evolução)
export async function getUniqueExerciseNames(
  personalId: number,
  studentId?: number
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(workoutLogs.personalId, personalId),
    eq(workoutLogs.status, 'completed')
  ];
  
  if (studentId) {
    conditions.push(eq(workoutLogs.studentId, studentId));
  }
  
  // Buscar todos os nomes de exercícios únicos
  const exercises = await db.selectDistinct({
    exerciseName: workoutLogExercises.exerciseName,
  }).from(workoutLogExercises)
    .innerJoin(workoutLogs, eq(workoutLogExercises.workoutLogId, workoutLogs.id))
    .where(and(...conditions))
    .orderBy(asc(workoutLogExercises.exerciseName));
  
  return exercises.map(e => e.exerciseName).filter(Boolean);
}

// ==================== SUGESTÕES DE AJUSTE DO ALUNO ====================

// Listar sugestões
export async function getWorkoutLogSuggestions(
  personalId: number,
  filters?: { studentId?: number; status?: 'pending' | 'approved' | 'rejected' }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(workoutLogSuggestions.personalId, personalId)];
  
  if (filters?.studentId) {
    conditions.push(eq(workoutLogSuggestions.studentId, filters.studentId));
  }
  if (filters?.status) {
    conditions.push(eq(workoutLogSuggestions.status, filters.status));
  }
  
  const suggestions = await db.select().from(workoutLogSuggestions)
    .where(and(...conditions))
    .orderBy(desc(workoutLogSuggestions.createdAt));
  
  // Buscar dados do aluno
  const suggestionsWithStudent = await Promise.all(suggestions.map(async (s) => {
    const student = await db.select().from(students)
      .where(eq(students.id, s.studentId))
      .limit(1);
    return {
      ...s,
      student: student[0] || null,
    };
  }));
  
  return suggestionsWithStudent;
}

// Criar sugestão
export async function createWorkoutLogSuggestion(data: InsertWorkoutLogSuggestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workoutLogSuggestions).values(data);
  
  // Marcar o log como tendo sugestões pendentes
  if (data.workoutLogId) {
    await db.update(workoutLogs)
      .set({ hasPendingSuggestions: true })
      .where(eq(workoutLogs.id, data.workoutLogId));
  }
  
  return result[0].insertId;
}

// Aprovar sugestão
export async function approveWorkoutLogSuggestion(id: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a sugestão
  const suggestionResult = await db.select().from(workoutLogSuggestions)
    .where(eq(workoutLogSuggestions.id, id))
    .limit(1);
  
  if (!suggestionResult[0]) throw new Error("Sugestão não encontrada");
  const suggestion = suggestionResult[0];
  
  // Aplicar a alteração conforme o tipo
  if (suggestion.suggestionType === 'weight_change' && suggestion.workoutLogSetId) {
    const newValues = JSON.parse(suggestion.suggestedValue || '{}');
    await updateWorkoutLogSet(suggestion.workoutLogSetId, { weight: newValues.weight });
  } else if (suggestion.suggestionType === 'reps_change' && suggestion.workoutLogSetId) {
    const newValues = JSON.parse(suggestion.suggestedValue || '{}');
    await updateWorkoutLogSet(suggestion.workoutLogSetId, { reps: newValues.reps });
  }
  
  // Marcar como aprovada
  await db.update(workoutLogSuggestions).set({
    status: 'approved',
    reviewedAt: new Date(),
    reviewNotes,
  }).where(eq(workoutLogSuggestions.id, id));
  
  // Verificar se ainda há sugestões pendentes
  const pendingSuggestions = await db.select().from(workoutLogSuggestions)
    .where(and(
      eq(workoutLogSuggestions.workoutLogId, suggestion.workoutLogId),
      eq(workoutLogSuggestions.status, 'pending')
    ));
  
  if (pendingSuggestions.length === 0 && suggestion.workoutLogId) {
    await db.update(workoutLogs)
      .set({ hasPendingSuggestions: false })
      .where(eq(workoutLogs.id, suggestion.workoutLogId));
  }
}

// Rejeitar sugestão
export async function rejectWorkoutLogSuggestion(id: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a sugestão
  const suggestionResult = await db.select().from(workoutLogSuggestions)
    .where(eq(workoutLogSuggestions.id, id))
    .limit(1);
  
  if (!suggestionResult[0]) throw new Error("Sugestão não encontrada");
  const suggestion = suggestionResult[0];
  
  // Marcar como rejeitada
  await db.update(workoutLogSuggestions).set({
    status: 'rejected',
    reviewedAt: new Date(),
    reviewNotes,
  }).where(eq(workoutLogSuggestions.id, id));
  
  // Verificar se ainda há sugestões pendentes
  const pendingSuggestions = await db.select().from(workoutLogSuggestions)
    .where(and(
      eq(workoutLogSuggestions.workoutLogId, suggestion.workoutLogId),
      eq(workoutLogSuggestions.status, 'pending')
    ));
  
  if (pendingSuggestions.length === 0 && suggestion.workoutLogId) {
    await db.update(workoutLogs)
      .set({ hasPendingSuggestions: false })
      .where(eq(workoutLogs.id, suggestion.workoutLogId));
  }
}


// ==================== PASSWORD RESET ====================

// Salvar código de reset de senha
export async function savePasswordResetCode(studentId: number, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Usar o campo notes temporariamente para armazenar o código
  // Formato: RESET:código:timestamp_expiracao
  const resetData = `RESET:${code}:${expiresAt.getTime()}`;
  
  // Buscar notes atual para preservar
  const student = await db.select({ notes: students.notes }).from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  
  const currentNotes = student[0]?.notes || '';
  // Remover código anterior se existir
  const cleanNotes = currentNotes.replace(/\nRESET:[^:]+:\d+$/, '').replace(/^RESET:[^:]+:\d+\n?/, '');
  const newNotes = cleanNotes ? `${cleanNotes}\n${resetData}` : resetData;
  
  await db.update(students).set({ notes: newNotes }).where(eq(students.id, studentId));
}

// Verificar código de reset de senha
export async function verifyPasswordResetCode(studentId: number, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const student = await db.select({ notes: students.notes }).from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  
  const notes = student[0]?.notes || '';
  const match = notes.match(/RESET:(\d{6}):(\d+)/);
  
  if (!match) return false;
  
  const [, savedCode, expiresAt] = match;
  const now = Date.now();
  
  // Verificar se o código é válido e não expirou
  return savedCode === code && parseInt(expiresAt) > now;
}

// Limpar código de reset de senha
export async function clearPasswordResetCode(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const student = await db.select({ notes: students.notes }).from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  
  const currentNotes = student[0]?.notes || '';
  const cleanNotes = currentNotes.replace(/\nRESET:[^:]+:\d+$/, '').replace(/^RESET:[^:]+:\d+\n?/, '');
  
  await db.update(students).set({ notes: cleanNotes || null }).where(eq(students.id, studentId));
}

// Atualizar senha do aluno
export async function updateStudentPassword(studentId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(students).set({ passwordHash }).where(eq(students.id, studentId));
}


// ==================== STUDENT PORTAL DASHBOARD ====================

// Dashboard de treinos do aluno
export async function getStudentTrainingDashboard(studentId: number, filters?: { startDate?: string; endDate?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todos os logs do aluno
  let allLogs = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.studentId, studentId))
    .orderBy(desc(workoutLogs.trainingDate));
  
  // Filtrar por data se necessário
  let logs = allLogs;
  if (filters?.startDate) {
    const startDate = new Date(filters.startDate);
    logs = logs.filter(log => new Date(log.trainingDate) >= startDate);
  }
  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);
    logs = logs.filter(log => new Date(log.trainingDate) <= endDate);
  }
  
  // Calcular estatísticas
  const totalWorkouts = logs.length;
  
  // Buscar séries para calcular volume
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  
  for (const log of logs) {
    const logExercises = await db.select().from(workoutLogExercises).where(eq(workoutLogExercises.workoutLogId, log.id));
    for (const ex of logExercises) {
      const sets = await db.select().from(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
      for (const set of sets) {
        totalSets++;
        const weight = parseFloat(set.weight || '0');
        const reps = set.reps || 0;
        totalReps += reps;
        totalVolume += weight * reps;
      }
    }
  }
  
  // Treinos por mês (últimos 6 meses)
  const workoutsByMonth: { month: string; count: number }[] = [];
  const volumeByMonth: { month: string; volume: number }[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' });
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.trainingDate);
      return logDate.getFullYear() === date.getFullYear() && logDate.getMonth() === date.getMonth();
    });
    workoutsByMonth.push({ month: monthStr, count: monthLogs.length });
    
    // Calcular volume do mês
    let monthVolume = 0;
    for (const log of monthLogs) {
      const logExercises = await db.select().from(workoutLogExercises).where(eq(workoutLogExercises.workoutLogId, log.id));
      for (const ex of logExercises) {
        const sets = await db.select().from(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
        for (const set of sets) {
          const weight = parseFloat(set.weight || '0');
          const reps = set.reps || 0;
          monthVolume += weight * reps;
        }
      }
    }
    volumeByMonth.push({ month: monthStr, volume: Math.round(monthVolume) });
  }
  
  // Distribuição de sentimento
  const feelingDistribution: Record<string, number> = {};
  for (const log of logs) {
    if (log.feeling) {
      feelingDistribution[log.feeling] = (feelingDistribution[log.feeling] || 0) + 1;
    }
  }
  
  return {
    totalWorkouts,
    totalVolume: Math.round(totalVolume),
    totalSets,
    totalReps,
    workoutsByMonth,
    volumeByMonth,
    feelingDistribution,
  };
}

// Análise por grupo muscular do aluno
export async function getStudentMuscleGroupAnalysis(studentId: number, filters?: { startDate?: string; endDate?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar logs do aluno
  let logs = await db.select().from(workoutLogs).where(eq(workoutLogs.studentId, studentId));
  
  if (filters?.startDate) {
    const startDate = new Date(filters.startDate);
    logs = logs.filter(log => new Date(log.trainingDate) >= startDate);
  }
  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);
    logs = logs.filter(log => new Date(log.trainingDate) <= endDate);
  }
  
  // Agrupar por grupo muscular
  const muscleGroups: Record<string, { volume: number; sets: number; exercises: Set<string> }> = {};
  
  for (const log of logs) {
    const logExercises = await db.select().from(workoutLogExercises).where(eq(workoutLogExercises.workoutLogId, log.id));
    
    for (const ex of logExercises) {
      const group = ex.muscleGroup || 'Outros';
      if (!muscleGroups[group]) {
        muscleGroups[group] = { volume: 0, sets: 0, exercises: new Set() };
      }
      
      muscleGroups[group].exercises.add(ex.exerciseName);
      
      const sets = await db.select().from(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
      for (const set of sets) {
        muscleGroups[group].sets++;
        const weight = parseFloat(set.weight || '0');
        const reps = set.reps || 0;
        muscleGroups[group].volume += weight * reps;
      }
    }
  }
  
  // Converter para array ordenado por volume
  return Object.entries(muscleGroups)
    .map(([name, data]) => ({
      name,
      volume: Math.round(data.volume),
      sets: data.sets,
      exercises: data.exercises.size,
    }))
    .sort((a, b) => b.volume - a.volume);
}

// Evolução de carga por exercício do aluno
export async function getStudentExerciseProgress(studentId: number, exerciseName: string, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar logs do aluno
  const logs = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.studentId, studentId))
    .orderBy(desc(workoutLogs.trainingDate));
  
  const progress: { date: string; maxWeight: number; totalVolume: number; sets: number; reps: number }[] = [];
  
  for (const log of logs) {
    const logExercises = await db.select().from(workoutLogExercises)
      .where(and(
        eq(workoutLogExercises.workoutLogId, log.id),
        eq(workoutLogExercises.exerciseName, exerciseName)
      ));
    
    for (const ex of logExercises) {
      const sets = await db.select().from(workoutLogSets).where(eq(workoutLogSets.workoutLogExerciseId, ex.id));
      
      if (sets.length > 0) {
        let maxWeight = 0;
        let totalVolume = 0;
        let totalReps = 0;
        
        for (const set of sets) {
          const weight = parseFloat(set.weight || '0');
          const reps = set.reps || 0;
          maxWeight = Math.max(maxWeight, weight);
          totalVolume += weight * reps;
          totalReps += reps;
        }
        
        progress.push({
          date: log.trainingDate instanceof Date ? log.trainingDate.toISOString().split('T')[0] : String(log.trainingDate),
          maxWeight,
          totalVolume: Math.round(totalVolume),
          sets: sets.length,
          reps: totalReps,
        });
      }
    }
    
    if (progress.length >= limit) break;
  }
  
  return progress.reverse(); // Ordenar do mais antigo para o mais recente
}

// Listar exercícios únicos do aluno
export async function getStudentUniqueExercises(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar logs do aluno
  const logs = await db.select({ id: workoutLogs.id }).from(workoutLogs)
    .where(eq(workoutLogs.studentId, studentId));
  
  const exerciseNames = new Set<string>();
  
  for (const log of logs) {
    const logExercises = await db.select({ name: workoutLogExercises.exerciseName })
      .from(workoutLogExercises)
      .where(eq(workoutLogExercises.workoutLogId, log.id));
    
    for (const ex of logExercises) {
      if (ex.name) {
        exerciseNames.add(ex.name);
      }
    }
  }
  
  return Array.from(exerciseNames).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}


// Obter séries de um exercício log
export async function getSetLogsByExerciseLogId(exerciseLogId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutLogSets)
    .where(eq(workoutLogSets.workoutLogExerciseId, exerciseLogId))
    .orderBy(asc(workoutLogSets.setNumber));
}

// Atualizar lastAnalyzedAt do aluno
export async function updateStudentLastAnalyzedAt(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(students).set({ lastAnalyzedAt: new Date() }).where(eq(students.id, studentId));
}


// ==================== CAKTO INTEGRATION FUNCTIONS ====================

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function updateUserSubscription(userId: number, data: {
  status?: "active" | "canceled" | "expired";
  caktoOrderId?: string;
  caktoSubscriptionId?: string;
  paidAt?: Date;
  canceledAt?: Date;
  renewedAt?: Date;
  amount?: number;
}) {
  const db = await getDb();
  if (!db) return;
  
  // Get the personal associated with this user
  const personal = await getPersonalByUserId(userId);
  if (!personal) {
    console.log("[Cakto] No personal found for user:", userId);
    return;
  }
  
  // Update the personal's subscription status
  const updateData: Record<string, unknown> = {};
  
  if (data.status === "active") {
    updateData.subscriptionStatus = "active";
    // Set expiration to 30 days from now (or renewal date)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    updateData.subscriptionExpiresAt = expiresAt;
  } else if (data.status === "canceled") {
    updateData.subscriptionStatus = "cancelled";
  } else if (data.status === "expired") {
    updateData.subscriptionStatus = "expired";
  }
  
  await db.update(personals).set(updateData).where(eq(personals.id, personal.id));
  console.log("[Cakto] Updated subscription for personal:", personal.id, updateData);
}

// Funções de pending activation movidas para o final do arquivo


// ==================== SUPPORT CHAT FUNCTIONS ====================
export async function createSupportConversation(data: InsertChatConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatConversations).values(data);
  return result[0].insertId;
}

export async function getSupportConversationByVisitorId(visitorId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations)
    .where(eq(chatConversations.visitorId, visitorId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSupportConversations(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatConversations)
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit);
}

export async function getSupportConversationById(conversationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSupportConversation(conversationId: number, data: Partial<InsertChatConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatConversations)
    .set(data)
    .where(eq(chatConversations.id, conversationId));
}

export async function createSupportMessage(data: InsertChatSupportMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSupportMessages).values(data);
  return result[0].insertId;
}

export async function getSupportMessages(conversationId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatSupportMessages)
    .where(eq(chatSupportMessages.conversationId, conversationId))
    .orderBy(asc(chatSupportMessages.createdAt))
    .limit(limit);
}

export async function markSupportMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatSupportMessages)
    .set({ readAt: new Date() })
    .where(eq(chatSupportMessages.id, messageId));
}

export async function getUnreadSupportMessagesCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(chatSupportMessages)
    .where(isNull(chatSupportMessages.readAt));
  return result[0]?.count || 0;
}

export async function getSupportConversationsWithUnreadMessages() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    conversation: chatConversations,
    unreadCount: sql<number>`count(${chatSupportMessages.id})`
  })
    .from(chatConversations)
    .leftJoin(chatSupportMessages, eq(chatConversations.id, chatSupportMessages.conversationId))
    .where(isNull(chatSupportMessages.readAt))
    .groupBy(chatConversations.id)
    .orderBy(desc(chatConversations.updatedAt));
  
  return result;
}


// ==================== PERSONAL SUBSCRIPTIONS ====================

export async function getPersonalSubscription(personalId: number): Promise<PersonalSubscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(personalSubscriptions)
    .where(eq(personalSubscriptions.personalId, personalId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createPersonalSubscription(data: InsertPersonalSubscription): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(personalSubscriptions).values(data);
  return result[0].insertId as number;
}

export async function updatePersonalSubscriptionFull(
  personalId: number,
  data: {
    planId?: string;
    planName?: string;
    studentLimit?: number;
    planPrice?: string;
    extraStudentPrice?: string;
    status?: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(personalSubscriptions)
    .set(data)
    .where(eq(personalSubscriptions.personalId, personalId));
}

export async function updatePersonalSubscriptionExtra(
  personalId: number,
  data: {
    accumulatedExtraCharge?: string;
    accumulatedExtraStudents?: number;
    lastAccumulationReset?: Date;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(personalSubscriptions)
    .set(data)
    .where(eq(personalSubscriptions.personalId, personalId));
}

export async function logSubscriptionUsage(data: InsertSubscriptionUsageLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(subscriptionUsageLogs).values(data);
}

export async function getSubscriptionUsageLogs(
  personalId: number,
  limit: number = 50
): Promise<SubscriptionUsageLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(subscriptionUsageLogs)
    .where(eq(subscriptionUsageLogs.personalId, personalId))
    .orderBy(desc(subscriptionUsageLogs.createdAt))
    .limit(limit);
}

// Função para admin - busca todos os logs sem filtrar por personalId
export async function getAllSubscriptionUsageLogs(
  limit: number = 1000
): Promise<SubscriptionUsageLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(subscriptionUsageLogs)
    .orderBy(desc(subscriptionUsageLogs.createdAt))
    .limit(limit);
}

export async function getActiveStudentsCount(personalId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(
      and(
        eq(students.personalId, personalId),
        eq(students.status, 'active'),
        isNull(students.deletedAt)
      )
    );
  
  return result[0]?.count || 0;
}


// ==================== SITE PAGES ====================

// Site Pages CRUD
export async function getAllSitePages(): Promise<SitePage[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(sitePages)
    .orderBy(desc(sitePages.updatedAt));
}

export async function getSitePageById(id: number): Promise<SitePage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(sitePages)
    .where(eq(sitePages.id, id))
    .limit(1);
  
  return result[0];
}

export async function getSitePageBySlug(slug: string): Promise<SitePage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(sitePages)
    .where(eq(sitePages.slug, slug))
    .limit(1);
  
  return result[0];
}

export async function createSitePage(data: InsertSitePage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sitePages).values(data);
  return result[0].insertId as number;
}

export async function updateSitePage(id: number, data: Partial<InsertSitePage>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sitePages)
    .set(data)
    .where(eq(sitePages.id, id));
}

export async function deleteSitePage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related records first
  await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));
  await db.delete(pageVersions).where(eq(pageVersions.pageId, id));
  await db.delete(pageAnalytics).where(eq(pageAnalytics.pageId, id));
  await db.delete(pageAssets).where(eq(pageAssets.pageId, id));
  
  // Delete the page
  await db.delete(sitePages).where(eq(sitePages.id, id));
}

export async function duplicateSitePage(id: number, newName: string, newSlug: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const original = await getSitePageById(id);
  if (!original) throw new Error("Page not found");
  
  const newPage: InsertSitePage = {
    name: newName,
    slug: newSlug,
    status: 'draft',
    blocks: original.blocks,
    metaTitle: original.metaTitle,
    metaDescription: original.metaDescription,
    ogImage: original.ogImage,
    template: original.template,
    settings: original.settings,
  };
  
  return await createSitePage(newPage);
}

// Page Versions
export async function createPageVersion(data: InsertPageVersion): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pageVersions).values(data);
  return result[0].insertId as number;
}

export async function getPageVersions(pageId: number): Promise<PageVersion[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(pageVersions)
    .where(eq(pageVersions.pageId, pageId))
    .orderBy(desc(pageVersions.versionNumber));
}

export async function getLatestVersionNumber(pageId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ maxVersion: sql<number>`MAX(${pageVersions.versionNumber})` })
    .from(pageVersions)
    .where(eq(pageVersions.pageId, pageId));
  
  return result[0]?.maxVersion || 0;
}

export async function rollbackToVersion(pageId: number, versionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const version = await db.select()
    .from(pageVersions)
    .where(eq(pageVersions.id, versionId))
    .limit(1);
  
  if (!version[0]) throw new Error("Version not found");
  
  await db.update(sitePages)
    .set({
      blocks: version[0].blocks,
      settings: version[0].settings,
    })
    .where(eq(sitePages.id, pageId));
}

// Page Blocks
export async function getPageBlocks(pageId: number): Promise<PageBlock[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(pageBlocks.order);
}

export async function createPageBlock(data: InsertPageBlock): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pageBlocks).values(data);
  return result[0].insertId as number;
}

export async function updatePageBlock(id: number, data: Partial<InsertPageBlock>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pageBlocks)
    .set(data)
    .where(eq(pageBlocks.id, id));
}

export async function deletePageBlock(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(pageBlocks).where(eq(pageBlocks.id, id));
}

export async function reorderPageBlocks(pageId: number, blockIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (let i = 0; i < blockIds.length; i++) {
    await db.update(pageBlocks)
      .set({ order: i })
      .where(and(eq(pageBlocks.id, blockIds[i]), eq(pageBlocks.pageId, pageId)));
  }
}

// Page Assets
export async function getPageAssets(pageId?: number): Promise<PageAsset[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (pageId) {
    return await db.select()
      .from(pageAssets)
      .where(eq(pageAssets.pageId, pageId))
      .orderBy(desc(pageAssets.createdAt));
  }
  
  return await db.select()
    .from(pageAssets)
    .orderBy(desc(pageAssets.createdAt));
}

export async function createPageAsset(data: InsertPageAsset): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pageAssets).values(data);
  return result[0].insertId as number;
}

export async function deletePageAsset(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(pageAssets).where(eq(pageAssets.id, id));
}

// A/B Tests
export async function getAllAbTests(): Promise<AbTest[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(abTests)
    .orderBy(desc(abTests.createdAt));
}

export async function getAbTestById(id: number): Promise<AbTest | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(abTests)
    .where(eq(abTests.id, id))
    .limit(1);
  
  return result[0];
}

export async function createAbTest(data: InsertAbTest): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(abTests).values(data);
  return result[0].insertId as number;
}

export async function updateAbTest(id: number, data: Partial<InsertAbTest>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(abTests)
    .set(data)
    .where(eq(abTests.id, id));
}

export async function deleteAbTest(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(abTestVariants).where(eq(abTestVariants.testId, id));
  await db.delete(abTests).where(eq(abTests.id, id));
}

// A/B Test Variants
export async function getAbTestVariants(testId: number): Promise<AbTestVariant[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(abTestVariants)
    .where(eq(abTestVariants.testId, testId));
}

export async function createAbTestVariant(data: InsertAbTestVariant): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(abTestVariants).values(data);
  return result[0].insertId as number;
}

export async function updateAbTestVariant(id: number, data: Partial<InsertAbTestVariant>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(abTestVariants)
    .set(data)
    .where(eq(abTestVariants.id, id));
}

export async function incrementVariantMetrics(
  id: number,
  metrics: { impressions?: number; conversions?: number; clicks?: number; timeOnPage?: number }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const current = await db.select()
    .from(abTestVariants)
    .where(eq(abTestVariants.id, id))
    .limit(1);
  
  if (!current[0]) return;
  
  await db.update(abTestVariants)
    .set({
      impressions: (current[0].impressions || 0) + (metrics.impressions || 0),
      conversions: (current[0].conversions || 0) + (metrics.conversions || 0),
      clicks: (current[0].clicks || 0) + (metrics.clicks || 0),
      totalTimeOnPage: (current[0].totalTimeOnPage || 0) + (metrics.timeOnPage || 0),
    })
    .where(eq(abTestVariants.id, id));
}

// Tracking Pixels
export async function getAllTrackingPixels(): Promise<TrackingPixel[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(trackingPixels)
    .orderBy(trackingPixels.name);
}

export async function getActiveTrackingPixels(): Promise<TrackingPixel[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(trackingPixels)
    .where(eq(trackingPixels.isActive, true));
}

export async function createTrackingPixel(data: InsertTrackingPixel): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trackingPixels).values(data);
  return result[0].insertId as number;
}

export async function updateTrackingPixel(id: number, data: Partial<InsertTrackingPixel>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(trackingPixels)
    .set(data)
    .where(eq(trackingPixels.id, id));
}

export async function deleteTrackingPixel(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(trackingPixels).where(eq(trackingPixels.id, id));
}

// Page Analytics
export async function recordPageView(pageId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Increment total views on the page
  const page = await getSitePageById(pageId);
  if (page) {
    await db.update(sitePages)
      .set({ totalViews: (page.totalViews || 0) + 1 })
      .where(eq(sitePages.id, pageId));
  }
}

export async function recordPageConversion(pageId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const page = await getSitePageById(pageId);
  if (page) {
    await db.update(sitePages)
      .set({ totalConversions: (page.totalConversions || 0) + 1 })
      .where(eq(sitePages.id, pageId));
  }
}


// ==================== PENDING ACTIVATIONS (Cakto Purchase Flow) ====================

// Criar ativação pendente após compra
export async function createPendingActivation(data: InsertPendingActivation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pendingActivations).values(data);
  return result[0].insertId as number;
}

// Buscar ativação pendente por token
export async function getPendingActivationByToken(token: string): Promise<PendingActivation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(pendingActivations)
    .where(eq(pendingActivations.activationToken, token))
    .limit(1);
  
  return result[0];
}

// Buscar ativação pendente por email
export async function getPendingActivationByEmail(email: string): Promise<PendingActivation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(pendingActivations)
    .where(and(
      eq(pendingActivations.email, email),
      eq(pendingActivations.status, 'pending')
    ))
    .orderBy(desc(pendingActivations.createdAt))
    .limit(1);
  
  return result[0];
}

// Buscar ativação pendente por order ID da Cakto
export async function getPendingActivationByOrderId(orderId: string): Promise<PendingActivation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(pendingActivations)
    .where(eq(pendingActivations.caktoOrderId, orderId))
    .limit(1);
  
  return result[0];
}

// Marcar ativação como concluída
export async function markActivationAsCompleted(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pendingActivations)
    .set({
      status: 'activated',
      activatedAt: new Date(),
      activatedUserId: userId,
    })
    .where(eq(pendingActivations.id, id));
}

// Marcar email de boas-vindas como enviado
export async function markWelcomeEmailSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pendingActivations)
    .set({ welcomeEmailSentAt: new Date() })
    .where(eq(pendingActivations.id, id));
}

// Marcar email de lembrete como enviado
export async function markReminderEmailSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pendingActivations)
    .set({ reminderEmailSentAt: new Date() })
    .where(eq(pendingActivations.id, id));
}

// Listar ativações pendentes (para admin)
export async function listPendingActivations(status?: 'pending' | 'activated' | 'expired'): Promise<PendingActivation[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db.select()
      .from(pendingActivations)
      .where(eq(pendingActivations.status, status))
      .orderBy(desc(pendingActivations.createdAt));
  }
  
  return await db.select()
    .from(pendingActivations)
    .orderBy(desc(pendingActivations.createdAt));
}

// Expirar ativações antigas
export async function expireOldActivations(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.update(pendingActivations)
    .set({ status: 'expired' })
    .where(and(
      eq(pendingActivations.status, 'pending'),
      lt(pendingActivations.tokenExpiresAt, new Date())
    ));
  
  return result[0].affectedRows || 0;
}


// ==================== CAKTO WEBHOOK LOGS ====================

// Registrar log de webhook
export async function logCaktoWebhook(data: InsertCaktoWebhookLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(caktoWebhookLogs).values(data);
  return result[0].insertId as number;
}

// Listar logs de webhook (para debug/admin)
export async function listCaktoWebhookLogs(limit: number = 100): Promise<CaktoWebhookLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(caktoWebhookLogs)
    .orderBy(desc(caktoWebhookLogs.createdAt))
    .limit(limit);
}


// ==================== AI ANALYSIS HISTORY ====================

// Criar análise de IA
export async function createAiAnalysis(data: InsertAiAnalysisHistory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiAnalysisHistory).values(data);
  return result[0].insertId as number;
}

// Buscar análises de um aluno
export async function getAiAnalysesByStudentId(
  studentId: number,
  limit: number = 20
): Promise<AiAnalysisHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(aiAnalysisHistory)
    .where(eq(aiAnalysisHistory.studentId, studentId))
    .orderBy(desc(aiAnalysisHistory.createdAt))
    .limit(limit);
}

// Buscar análise por ID
export async function getAiAnalysisById(id: number): Promise<AiAnalysisHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(aiAnalysisHistory)
    .where(eq(aiAnalysisHistory.id, id))
    .limit(1);
  
  return result[0];
}

// Atualizar análise (para marcar como compartilhada ou exportada)
export async function updateAiAnalysis(id: number, data: Partial<InsertAiAnalysisHistory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(aiAnalysisHistory)
    .set(data)
    .where(eq(aiAnalysisHistory.id, id));
}

// Buscar última análise do aluno
export async function getLatestAiAnalysis(studentId: number): Promise<AiAnalysisHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(aiAnalysisHistory)
    .where(eq(aiAnalysisHistory.studentId, studentId))
    .orderBy(desc(aiAnalysisHistory.createdAt))
    .limit(1);
  
  return result[0];
}

// Buscar todas as análises de um personal
export async function getAiAnalysesByPersonalId(
  personalId: number,
  filters?: { studentId?: number; analysisType?: string; limit?: number }
): Promise<AiAnalysisHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(aiAnalysisHistory.personalId, personalId)];
  
  if (filters?.studentId) {
    conditions.push(eq(aiAnalysisHistory.studentId, filters.studentId));
  }
  
  return await db.select()
    .from(aiAnalysisHistory)
    .where(and(...conditions))
    .orderBy(desc(aiAnalysisHistory.createdAt))
    .limit(filters?.limit || 50);
}


// ==================== AI ASSISTANT CONFIG ====================
import {
  aiAssistantConfig, InsertAiAssistantConfig, AiAssistantConfig,
  leads, InsertLead, Lead,
  aiConversations, InsertAiConversation, AiConversation,
  aiMessages, InsertAiMessage, AiMessage,
  aiMemory, InsertAiMemory, AiMemory
} from "../drizzle/schema";

// Buscar configuração da IA do personal
export async function getAiAssistantConfig(personalId: number): Promise<AiAssistantConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(aiAssistantConfig)
    .where(eq(aiAssistantConfig.personalId, personalId))
    .limit(1);
  
  return result[0];
}

// Criar ou atualizar configuração da IA
export async function upsertAiAssistantConfig(personalId: number, data: Partial<InsertAiAssistantConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getAiAssistantConfig(personalId);
  
  if (existing) {
    await db.update(aiAssistantConfig)
      .set(data)
      .where(eq(aiAssistantConfig.personalId, personalId));
  } else {
    await db.insert(aiAssistantConfig).values({
      personalId,
      ...data
    });
  }
}

// ==================== LEADS ====================

// Criar lead
export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(leads).values(data);
  return result[0].insertId as number;
}

// Buscar lead por ID
export async function getLeadById(id: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  
  return result[0];
}

// Buscar lead por telefone
export async function getLeadByPhone(personalId: number, phone: string): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(leads)
    .where(and(
      eq(leads.personalId, personalId),
      eq(leads.phone, phone)
    ))
    .limit(1);
  
  return result[0];
}

// Listar leads do personal
export async function getLeadsByPersonalId(
  personalId: number,
  filters?: { status?: string; temperature?: string; limit?: number }
): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(leads.personalId, personalId)];
  
  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status as any));
  }
  if (filters?.temperature) {
    conditions.push(eq(leads.temperature, filters.temperature as any));
  }
  
  return await db.select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(filters?.limit || 100);
}

// Atualizar lead
export async function updateLead(id: number, data: Partial<InsertLead>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(leads)
    .set(data)
    .where(eq(leads.id, id));
}

// ==================== AI CONVERSATIONS ====================

// Criar conversa
export async function createAiConversation(data: InsertAiConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiConversations).values(data);
  return result[0].insertId as number;
}

// Buscar conversa por ID
export async function getAiConversationById(id: number): Promise<AiConversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(aiConversations)
    .where(eq(aiConversations.id, id))
    .limit(1);
  
  return result[0];
}

// Buscar conversa ativa por telefone
export async function getActiveAiConversation(personalId: number, phone: string): Promise<AiConversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.personalId, personalId),
      eq(aiConversations.whatsappPhone, phone),
      eq(aiConversations.status, "active")
    ))
    .limit(1);
  
  return result[0];
}

// Listar conversas do personal
export async function getAiConversationsByPersonalId(
  personalId: number,
  filters?: { status?: string; conversationType?: string; limit?: number }
): Promise<AiConversation[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(aiConversations.personalId, personalId)];
  
  if (filters?.status) {
    conditions.push(eq(aiConversations.status, filters.status as any));
  }
  if (filters?.conversationType) {
    conditions.push(eq(aiConversations.conversationType, filters.conversationType as any));
  }
  
  return await db.select()
    .from(aiConversations)
    .where(and(...conditions))
    .orderBy(desc(aiConversations.lastMessageAt))
    .limit(filters?.limit || 50);
}

// Atualizar conversa
export async function updateAiConversation(id: number, data: Partial<InsertAiConversation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(aiConversations)
    .set(data)
    .where(eq(aiConversations.id, id));
}

// ==================== AI MESSAGES ====================

// Criar mensagem
export async function createAiMessage(data: InsertAiMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiMessages).values(data);
  return result[0].insertId as number;
}

// Buscar mensagens de uma conversa
export async function getAiMessagesByConversation(conversationId: number, limit: number = 50): Promise<AiMessage[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(aiMessages.createdAt)
    .limit(limit);
}

// ==================== AI MEMORY ====================

// Criar memória
export async function createAiMemory(data: InsertAiMemory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiMemory).values(data);
  return result[0].insertId as number;
}

// Buscar memórias de um aluno
export async function getAiMemoriesByStudent(personalId: number, studentId: number): Promise<AiMemory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(aiMemory)
    .where(and(
      eq(aiMemory.personalId, personalId),
      eq(aiMemory.studentId, studentId)
    ))
    .orderBy(desc(aiMemory.createdAt));
}

// Buscar memórias de um lead
export async function getAiMemoriesByLead(personalId: number, leadId: number): Promise<AiMemory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(aiMemory)
    .where(and(
      eq(aiMemory.personalId, personalId),
      eq(aiMemory.leadId, leadId)
    ))
    .orderBy(desc(aiMemory.createdAt));
}



// ==================== FEATURE FLAGS ====================
// Buscar feature flags de um personal
export async function getFeatureFlagsByPersonalId(personalId: number): Promise<FeatureFlag | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(featureFlags)
    .where(eq(featureFlags.personalId, personalId))
    .limit(1);
  
  return result[0] || null;
}

// Criar ou atualizar feature flags
export async function upsertFeatureFlags(personalId: number, data: Partial<InsertFeatureFlag>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getFeatureFlagsByPersonalId(personalId);
  
  if (existing) {
    await db.update(featureFlags)
      .set(data)
      .where(eq(featureFlags.personalId, personalId));
  } else {
    await db.insert(featureFlags).values({
      personalId,
      ...data,
    });
  }
}

// Verificar se uma feature está habilitada para um personal
export async function isFeatureEnabled(personalId: number, feature: keyof FeatureFlag): Promise<boolean> {
  const flags = await getFeatureFlagsByPersonalId(personalId);
  
  // Se não existir registro, usar valores padrão
  if (!flags) {
    // IA de Atendimento é desabilitada por padrão
    if (feature === 'aiAssistantEnabled') return false;
    // Outras features são habilitadas por padrão
    return true;
  }
  
  return Boolean(flags[feature]);
}

// Listar todos os feature flags (para admin)
export async function getAllFeatureFlags(): Promise<(FeatureFlag & { personalName?: string })[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    featureFlags: featureFlags,
    personalName: personals.businessName,
  })
    .from(featureFlags)
    .leftJoin(personals, eq(featureFlags.personalId, personals.id));
  
  return result.map(r => ({
    ...r.featureFlags,
    personalName: r.personalName || undefined,
  }));
}

// ==================== SYSTEM SETTINGS ====================
// Buscar configuração do sistema
export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  
  return result[0]?.value || null;
}

// Criar ou atualizar configuração do sistema
export async function upsertSystemSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSystemSetting(key);
  
  if (existing !== null) {
    await db.update(systemSettings)
      .set({ value, description, updatedBy })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({
      key,
      value,
      description,
      updatedBy,
    });
  }
}

// Listar todas as configurações do sistema
export async function getAllSystemSettings(): Promise<SystemSetting[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(systemSettings);
}

// ==================== ADMIN ACTIVITY LOG ====================
// Registrar atividade do admin
export async function logAdminActivity(data: InsertAdminActivityLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(adminActivityLog).values(data);
}

// Buscar atividades do admin
export async function getAdminActivityLog(limit: number = 100): Promise<AdminActivityLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(adminActivityLog)
    .orderBy(desc(adminActivityLog.createdAt))
    .limit(limit);
}


// ==================== PERSONAL LOGIN FUNCTIONS ====================
// Funções para login de personal com email/senha (sem OAuth externo)

export async function getUserByEmailForLogin(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return result[0] || null;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
  phone?: string;
  cpf?: string;
  cref?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Gerar openId único para o usuário (necessário pelo schema)
  const { nanoid } = await import('nanoid');
  const openId = `local_${nanoid(16)}`;
  
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    phone: data.phone || null,
    cpf: data.cpf || null,
    cref: data.cref || null,
    loginMethod: 'email',
    role: 'personal',
    lastSignedIn: new Date(),
  });
  
  return result[0].insertId;
}

// Buscar personal pelo email do usuário
export async function getPersonalByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    personal: personals,
    user: users,
  })
  .from(personals)
  .innerJoin(users, eq(personals.userId, users.id))
  .where(and(eq(users.email, email), isNull(users.deletedAt), isNull(personals.deletedAt)))
  .limit(1);
  
  if (result.length === 0) return null;
  return { ...result[0].personal, user: result[0].user };
}

// Salvar código de reset de senha para personal
export async function savePersonalPasswordResetCode(userId: number, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Usar a tabela de tokens de reset (userId é o campo correto)
  await db.insert(passwordResetTokens).values({
    userId: userId,
    token: code,
    expiresAt,
  });
}

// Verificar código de reset de senha para personal
export async function verifyPersonalResetCode(email: string, code: string) {
  const db = await getDb();
  if (!db) return null;
  
  const user = await getUserByEmailForLogin(email);
  if (!user) return null;
  
  const result = await db.select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.userId, user.id),
      eq(passwordResetTokens.token, code),
      isNull(passwordResetTokens.usedAt),
      gte(passwordResetTokens.expiresAt, new Date())
    ))
    .limit(1);
  
  return result[0] || null;
}

// Marcar código de reset como usado
export async function markPersonalResetCodeUsed(tokenId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenId));
}
