import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, date } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "personal", "student"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== PERSONALS (Personal Trainers) ====================
export const personals = mysqlTable("personals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  businessName: varchar("businessName", { length: 255 }),
  cref: varchar("cref", { length: 50 }), // Registro profissional
  bio: text("bio"),
  specialties: text("specialties"), // JSON array of specialties
  workingHours: text("workingHours"), // JSON with working hours config
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  evolutionApiKey: varchar("evolutionApiKey", { length: 255 }), // Stevo API Key
  evolutionInstance: varchar("evolutionInstance", { length: 255 }), // Stevo Instance Name
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "expired", "cancelled"]).default("trial").notNull(),
  subscriptionPeriod: mysqlEnum("subscriptionPeriod", ["monthly", "quarterly", "semiannual", "annual"]).default("monthly"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Personal = typeof personals.$inferSelect;
export type InsertPersonal = typeof personals.$inferInsert;

// ==================== STUDENTS (Alunos) ====================
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  userId: int("userId").references(() => users.id), // Opcional - se aluno tiver login
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  birthDate: date("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  cpf: varchar("cpf", { length: 14 }),
  address: text("address"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
  whatsappOptIn: boolean("whatsappOptIn").default(true),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe Customer ID
  hasChildren: boolean("hasChildren").default(false), // Tem filhos - usado para automações de Dia das Mães/Pais
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed", "other"]), // Estado civil
  deletedAt: timestamp("deletedAt"), // Soft delete - null = ativo, timestamp = excluído
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ==================== ANAMNESES ====================
export const anamneses = mysqlTable("anamneses", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  // Dados pessoais
  occupation: varchar("occupation", { length: 255 }),
  lifestyle: mysqlEnum("lifestyle", ["sedentary", "light", "moderate", "active", "very_active"]),
  sleepHours: int("sleepHours"),
  sleepQuality: mysqlEnum("sleepQuality", ["poor", "fair", "good", "excellent"]),
  stressLevel: mysqlEnum("stressLevel", ["low", "moderate", "high", "very_high"]),
  // Histórico médico
  medicalHistory: text("medicalHistory"),
  injuries: text("injuries"),
  surgeries: text("surgeries"),
  medications: text("medications"),
  allergies: text("allergies"),
  // Objetivos
  mainGoal: mysqlEnum("mainGoal", ["weight_loss", "muscle_gain", "conditioning", "health", "rehabilitation", "sports", "other"]),
  secondaryGoals: text("secondaryGoals"),
  targetWeight: decimal("targetWeight", { precision: 5, scale: 2 }),
  motivation: text("motivation"),
  // Hábitos alimentares
  mealsPerDay: int("mealsPerDay"),
  waterIntake: decimal("waterIntake", { precision: 4, scale: 2 }),
  dietRestrictions: text("dietRestrictions"),
  supplements: text("supplements"),
  // Experiência com exercícios
  exerciseExperience: mysqlEnum("exerciseExperience", ["none", "beginner", "intermediate", "advanced"]),
  previousActivities: text("previousActivities"),
  availableDays: text("availableDays"), // JSON array
  preferredTime: mysqlEnum("preferredTime", ["morning", "afternoon", "evening", "flexible"]),
  // Observações
  observations: text("observations"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anamnesis = typeof anamneses.$inferSelect;
export type InsertAnamnesis = typeof anamneses.$inferInsert;

// ==================== ANAMNESIS HISTORY ====================
export const anamnesisHistory = mysqlTable("anamnesis_history", {
  id: int("id").autoincrement().primaryKey(),
  anamnesisId: int("anamnesisId").notNull().references(() => anamneses.id),
  studentId: int("studentId").notNull().references(() => students.id),
  changes: text("changes").notNull(), // JSON with changed fields
  changedBy: int("changedBy").notNull().references(() => users.id),
  version: int("version").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnamnesisHistoryRecord = typeof anamnesisHistory.$inferSelect;
export type InsertAnamnesisHistory = typeof anamnesisHistory.$inferInsert;

// ==================== MEASUREMENTS (Medidas) ====================
export const measurements = mysqlTable("measurements", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  measureDate: date("measureDate").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  bodyFat: decimal("bodyFat", { precision: 5, scale: 2 }),
  muscleMass: decimal("muscleMass", { precision: 5, scale: 2 }),
  // Circunferências
  chest: decimal("chest", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  hip: decimal("hip", { precision: 5, scale: 2 }),
  rightArm: decimal("rightArm", { precision: 5, scale: 2 }),
  leftArm: decimal("leftArm", { precision: 5, scale: 2 }),
  rightThigh: decimal("rightThigh", { precision: 5, scale: 2 }),
  leftThigh: decimal("leftThigh", { precision: 5, scale: 2 }),
  rightCalf: decimal("rightCalf", { precision: 5, scale: 2 }),
  leftCalf: decimal("leftCalf", { precision: 5, scale: 2 }),
  neck: decimal("neck", { precision: 5, scale: 2 }),
  // Calculados
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  // BF Estimado (calculado com base nas medidas)
  estimatedBodyFat: decimal("estimatedBodyFat", { precision: 5, scale: 2 }),
  estimatedMuscleMass: decimal("estimatedMuscleMass", { precision: 5, scale: 2 }),
  estimatedFatMass: decimal("estimatedFatMass", { precision: 5, scale: 2 }),
  // Bioimpedância (manual - profissional)
  bioBodyFat: decimal("bioBodyFat", { precision: 5, scale: 2 }),
  bioMuscleMass: decimal("bioMuscleMass", { precision: 5, scale: 2 }),
  bioFatMass: decimal("bioFatMass", { precision: 5, scale: 2 }),
  bioVisceralFat: decimal("bioVisceralFat", { precision: 5, scale: 2 }),
  bioBasalMetabolism: decimal("bioBasalMetabolism", { precision: 7, scale: 2 }),
  // Adipômetro (manual - profissional)
  adipBodyFat: decimal("adipBodyFat", { precision: 5, scale: 2 }),
  adipMuscleMass: decimal("adipMuscleMass", { precision: 5, scale: 2 }),
  adipFatMass: decimal("adipFatMass", { precision: 5, scale: 2 }),
  // Dobras cutâneas (para adipômetro)
  tricepsFold: decimal("tricepsFold", { precision: 5, scale: 2 }),
  subscapularFold: decimal("subscapularFold", { precision: 5, scale: 2 }),
  suprailiacFold: decimal("suprailiacFold", { precision: 5, scale: 2 }),
  abdominalFold: decimal("abdominalFold", { precision: 5, scale: 2 }),
  thighFold: decimal("thighFold", { precision: 5, scale: 2 }),
  chestFold: decimal("chestFold", { precision: 5, scale: 2 }),
  axillaryFold: decimal("axillaryFold", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;

// ==================== PHOTOS ====================
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  url: varchar("url", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["front", "back", "side_left", "side_right", "other"]).default("other"),
  photoDate: date("photoDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// ==================== WORKOUTS (Treinos) ====================
export const workouts = mysqlTable("workouts", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["strength", "cardio", "flexibility", "functional", "mixed"]).default("strength"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  notes: text("notes"),
  deletedAt: timestamp("deletedAt"), // Soft delete - null = ativo, timestamp = excluído
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;

// ==================== WORKOUT DAYS ====================
export const workoutDays = mysqlTable("workout_days", {
  id: int("id").autoincrement().primaryKey(),
  workoutId: int("workoutId").notNull().references(() => workouts.id),
  dayOfWeek: mysqlEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).notNull(),
  name: varchar("name", { length: 100 }), // Ex: "Treino A - Peito e Tríceps"
  notes: text("notes"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutDay = typeof workoutDays.$inferSelect;
export type InsertWorkoutDay = typeof workoutDays.$inferInsert;

// ==================== EXERCISES ====================
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  workoutDayId: int("workoutDayId").notNull().references(() => workoutDays.id),
  name: varchar("name", { length: 255 }).notNull(),
  muscleGroup: varchar("muscleGroup", { length: 100 }),
  sets: int("sets").default(3),
  reps: varchar("reps", { length: 50 }), // Ex: "10-12" ou "até falha"
  weight: varchar("weight", { length: 50 }), // Ex: "20kg" ou "progressivo"
  restSeconds: int("restSeconds").default(60),
  tempo: varchar("tempo", { length: 20 }), // Ex: "3-1-2"
  notes: text("notes"),
  videoUrl: varchar("videoUrl", { length: 500 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

// ==================== SESSIONS (Sessões/Aulas) ====================
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  packageId: int("packageId").references(() => packages.id),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").default(60), // minutos
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  type: mysqlEnum("type", ["regular", "trial", "makeup", "extra"]).default("regular"),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  cancelReason: text("cancelReason"),
  completedAt: timestamp("completedAt"),
  deletedAt: timestamp("deletedAt"), // Soft delete - null = ativo, timestamp = excluído
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ==================== PLANS (Planos do Personal para Alunos) ====================
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["recurring", "fixed", "sessions"]).notNull(),
  // Para planos recorrentes
  billingCycle: mysqlEnum("billingCycle", ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"]),
  billingDay: int("billingDay").default(5), // Dia do mês para cobrança
  // Para planos fixos
  durationMonths: int("durationMonths"), // 3, 6, 12 meses
  // Para pacotes de sessões
  totalSessions: int("totalSessions"),
  // Valores
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sessionsPerWeek: int("sessionsPerWeek"),
  sessionDuration: int("sessionDuration").default(60),
  stripePriceId: varchar("stripePriceId", { length: 255 }), // Stripe Price ID
  stripeProductId: varchar("stripeProductId", { length: 255 }), // Stripe Product ID
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ==================== PACKAGES (Pacotes contratados pelos alunos) ====================
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  planId: int("planId").notNull().references(() => plans.id),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "defaulted", "expired", "pending"]).default("pending").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  // Dias de treino da semana (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
  trainingDays: text("trainingDays"), // JSON array: [1, 3, 5] para Seg, Qua, Sex
  defaultTime: varchar("defaultTime", { length: 5 }), // Horário padrão: "08:00"
  // Para pacotes de sessões
  totalSessions: int("totalSessions"),
  usedSessions: int("usedSessions").default(0),
  remainingSessions: int("remainingSessions"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe Subscription ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// ==================== CHARGES (Cobranças) ====================
export const charges = mysqlTable("charges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  packageId: int("packageId").references(() => packages.id),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "credit_card", "debit_card", "cash", "transfer", "stripe", "other"]),
  paidAt: timestamp("paidAt"),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // Stripe Payment Intent ID
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }), // Stripe Invoice ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Charge = typeof charges.$inferSelect;
export type InsertCharge = typeof charges.$inferInsert;

// ==================== PAYMENTS (Pagamentos recebidos) ====================
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  chargeId: int("chargeId").notNull().references(() => charges.id),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "credit_card", "debit_card", "cash", "transfer", "other"]).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== MATERIALS (Materiais/Arquivos) ====================
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").references(() => students.id), // Null = material geral
  personalId: int("personalId").notNull().references(() => personals.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["pdf", "video", "image", "link", "other"]).default("other"),
  url: varchar("url", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }),
  isPublic: boolean("isPublic").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// ==================== AUTOMATIONS (Configurações de automação) ====================
export const automations = mysqlTable("automations", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: mysqlEnum("trigger", [
    "session_reminder",
    "session_confirmation",
    "payment_reminder",
    "payment_reminder_2days",
    "payment_reminder_dueday",
    "payment_overdue",
    "birthday",
    "inactive_student",
    "welcome",
    "mothers_day",
    "fathers_day",
    "christmas",
    "new_year",
    "womens_day",
    "mens_day",
    "customer_day",
    "custom"
  ]).notNull(),
  // Filtros para datas comemorativas
  targetGender: mysqlEnum("targetGender", ["all", "male", "female"]).default("all"),
  requiresChildren: boolean("requiresChildren").default(false), // Para Dia das Mães/Pais
  messageTemplate: text("messageTemplate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Configurações
  triggerHoursBefore: int("triggerHoursBefore"), // Para lembretes
  triggerDaysAfter: int("triggerDaysAfter"), // Para follow-ups
  sendWindowStart: varchar("sendWindowStart", { length: 5 }), // "08:00"
  sendWindowEnd: varchar("sendWindowEnd", { length: 5 }), // "20:00"
  maxMessagesPerDay: int("maxMessagesPerDay").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = typeof automations.$inferInsert;

// ==================== MESSAGE QUEUE (Fila de mensagens) ====================
export const messageQueue = mysqlTable("message_queue", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  studentId: int("studentId").notNull().references(() => students.id),
  automationId: int("automationId").references(() => automations.id),
  phone: varchar("phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageQueueItem = typeof messageQueue.$inferSelect;
export type InsertMessageQueue = typeof messageQueue.$inferInsert;

// ==================== MESSAGE LOG (Histórico de mensagens) ====================
export const messageLog = mysqlTable("message_log", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  studentId: int("studentId").notNull().references(() => students.id),
  automationId: int("automationId").references(() => automations.id),
  messageQueueId: int("messageQueueId").references(() => messageQueue.id),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent"),
  evolutionMessageId: varchar("evolutionMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageLogEntry = typeof messageLog.$inferSelect;
export type InsertMessageLog = typeof messageLog.$inferInsert;


// ==================== WORKOUT LOGS (Diário de Treino) ====================
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  workoutId: int("workoutId").notNull().references(() => workouts.id),
  workoutDayId: int("workoutDayId").notNull().references(() => workoutDays.id),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  sessionDate: timestamp("sessionDate").notNull(),
  sessionNumber: int("sessionNumber").default(1), // Sessão 1, 2, 3...
  duration: int("duration"), // Duração em minutos
  notes: text("notes"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

// ==================== EXERCISE LOGS (Registro de Exercícios por Sessão) ====================
export const exerciseLogs = mysqlTable("exercise_logs", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull().references(() => workoutLogs.id),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(), // Snapshot do nome
  // Séries realizadas (cada série com peso/reps)
  set1Weight: varchar("set1Weight", { length: 20 }),
  set1Reps: int("set1Reps"),
  set2Weight: varchar("set2Weight", { length: 20 }),
  set2Reps: int("set2Reps"),
  set3Weight: varchar("set3Weight", { length: 20 }),
  set3Reps: int("set3Reps"),
  set4Weight: varchar("set4Weight", { length: 20 }),
  set4Reps: int("set4Reps"),
  set5Weight: varchar("set5Weight", { length: 20 }),
  set5Reps: int("set5Reps"),
  // Campos adicionais
  notes: text("notes"),
  completed: boolean("completed").default(false),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = typeof exerciseLogs.$inferInsert;


// ==================== STUDENT INVITES (Convites para Alunos) ====================
export const studentInvites = mysqlTable("student_invites", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  studentId: int("studentId").notNull().references(() => students.id),
  inviteToken: varchar("inviteToken", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentInvite = typeof studentInvites.$inferSelect;
export type InsertStudentInvite = typeof studentInvites.$inferInsert;

// ==================== PASSWORD RESET TOKENS ====================
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ==================== PENDING CHANGES (Alterações Pendentes do Aluno) ====================
export const pendingChanges = mysqlTable("pending_changes", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  studentId: int("studentId").notNull().references(() => students.id),
  entityType: mysqlEnum("entityType", ["student", "anamnesis", "measurement"]).notNull(),
  entityId: int("entityId").notNull(), // ID do registro sendo alterado
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedBy: mysqlEnum("requestedBy", ["student", "personal"]).notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PendingChange = typeof pendingChanges.$inferSelect;
export type InsertPendingChange = typeof pendingChanges.$inferInsert;
