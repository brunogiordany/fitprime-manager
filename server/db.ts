import { eq, and, desc, asc, gte, lte, like, sql, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
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
  await db.update(students).set({ status: 'inactive' }).where(and(eq(students.id, id), eq(students.personalId, personalId)));
}

export async function countStudentsByPersonalId(personalId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(students)
    .where(and(eq(students.personalId, personalId), eq(students.status, 'active')));
  return result[0]?.count || 0;
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
    .where(eq(workouts.studentId, studentId))
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

export async function deleteWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workouts).set({ status: 'inactive' }).where(eq(workouts.id, id));
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
  await db.delete(sessions).where(eq(sessions.id, id));
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
