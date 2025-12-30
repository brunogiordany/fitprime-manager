import { eq, and, desc, asc, gte, lte, gt, like, sql, or, isNull, isNotNull, not, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, User,
  personals, InsertPersonal, Personal,
  students, InsertStudent, Student,
  anamneses, InsertAnamnesis, Anamnesis,
  anamnesisHistory, InsertAnamnesisHistory,
  measurements, InsertMeasurement, Measurement,
  photos, InsertPhoto, Photo,
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
  studentBadges, InsertStudentBadge, StudentBadge,
  sessionFeedback, InsertSessionFeedback, SessionFeedback,
  workoutLogExercises, InsertWorkoutLogExercise, WorkoutLogExercise,
  workoutLogSets, InsertWorkoutLogSet, WorkoutLogSet,
  workoutLogSuggestions, InsertWorkoutLogSuggestion, WorkoutLogSuggestion,
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

// ==================== STUDENT FUNCTIONS ====================
export async function getStudentsByPersonalId(personalId: number, filters?: { status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(students.personalId, personalId)];
  
  if (filters?.status) {
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

export async function createWorkoutLog(data: InsertWorkoutLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogs).values(data);
  return result[0].insertId;
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
export async function getChatMessages(personalId: number, studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.personalId, personalId),
      eq(chatMessages.studentId, studentId)
    ))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
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
      isNull(sessions.deletedAt),
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
    const sets = await db.select().from(workoutLogSets)
      .where(and(
        eq(workoutLogSets.workoutLogExerciseId, ex.id),
        eq(workoutLogSets.isCompleted, true)
      ));
    
    for (const set of sets) {
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
    const exSets = sets.length;
    const exReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const exVolume = sets.reduce((sum, s) => {
      const w = parseFloat(s.weight?.toString() || '0');
      return sum + w * (s.reps || 0);
    }, 0);
    const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight?.toString() || '0')));
    
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

// Histórico de evolução de um exercício específico
export async function getExerciseProgressHistory(
  studentId: number,
  exerciseName: string,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar exercícios do aluno com esse nome
  const exerciseHistory = await db.select({
    exercise: workoutLogExercises,
    log: workoutLogs,
  }).from(workoutLogExercises)
    .innerJoin(workoutLogs, eq(workoutLogExercises.workoutLogId, workoutLogs.id))
    .where(and(
      eq(workoutLogs.studentId, studentId),
      like(workoutLogExercises.exerciseName, `%${exerciseName}%`),
      eq(workoutLogs.status, 'completed')
    ))
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
