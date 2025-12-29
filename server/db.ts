import { eq, and, desc, asc, gte, lte, gt, like, sql, or, isNull, not } from "drizzle-orm";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
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
    .where(eq(measurements.studentId, studentId))
    .orderBy(desc(measurements.measureDate));
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
  
  const conditions = [eq(sessions.personalId, personalId)];
  
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
    .where(eq(sessions.studentId, studentId))
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
    .orderBy(desc(workoutLogs.sessionDate));
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
    .orderBy(desc(workoutLogs.sessionDate));
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
    .orderBy(desc(workoutLogs.sessionDate))
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
