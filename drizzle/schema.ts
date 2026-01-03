import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, date } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }).unique(), // CPF único para evitar duplicatas
  birthDate: date("birthDate"), // Data de nascimento
  cref: varchar("cref", { length: 50 }), // Registro profissional CREF
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "personal", "student"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete - data de exclusão
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
  evolutionApiKey: varchar("evolutionApiKey", { length: 255 }), // Stevo API Key (Token)
  evolutionInstance: varchar("evolutionInstance", { length: 255 }), // Stevo Instance ID
  stevoServer: varchar("stevoServer", { length: 50 }).default("sm15"), // Servidor Stevo (sm12, sm15, sm16, etc.)
  logoUrl: varchar("logoUrl", { length: 500 }), // Logo personalizada do personal
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "expired", "cancelled"]).default("trial").notNull(),
  subscriptionPeriod: mysqlEnum("subscriptionPeriod", ["monthly", "quarterly", "semiannual", "annual"]).default("monthly"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  trialEndsAt: timestamp("trialEndsAt"), // Data de término do trial (1 dia após cadastro)
  testAccessEndsAt: timestamp("testAccessEndsAt"), // Data de término do acesso de teste (liberado pelo owner)
  testAccessGrantedBy: varchar("testAccessGrantedBy", { length: 255 }), // Nome de quem liberou o acesso de teste
  testAccessGrantedAt: timestamp("testAccessGrantedAt"), // Data em que o acesso de teste foi liberado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete - data de exclusão
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
  status: mysqlEnum("status", ["active", "inactive", "pending", "paused"]).default("active").notNull(),
  pausedAt: timestamp("pausedAt"), // Data em que o aluno foi pausado
  pausedUntil: timestamp("pausedUntil"), // Data prevista para retorno (opcional)
  pauseReason: varchar("pauseReason", { length: 255 }), // Motivo da pausa (férias, viagem, etc)
  whatsappOptIn: boolean("whatsappOptIn").default(true),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe Customer ID
  hasChildren: boolean("hasChildren").default(false), // Tem filhos - usado para automações de Dia das Mães/Pais
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed", "other"]), // Estado civil
  messagePausedUntil: timestamp("messagePausedUntil"), // Pausa de mensagens até esta data
  messagePauseReason: varchar("messagePauseReason", { length: 255 }), // Motivo da pausa (férias, viagem, etc)
  passwordHash: varchar("passwordHash", { length: 255 }), // Senha hash para login direto do aluno
  canEditAnamnesis: boolean("canEditAnamnesis").default(true), // Permite aluno editar anamnese (padrão: liberado)
  canEditMeasurements: boolean("canEditMeasurements").default(true), // Permite aluno editar medidas (padrão: liberado)
  canEditPhotos: boolean("canEditPhotos").default(true), // Permite aluno enviar/editar fotos (padrão: liberado)
  canViewCharges: boolean("canViewCharges").default(true), // Permite aluno ver cobranças (padrão: liberado)
  canScheduleSessions: boolean("canScheduleSessions").default(true), // Permite aluno agendar sessões (padrão: liberado)
  canCancelSessions: boolean("canCancelSessions").default(true), // Permite aluno cancelar sessões (padrão: liberado)
  canSendMessages: boolean("canSendMessages").default(true), // Permite aluno enviar mensagens (padrão: liberado)
  canViewWorkouts: boolean("canViewWorkouts").default(true), // Permite aluno ver treinos (padrão: liberado)
  lastAnalyzedAt: timestamp("lastAnalyzedAt"), // Data da última análise completa por IA
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
  mainGoal: mysqlEnum("mainGoal", ["weight_loss", "muscle_gain", "recomposition", "conditioning", "health", "rehabilitation", "sports", "bulking", "cutting", "other"]),
  secondaryGoals: text("secondaryGoals"),
  targetWeight: decimal("targetWeight", { precision: 5, scale: 2 }),
  motivation: text("motivation"),
  // Hábitos alimentares
  mealsPerDay: int("mealsPerDay"),
  waterIntake: decimal("waterIntake", { precision: 4, scale: 2 }),
  dietRestrictions: text("dietRestrictions"),
  supplements: text("supplements"),
  dailyCalories: int("dailyCalories"), // Consumo calórico diário (kcal) - opcional para IA
  // Atividades Aeróbicas/Cardio
  doesCardio: boolean("doesCardio").default(false), // Faz cardio?
  cardioActivities: text("cardioActivities"), // JSON array: [{activity: "natação", frequency: 2, duration: 45}, ...]
  // Experiência com exercícios
  exerciseExperience: mysqlEnum("exerciseExperience", ["none", "beginner", "intermediate", "advanced"]),
  previousActivities: text("previousActivities"),
  availableDays: text("availableDays"), // JSON array
  preferredTime: mysqlEnum("preferredTime", ["morning", "afternoon", "evening", "flexible"]),
  // Equipamentos e Local de Treino
  trainingLocation: mysqlEnum("trainingLocation", ["full_gym", "home_gym", "home_basic", "outdoor", "studio"]),
  availableEquipment: text("availableEquipment"), // JSON array of equipment
  weeklyFrequency: int("weeklyFrequency"), // Quantos dias por semana
  sessionDuration: int("sessionDuration"), // Duração preferida em minutos
  // Restrições de Treino (regiões a evitar ou cuidar)
  trainingRestrictions: text("trainingRestrictions"), // JSON array: ["lombar", "joelho", "ombro", etc.]
  restrictionNotes: text("restrictionNotes"), // Detalhes sobre as restrições
  // Ênfases Musculares (grupos que o aluno quer priorizar)
  muscleEmphasis: text("muscleEmphasis"), // JSON array: ["peito", "costas", "pernas", etc.]
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
  // TMB - Taxa Metabólica Basal (calculada automaticamente)
  estimatedBMR: decimal("estimatedBMR", { precision: 7, scale: 2 }), // kcal/dia
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
  // Arquivo de bioimpedância (PDF/foto para análise por IA)
  bioFileUrl: text("bioFileUrl"), // URL do arquivo no S3
  bioFileKey: text("bioFileKey"), // Key do arquivo no S3
  bioAiAnalysis: text("bioAiAnalysis"), // Análise completa da IA em JSON
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
  deletedAt: timestamp("deletedAt"),
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
  poseId: varchar("poseId", { length: 100 }), // ID da pose guiada (frontal-relaxado, etc)
  photoDate: date("photoDate").notNull(),
  notes: text("notes"),
  // Análise de IA
  aiAnalysis: text("aiAnalysis"), // Análise completa da IA em JSON
  aiAnalyzedAt: timestamp("aiAnalyzedAt"), // Data da última análise
  // Metadados de evolução
  bodyFatEstimate: decimal("bodyFatEstimate", { precision: 5, scale: 2 }), // Estimativa de % gordura
  muscleScore: int("muscleScore"), // Score de desenvolvimento muscular (1-10)
  postureScore: int("postureScore"), // Score de postura (1-10)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabela para análises de evolução (comparações)
export const photoAnalyses = mysqlTable("photo_analyses", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  beforePhotoId: int("beforePhotoId").notNull().references(() => photos.id),
  afterPhotoId: int("afterPhotoId").notNull().references(() => photos.id),
  // Dados da análise
  analysisType: mysqlEnum("analysisType", ["evolution", "single", "comprehensive"]).default("evolution"),
  analysis: text("analysis").notNull(), // Análise completa em texto
  analysisJson: text("analysisJson"), // Análise estruturada em JSON
  // Scores comparativos
  overallProgress: int("overallProgress"), // Progresso geral (-100 a 100)
  muscleGain: int("muscleGain"), // Ganho muscular (-100 a 100)
  fatLoss: int("fatLoss"), // Perda de gordura (-100 a 100)
  postureImprovement: int("postureImprovement"), // Melhora de postura (-100 a 100)
  // Medidas correlacionadas (opcional)
  measurementId: int("measurementId").references(() => measurements.id),
  // Metadados
  daysBetween: int("daysBetween"), // Dias entre as fotos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: mysqlEnum("createdBy", ["student", "personal", "system"]).default("system"),
});

export type PhotoAnalysis = typeof photoAnalyses.$inferSelect;
export type InsertPhotoAnalysis = typeof photoAnalyses.$inferInsert;

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
  goal: mysqlEnum("goal", ["hypertrophy", "weight_loss", "recomposition", "conditioning", "strength", "bulking", "cutting", "general"]).default("general"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  isTemplate: boolean("isTemplate").default(false), // Se é um template pré-programado
  generatedByAI: boolean("generatedByAI").default(false), // Se foi gerado por IA
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
  workoutId: int("workoutId").references(() => workouts.id), // Treino vinculado
  workoutDayIndex: int("workoutDayIndex"), // Índice do dia do treino (0=A, 1=B, 2=C...)
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
    "reengagement_30days",
    "invite_reminder_3days",
    "invite_reminder_7days",
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


// ==================== EXERCISE LOGS (Registro de Exercícios - LEGACY) ====================
// Tabela legada - mantida para compatibilidade. Use workoutLogExercises e workoutLogSets para novos registros.
export const exerciseLogs = mysqlTable("exercise_logs", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull(),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
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
  entityType: mysqlEnum("entityType", ["student", "anamnesis", "measurement", "workout"]).notNull(),
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


// ==================== CHAT MESSAGES (Mensagens entre Aluno e Personal) ====================
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  studentId: int("studentId").notNull().references(() => students.id),
  senderType: mysqlEnum("senderType", ["personal", "student"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "audio", "image", "video", "file", "link"]).default("text").notNull(),
  message: text("message"), // texto da mensagem ou legenda da mídia
  // Campos para mídia (fotos, vídeos, arquivos, áudio)
  mediaUrl: text("mediaUrl"), // URL do arquivo no S3
  mediaName: varchar("mediaName", { length: 255 }), // nome original do arquivo
  mediaMimeType: varchar("mediaMimeType", { length: 100 }), // tipo MIME
  mediaSize: int("mediaSize"), // tamanho em bytes
  mediaDuration: int("mediaDuration"), // duração em segundos (para áudio/vídeo)
  // Transcrição de áudio
  audioTranscription: text("audioTranscription"),
  // Preview de links
  linkPreviewTitle: varchar("linkPreviewTitle", { length: 255 }),
  linkPreviewDescription: text("linkPreviewDescription"),
  linkPreviewImage: text("linkPreviewImage"),
  linkPreviewUrl: text("linkPreviewUrl"),
  // Edição
  isEdited: boolean("isEdited").default(false),
  editedAt: timestamp("editedAt"),
  originalMessage: text("originalMessage"), // mensagem original antes da edição
  // Exclusão
  deletedForSender: boolean("deletedForSender").default(false),
  deletedForAll: boolean("deletedForAll").default(false),
  deletedAt: timestamp("deletedAt"),
  // Leitura
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  // Origem da mensagem (whatsapp = via Stevo, internal = chat interno)
  source: mysqlEnum("source", ["internal", "whatsapp"]).default("internal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;


// ==================== STUDENT BADGES (Conquistas/Gamificação) ====================
export const studentBadges = mysqlTable("student_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  badgeType: mysqlEnum("badgeType", [
    // Frequência
    "first_session", // Primeira sessão realizada
    "streak_7", // 7 sessões seguidas sem falta
    "streak_30", // 30 dias de treino consistente
    "streak_90", // 90 dias de treino consistente
    "perfect_month", // Mês perfeito (sem faltas)
    "sessions_10", // 10 sessões realizadas
    "sessions_50", // 50 sessões realizadas
    "sessions_100", // 100 sessões realizadas
    // Evolução
    "first_measurement", // Primeira medição registrada
    "weight_goal", // Meta de peso atingida
    "body_fat_goal", // Meta de gordura corporal atingida
    "muscle_gain", // Ganho de massa muscular
    // Engajamento
    "profile_complete", // Perfil completo (anamnese preenchida)
    "early_bird", // 5 treinos antes das 7h
    "night_owl", // 5 treinos depois das 20h
    "weekend_warrior", // 10 treinos no fim de semana
    // Especiais
    "anniversary_1", // 1 ano de treino
    "comeback", // Voltou após 30 dias de inatividade
  ]).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  metadata: text("metadata"), // JSON com dados extras (ex: peso inicial/final)
});

export type StudentBadge = typeof studentBadges.$inferSelect;
export type InsertStudentBadge = typeof studentBadges.$inferInsert;


// ==================== SESSION FEEDBACK (Feedback pós-sessão) ====================
export const sessionFeedback = mysqlTable("session_feedback", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => sessions.id),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Avaliações (1-5)
  energyLevel: int("energyLevel"), // Nível de energia após o treino
  painLevel: int("painLevel"), // Nível de dor/desconforto
  satisfactionLevel: int("satisfactionLevel"), // Satisfação com o treino
  difficultyLevel: int("difficultyLevel"), // Dificuldade percebida
  
  // Campos de texto
  highlights: text("highlights"), // O que mais gostou
  improvements: text("improvements"), // O que pode melhorar
  notes: text("notes"), // Observações gerais
  
  // Humor
  mood: mysqlEnum("mood", ["great", "good", "neutral", "tired", "exhausted"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionFeedback = typeof sessionFeedback.$inferSelect;
export type InsertSessionFeedback = typeof sessionFeedback.$inferInsert;


// ==================== WORKOUT LOGS (Diário de Treino do Maromba) ====================
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => sessions.id), // Sessão vinculada (opcional)
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  workoutId: int("workoutId").references(() => workouts.id), // Treino vinculado (opcional)
  workoutDayId: int("workoutDayId").references(() => workoutDays.id), // Dia do treino (A, B, C...)
  
  // Informações do treino
  trainingDate: date("trainingDate").notNull(), // Data do treino
  dayName: varchar("dayName", { length: 100 }), // Nome do dia (ex: "Treino A - Peito e Tríceps")
  startTime: varchar("startTime", { length: 5 }), // Horário início (HH:MM)
  endTime: varchar("endTime", { length: 5 }), // Horário fim (HH:MM)
  totalDuration: int("totalDuration"), // Duração total em minutos
  
  // Estatísticas calculadas
  totalSets: int("totalSets").default(0), // Total de séries
  totalReps: int("totalReps").default(0), // Total de repetições
  totalVolume: decimal("totalVolume", { precision: 10, scale: 2 }).default("0"), // Volume total (carga × reps)
  totalExercises: int("totalExercises").default(0), // Total de exercícios
  
  // Observações gerais
  notes: text("notes"),
  feeling: mysqlEnum("feeling", ["great", "good", "normal", "tired", "exhausted"]), // Como se sentiu
  
  // Status
  status: mysqlEnum("status", ["in_progress", "completed", "cancelled"]).default("in_progress"),
  completedAt: timestamp("completedAt"),
  
  // Aprovação de alterações
  hasPendingSuggestions: boolean("hasPendingSuggestions").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

// ==================== WORKOUT LOG EXERCISES (Exercícios do Registro) ====================
export const workoutLogExercises = mysqlTable("workout_log_exercises", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull().references(() => workoutLogs.id),
  exerciseId: int("exerciseId").references(() => exercises.id), // Exercício vinculado (opcional)
  
  // Informações do exercício
  orderIndex: int("orderIndex").notNull(), // Ordem no treino
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(), // Nome do exercício
  muscleGroup: varchar("muscleGroup", { length: 100 }), // Grupo muscular
  
  // Configuração planejada
  plannedSets: int("plannedSets"), // Séries planejadas
  plannedReps: varchar("plannedReps", { length: 20 }), // Reps planejadas (ex: "8-12")
  plannedRest: int("plannedRest"), // Descanso planejado em segundos
  
  // Estatísticas calculadas
  completedSets: int("completedSets").default(0), // Séries completadas
  totalReps: int("totalReps").default(0), // Total de reps realizadas
  totalVolume: decimal("totalVolume", { precision: 10, scale: 2 }).default("0"), // Volume do exercício
  maxWeight: decimal("maxWeight", { precision: 6, scale: 2 }), // Maior carga usada
  
  // Observações
  notes: text("notes"),
  isCompleted: boolean("isCompleted").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutLogExercise = typeof workoutLogExercises.$inferSelect;
export type InsertWorkoutLogExercise = typeof workoutLogExercises.$inferInsert;

// ==================== WORKOUT LOG SETS (Séries do Exercício) ====================
export const workoutLogSets = mysqlTable("workout_log_sets", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogExerciseId: int("workoutLogExerciseId").notNull().references(() => workoutLogExercises.id),
  
  // Informações da série
  setNumber: int("setNumber").notNull(), // Número da série (1-6)
  setType: mysqlEnum("setType", ["warmup", "feeler", "working", "drop", "rest_pause", "failure"]).default("working"),
  // warmup = aquecimento, feeler = reconhecimento de carga, working = série válida, drop = drop set, rest_pause = rest-pause, failure = falha
  
  // Dados da série
  weight: decimal("weight", { precision: 6, scale: 2 }), // Carga em kg
  reps: int("reps"), // Repetições realizadas
  restTime: int("restTime"), // Tempo de descanso em segundos
  
  // Técnicas avançadas
  isDropSet: boolean("isDropSet").default(false),
  dropWeight: decimal("dropWeight", { precision: 6, scale: 2 }), // Carga do drop
  dropReps: int("dropReps"), // Reps do drop
  
  isRestPause: boolean("isRestPause").default(false),
  restPauseWeight: decimal("restPauseWeight", { precision: 6, scale: 2 }), // Carga do rest-pause
  restPauseReps: int("restPauseReps"), // Reps do rest-pause
  restPausePause: int("restPausePause"), // Pausa do rest-pause em segundos
  
  // RPE (Rate of Perceived Exertion) - Escala de esforço 1-10
  rpe: int("rpe"),
  
  // Status
  isCompleted: boolean("isCompleted").default(false),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutLogSet = typeof workoutLogSets.$inferSelect;
export type InsertWorkoutLogSet = typeof workoutLogSets.$inferInsert;

// ==================== WORKOUT LOG SUGGESTIONS (Sugestões de Ajuste do Aluno) ====================
export const workoutLogSuggestions = mysqlTable("workout_log_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull().references(() => workoutLogs.id),
  workoutLogExerciseId: int("workoutLogExerciseId").references(() => workoutLogExercises.id), // Exercício específico (opcional)
  workoutLogSetId: int("workoutLogSetId").references(() => workoutLogSets.id), // Série específica (opcional)
  
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Tipo de sugestão
  suggestionType: mysqlEnum("suggestionType", ["weight_change", "reps_change", "exercise_change", "add_set", "remove_set", "note", "other"]).notNull(),
  
  // Valores originais e sugeridos
  originalValue: text("originalValue"), // JSON com valores originais
  suggestedValue: text("suggestedValue"), // JSON com valores sugeridos
  reason: text("reason"), // Motivo da sugestão
  
  // Status da aprovação
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"), // Comentário do personal ao aprovar/rejeitar
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutLogSuggestion = typeof workoutLogSuggestions.$inferSelect;
export type InsertWorkoutLogSuggestion = typeof workoutLogSuggestions.$inferInsert;


// ==================== PERSONAL SUBSCRIPTIONS (Planos SaaS do Personal) ====================
export const personalSubscriptions = mysqlTable("personal_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Plano atual
  planId: varchar("planId", { length: 50 }).notNull(), // fitprime_br_starter, fitprime_br_growth, etc.
  planName: varchar("planName", { length: 100 }).notNull(), // Starter, Growth, Pro, etc.
  country: mysqlEnum("country", ["BR", "US"]).default("BR").notNull(),
  
  // Limites e uso
  studentLimit: int("studentLimit").notNull(), // Limite de alunos do plano
  currentStudents: int("currentStudents").default(0).notNull(), // Alunos ativos atuais
  extraStudents: int("extraStudents").default(0).notNull(), // Alunos extras (acima do limite)
  
  // Preços
  planPrice: decimal("planPrice", { precision: 10, scale: 2 }).notNull(), // Preço do plano
  extraStudentPrice: decimal("extraStudentPrice", { precision: 10, scale: 2 }).notNull(), // Preço por aluno extra
  currency: mysqlEnum("currency", ["BRL", "USD"]).default("BRL").notNull(),
  
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  
  // Status
  status: mysqlEnum("status", ["active", "trial", "past_due", "cancelled", "expired"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  
  // Histórico de cobrança de extras
  lastExtraCharge: decimal("lastExtraCharge", { precision: 10, scale: 2 }).default("0"),
  lastExtraChargeAt: timestamp("lastExtraChargeAt"),
  
  // Acúmulo de cobranças para próxima fatura
  accumulatedExtraCharge: decimal("accumulatedExtraCharge", { precision: 10, scale: 2 }).default("0"), // Valor acumulado de extras
  accumulatedExtraStudents: int("accumulatedExtraStudents").default(0), // Quantidade acumulada de alunos extras
  lastAccumulationReset: timestamp("lastAccumulationReset"), // Última vez que o acúmulo foi zerado (após cobrança)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalSubscription = typeof personalSubscriptions.$inferSelect;
export type InsertPersonalSubscription = typeof personalSubscriptions.$inferInsert;

// ==================== SUBSCRIPTION USAGE LOGS (Histórico de uso/cobrança) ====================
export const subscriptionUsageLogs = mysqlTable("subscription_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  subscriptionId: int("subscriptionId").notNull().references(() => personalSubscriptions.id),
  
  // Tipo de evento
  eventType: mysqlEnum("eventType", [
    "student_added",      // Aluno adicionado
    "student_removed",    // Aluno removido
    "limit_exceeded",     // Limite excedido
    "extra_charged",      // Cobrança de extra realizada
    "plan_upgraded",      // Upgrade de plano
    "plan_downgraded",    // Downgrade de plano
    "upgrade_suggested",  // Sugestão de upgrade
    "payment_failed",     // Falha no pagamento
    "subscription_renewed" // Renovação de assinatura
  ]).notNull(),
  
  // Dados do evento
  previousValue: int("previousValue"), // Valor anterior (ex: número de alunos)
  newValue: int("newValue"), // Novo valor
  chargeAmount: decimal("chargeAmount", { precision: 10, scale: 2 }), // Valor cobrado (se aplicável)
  currency: mysqlEnum("currency", ["BRL", "USD"]).default("BRL"),
  
  // Detalhes
  details: text("details"), // JSON com detalhes adicionais
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionUsageLog = typeof subscriptionUsageLogs.$inferSelect;
export type InsertSubscriptionUsageLog = typeof subscriptionUsageLogs.$inferInsert;


// ==================== CHAT SUPPORT (Suporte ao Visitante) ====================
export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }).notNull().unique(), // ID único do visitante (gerado no cliente)
  visitorName: varchar("visitorName", { length: 255 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  visitorPhone: varchar("visitorPhone", { length: 20 }),
  status: mysqlEnum("status", ["active", "closed", "waiting"]).default("active").notNull(),
  assignedToPersonalId: int("assignedToPersonalId").references(() => personals.id), // Personal que está atendendo
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"), // Quando foi resolvido
  source: mysqlEnum("source", ["landing", "website", "app"]).default("landing").notNull(),
  notes: text("notes"), // Notas internas do personal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

export const chatSupportMessages = mysqlTable("chat_support_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => chatConversations.id),
  sender: mysqlEnum("sender", ["visitor", "ai", "personal"]).notNull(),
  senderName: varchar("senderName", { length: 255 }), // Nome de quem enviou (para personal)
  message: text("message").notNull(),
  isAutoReply: boolean("isAutoReply").default(false), // Se foi resposta automática da IA
  readAt: timestamp("readAt"), // Quando foi lido
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatSupportMessage = typeof chatSupportMessages.$inferSelect;
export type InsertChatSupportMessage = typeof chatSupportMessages.$inferInsert;


// ==================== QUIZ RESPONSES (Respostas do Quiz de Qualificação) ====================
export const quizResponses = mysqlTable("quiz_responses", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do visitante
  visitorId: varchar("visitorId", { length: 255 }).notNull(), // ID único do visitante (fingerprint ou UUID)
  sessionId: varchar("sessionId", { length: 255 }), // ID da sessão
  
  // Dados de qualificação
  studentsCount: varchar("studentsCount", { length: 50 }), // none, 1_5, 6_15, 16_30, over_30
  revenue: varchar("revenue", { length: 50 }), // no_revenue, under_2k, 2k_5k, 5k_10k, over_10k
  
  // Dores identificadas (JSON array)
  managementPain: varchar("managementPain", { length: 50 }), // always, sometimes, rarely, never
  timePain: varchar("timePain", { length: 50 }), // over_10h, 5_10h, 2_5h, under_2h
  retentionPain: varchar("retentionPain", { length: 50 }), // many, some, few, none
  billingPain: varchar("billingPain", { length: 50 }), // always, sometimes, rarely, never
  priority: varchar("priority", { length: 50 }), // organization, time, retention, billing, growth, professionalism
  
  // Todas as respostas em JSON
  allAnswers: text("allAnswers"), // JSON com todas as respostas
  
  // Resultado
  recommendedProfile: varchar("recommendedProfile", { length: 50 }), // beginner, starter, pro, business
  recommendedPlan: varchar("recommendedPlan", { length: 100 }),
  totalScore: int("totalScore"),
  identifiedPains: text("identifiedPains"), // JSON array de dores identificadas
  
  // Status do funil
  isQualified: boolean("isQualified").default(true), // Se passou na qualificação
  disqualificationReason: varchar("disqualificationReason", { length: 255 }), // Motivo da desqualificação
  
  // Conversão
  viewedPricing: boolean("viewedPricing").default(false), // Se viu a página de preços
  clickedCta: boolean("clickedCta").default(false), // Se clicou em algum CTA
  selectedPlan: varchar("selectedPlan", { length: 100 }), // Plano que selecionou
  convertedToTrial: boolean("convertedToTrial").default(false), // Se converteu para trial
  convertedToPaid: boolean("convertedToPaid").default(false), // Se converteu para pago
  
  // Rastreamento
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  referrer: varchar("referrer", { length: 500 }),
  landingPage: varchar("landingPage", { length: 500 }),
  
  // Dispositivo
  userAgent: text("userAgent"),
  deviceType: varchar("deviceType", { length: 50 }), // mobile, tablet, desktop
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(), // Quando começou o quiz
  completedAt: timestamp("completedAt"), // Quando completou o quiz
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;

// ==================== QUIZ ANALYTICS (Métricas agregadas do Quiz) ====================
export const quizAnalytics = mysqlTable("quiz_analytics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Período
  date: timestamp("date").notNull(), // Data do registro
  
  // Métricas de funil
  totalStarts: int("totalStarts").default(0), // Total de inícios do quiz
  totalCompletions: int("totalCompletions").default(0), // Total de conclusões
  totalQualified: int("totalQualified").default(0), // Total de qualificados
  totalDisqualified: int("totalDisqualified").default(0), // Total de desqualificados
  
  // Conversões
  viewedPricing: int("viewedPricing").default(0), // Viram página de preços
  clickedCta: int("clickedCta").default(0), // Clicaram em CTA
  convertedTrial: int("convertedTrial").default(0), // Converteram para trial
  convertedPaid: int("convertedPaid").default(0), // Converteram para pago
  
  // Distribuição de perfis
  profileBeginner: int("profileBeginner").default(0),
  profileStarter: int("profileStarter").default(0),
  profilePro: int("profilePro").default(0),
  profileBusiness: int("profileBusiness").default(0),
  
  // Dores mais comuns (JSON com contagem)
  painDistribution: text("painDistribution"), // JSON com distribuição de dores
  
  // Origem do tráfego (JSON)
  sourceDistribution: text("sourceDistribution"), // JSON com distribuição de fontes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizAnalytics = typeof quizAnalytics.$inferSelect;
export type InsertQuizAnalytics = typeof quizAnalytics.$inferInsert;


// ==================== SITE PAGES (Páginas do Site - Editor Visual) ====================
export const sitePages = mysqlTable("site_pages", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  name: varchar("name", { length: 255 }).notNull(), // Nome da página
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL da página (ex: /quiz, /pricing)
  
  // Status
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  
  // Conteúdo
  blocks: text("blocks"), // JSON com os blocos da página
  
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  ogImage: varchar("ogImage", { length: 500 }),
  
  // Configurações
  template: varchar("template", { length: 50 }), // Template base usado (blank, landing, promo)
  settings: text("settings"), // JSON com configurações da página
  
  // Analytics (dados reais agregados)
  totalViews: int("totalViews").default(0),
  totalConversions: int("totalConversions").default(0),
  bounceRate: decimal("bounceRate", { precision: 5, scale: 2 }).default("0"),
  avgTimeOnPage: int("avgTimeOnPage").default(0), // Em segundos
  
  // Timestamps
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SitePage = typeof sitePages.$inferSelect;
export type InsertSitePage = typeof sitePages.$inferInsert;

// ==================== PAGE ANALYTICS (Analytics por página) ====================
export const pageAnalytics = mysqlTable("page_analytics", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull().references(() => sitePages.id),
  
  // Período
  date: timestamp("date").notNull(),
  
  // Métricas
  views: int("views").default(0),
  uniqueVisitors: int("uniqueVisitors").default(0),
  conversions: int("conversions").default(0),
  bounces: int("bounces").default(0),
  totalTimeOnPage: int("totalTimeOnPage").default(0), // Total de segundos
  
  // Origem do tráfego
  sourceDistribution: text("sourceDistribution"), // JSON com distribuição de fontes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageAnalytic = typeof pageAnalytics.$inferSelect;
export type InsertPageAnalytic = typeof pageAnalytics.$inferInsert;

// ==================== PAGE VERSIONS (Histórico de versões) ====================
export const pageVersions = mysqlTable("page_versions", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull().references(() => sitePages.id),
  
  // Conteúdo da versão
  blocks: text("blocks"), // JSON com os blocos
  settings: text("settings"), // JSON com configurações
  
  // Metadados
  versionNumber: int("versionNumber").notNull(),
  createdBy: varchar("createdBy", { length: 255 }), // Quem criou esta versão
  changeDescription: varchar("changeDescription", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageVersion = typeof pageVersions.$inferSelect;
export type InsertPageVersion = typeof pageVersions.$inferInsert;

// ==================== TRACKING PIXELS (Configuração de Pixels) ====================
export const trackingPixels = mysqlTable("tracking_pixels", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tipo de pixel
  type: mysqlEnum("type", ["google_analytics", "facebook_pixel", "tiktok_pixel", "google_ads", "custom"]).notNull(),
  
  // Configuração
  name: varchar("name", { length: 255 }).notNull(),
  pixelId: varchar("pixelId", { length: 255 }), // ID do pixel
  apiKey: varchar("apiKey", { length: 500 }), // API Key para conversões server-side
  apiSecret: varchar("apiSecret", { length: 500 }), // API Secret
  
  // Status
  isActive: boolean("isActive").default(true),
  
  // Configurações avançadas
  settings: text("settings"), // JSON com configurações específicas do pixel
  
  // Eventos habilitados
  enabledEvents: text("enabledEvents"), // JSON com lista de eventos habilitados
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrackingPixel = typeof trackingPixels.$inferSelect;
export type InsertTrackingPixel = typeof trackingPixels.$inferInsert;


// ==================== A/B TESTS (Testes A/B) ====================
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  originalPageId: int("originalPageId").notNull().references(() => sitePages.id),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).default("draft").notNull(),
  trafficSplit: int("trafficSplit").default(50),
  goalType: mysqlEnum("goalType", ["conversion", "click", "time_on_page", "scroll_depth"]).default("conversion"),
  goalValue: varchar("goalValue", { length: 255 }),
  winnerId: int("winnerId"),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

// ==================== A/B TEST VARIANTS (Variantes do Teste A/B) ====================
export const abTestVariants = mysqlTable("ab_test_variants", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull().references(() => abTests.id),
  name: varchar("name", { length: 255 }).notNull(),
  isControl: boolean("isControl").default(false),
  blocks: text("blocks"),
  settings: text("settings"),
  impressions: int("impressions").default(0),
  conversions: int("conversions").default(0),
  clicks: int("clicks").default(0),
  totalTimeOnPage: int("totalTimeOnPage").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AbTestVariant = typeof abTestVariants.$inferSelect;
export type InsertAbTestVariant = typeof abTestVariants.$inferInsert;

// ==================== PAGE BLOCKS (Blocos individuais das páginas) ====================
export const pageBlocks = mysqlTable("page_blocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull().references(() => sitePages.id),
  blockType: varchar("blockType", { length: 50 }).notNull(),
  blockId: varchar("blockId", { length: 100 }).notNull(),
  order: int("order").notNull().default(0),
  content: text("content"),
  delay: int("delay").default(0),
  animation: varchar("animation", { length: 50 }),
  animationDuration: int("animationDuration").default(500),
  videoSync: boolean("videoSync").default(false),
  videoTimestamp: int("videoTimestamp"),
  videoId: varchar("videoId", { length: 100 }),
  isVisible: boolean("isVisible").default(true),
  visibilityCondition: text("visibilityCondition"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageBlock = typeof pageBlocks.$inferSelect;
export type InsertPageBlock = typeof pageBlocks.$inferInsert;

// ==================== PAGE ASSETS (Imagens e arquivos das páginas) ====================
export const pageAssets = mysqlTable("page_assets", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").references(() => sitePages.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }),
  url: varchar("url", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["image", "video", "icon", "document", "other"]).default("image"),
  mimeType: varchar("mimeType", { length: 100 }),
  width: int("width"),
  height: int("height"),
  fileSize: int("fileSize"),
  alt: varchar("alt", { length: 255 }),
  caption: text("caption"),
  tags: text("tags"),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  mediumUrl: varchar("mediumUrl", { length: 500 }),
  largeUrl: varchar("largeUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageAsset = typeof pageAssets.$inferSelect;
export type InsertPageAsset = typeof pageAssets.$inferInsert;


// ==================== PENDING ACTIVATIONS (Ativações Pendentes de Compra) ====================
export const pendingActivations = mysqlTable("pending_activations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Dados do cliente da Cakto
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  name: varchar("name", { length: 255 }),
  cpf: varchar("cpf", { length: 14 }),
  
  // Dados da compra
  caktoOrderId: varchar("caktoOrderId", { length: 255 }).notNull().unique(),
  caktoSubscriptionId: varchar("caktoSubscriptionId", { length: 255 }),
  productId: varchar("productId", { length: 255 }),
  productName: varchar("productName", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  
  // Plano correspondente
  planType: mysqlEnum("planType", ["beginner", "starter", "pro", "business", "premium", "enterprise"]),
  
  // Token de ativação
  activationToken: varchar("activationToken", { length: 255 }).notNull().unique(),
  tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "activated", "expired"]).default("pending").notNull(),
  activatedAt: timestamp("activatedAt"),
  activatedUserId: int("activatedUserId").references(() => users.id),
  
  // Email enviado
  welcomeEmailSentAt: timestamp("welcomeEmailSentAt"),
  reminderEmailSentAt: timestamp("reminderEmailSentAt"),
  
  // Timestamps
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PendingActivation = typeof pendingActivations.$inferSelect;
export type InsertPendingActivation = typeof pendingActivations.$inferInsert;

// ==================== CAKTO WEBHOOK LOGS (Logs de Webhooks da Cakto) ====================
export const caktoWebhookLogs = mysqlTable("cakto_webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Dados do evento
  event: varchar("event", { length: 100 }).notNull(),
  orderId: varchar("orderId", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  productId: varchar("productId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  
  // Ação tomada
  action: varchar("action", { length: 50 }).notNull(),
  actionResult: mysqlEnum("actionResult", ["success", "failed", "skipped"]).default("success"),
  actionDetails: text("actionDetails"),
  
  // Payload completo
  rawPayload: text("rawPayload"),
  
  // Timestamps
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaktoWebhookLog = typeof caktoWebhookLogs.$inferSelect;
export type InsertCaktoWebhookLog = typeof caktoWebhookLogs.$inferInsert;


// ==================== AI ANALYSIS HISTORY (Histórico de Análises de IA) ====================
export const aiAnalysisHistory = mysqlTable("ai_analysis_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Tipo de análise
  analysisType: mysqlEnum("analysisType", ["complete", "workout_comparison", "progress", "recommendation"]).default("complete").notNull(),
  
  // Dados do aluno no momento da análise (snapshot)
  studentName: varchar("studentName", { length: 255 }).notNull(),
  
  // Conteúdo da análise
  summary: text("summary"), // Resumo geral
  strengths: text("strengths"), // JSON array de pontos fortes
  attentionPoints: text("attentionPoints"), // JSON array de pontos de atenção
  muscleGroupsEvolving: text("muscleGroupsEvolving"), // JSON array de grupos musculares evoluindo
  muscleGroupsToFocus: text("muscleGroupsToFocus"), // JSON array de grupos para focar
  recommendations: text("recommendations"), // JSON array de recomendações
  
  // Dados de medidas no momento
  measurementSnapshot: text("measurementSnapshot"), // JSON com medidas atuais
  
  // Dados de treino no momento
  workoutSnapshot: text("workoutSnapshot"), // JSON com dados de treino
  
  // Recomendação principal
  mainRecommendation: text("mainRecommendation"),
  mainRecommendationPriority: mysqlEnum("mainRecommendationPriority", ["low", "medium", "high"]).default("medium"),
  
  // Métricas calculadas
  consistencyScore: decimal("consistencyScore", { precision: 5, scale: 2 }), // Score de consistência 0-100
  progressScore: decimal("progressScore", { precision: 5, scale: 2 }), // Score de progresso 0-100
  
  // Treino gerado (se houver)
  generatedWorkoutId: int("generatedWorkoutId").references(() => workouts.id),
  
  // Compartilhamento
  sharedViaWhatsapp: boolean("sharedViaWhatsapp").default(false),
  sharedAt: timestamp("sharedAt"),
  exportedAsPdf: boolean("exportedAsPdf").default(false),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiAnalysisHistory = typeof aiAnalysisHistory.$inferSelect;
export type InsertAiAnalysisHistory = typeof aiAnalysisHistory.$inferInsert;


// ==================== AI ASSISTANT CONFIG (Configuração da IA de Atendimento) ====================
export const aiAssistantConfig = mysqlTable("ai_assistant_config", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id).unique(),
  
  // Identidade da IA
  assistantName: varchar("assistantName", { length: 100 }).default("Assistente").notNull(),
  assistantGender: mysqlEnum("assistantGender", ["male", "female", "neutral"]).default("female"),
  
  // Tom e Personalidade
  communicationTone: mysqlEnum("communicationTone", ["formal", "casual", "motivational", "friendly"]).default("friendly"),
  useEmojis: boolean("useEmojis").default(true),
  emojiFrequency: mysqlEnum("emojiFrequency", ["low", "medium", "high"]).default("medium"),
  
  // Personalidade customizada (prompt adicional)
  customPersonality: text("customPersonality"), // Instruções extras para a IA
  
  // Informações do Personal (para a IA usar)
  personalBio: text("personalBio"), // Bio do personal para a IA apresentar
  servicesOffered: text("servicesOffered"), // JSON array de serviços oferecidos
  workingHoursDescription: text("workingHoursDescription"), // Descrição dos horários
  locationDescription: text("locationDescription"), // Onde atende (academia, domicílio, online)
  priceRange: varchar("priceRange", { length: 255 }), // Faixa de preço (ex: "R$ 150-300/sessão")
  
  // Configurações de Atendimento
  isEnabled: boolean("isEnabled").default(true),
  enabledForLeads: boolean("enabledForLeads").default(true),
  enabledForStudents: boolean("enabledForStudents").default(true),
  
  // Horário de atendimento automático
  autoReplyEnabled: boolean("autoReplyEnabled").default(true),
  autoReplyStartHour: int("autoReplyStartHour").default(8), // 8h
  autoReplyEndHour: int("autoReplyEndHour").default(22), // 22h
  autoReplyWeekends: boolean("autoReplyWeekends").default(true),
  
  // Mensagens personalizadas
  welcomeMessageLead: text("welcomeMessageLead"), // Mensagem de boas-vindas para leads
  welcomeMessageStudent: text("welcomeMessageStudent"), // Mensagem de boas-vindas para alunos
  awayMessage: text("awayMessage"), // Mensagem fora do horário
  
  // Regras de Escalação
  escalateOnKeywords: text("escalateOnKeywords"), // JSON array de palavras que escalam para humano
  escalateAfterMessages: int("escalateAfterMessages").default(10), // Escalar após X mensagens sem resolução
  escalateOnSentiment: boolean("escalateOnSentiment").default(true), // Escalar se detectar frustração
  
  // Funcionalidades habilitadas
  canScheduleEvaluation: boolean("canScheduleEvaluation").default(true), // Pode agendar avaliação
  canScheduleSession: boolean("canScheduleSession").default(true), // Pode agendar sessão
  canAnswerWorkoutQuestions: boolean("canAnswerWorkoutQuestions").default(true), // Pode responder sobre treinos
  canAnswerDietQuestions: boolean("canAnswerDietQuestions").default(true), // Pode responder sobre dieta
  canSendMotivation: boolean("canSendMotivation").default(true), // Pode enviar motivação
  canHandlePayments: boolean("canHandlePayments").default(false), // Pode falar sobre pagamentos
  
  // Delay humanizado (em segundos)
  minResponseDelay: int("minResponseDelay").default(2),
  maxResponseDelay: int("maxResponseDelay").default(8),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAssistantConfig = typeof aiAssistantConfig.$inferSelect;
export type InsertAiAssistantConfig = typeof aiAssistantConfig.$inferInsert;

// ==================== LEADS (Visitantes/Potenciais Clientes) ====================
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Identificação
  phone: varchar("phone", { length: 20 }).notNull(), // Telefone do WhatsApp
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  
  // Informações coletadas pela IA
  mainGoal: varchar("mainGoal", { length: 255 }), // Objetivo principal
  currentActivity: varchar("currentActivity", { length: 255 }), // Atividade atual
  availability: text("availability"), // Disponibilidade de horários
  budget: varchar("budget", { length: 100 }), // Orçamento
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium"), // Urgência
  notes: text("notes"), // Notas adicionais coletadas
  
  // Qualificação
  temperature: mysqlEnum("temperature", ["cold", "warm", "hot"]).default("warm"),
  score: int("score").default(0), // Score de 0-100
  
  // Status
  status: mysqlEnum("status", ["new", "contacted", "qualified", "scheduled", "converted", "lost"]).default("new"),
  lostReason: varchar("lostReason", { length: 255 }), // Motivo da perda
  
  // Agendamento
  evaluationScheduledAt: timestamp("evaluationScheduledAt"),
  evaluationNotes: text("evaluationNotes"),
  
  // Conversão
  convertedToStudentId: int("convertedToStudentId").references(() => students.id),
  convertedAt: timestamp("convertedAt"),
  
  // Origem
  source: mysqlEnum("source", ["whatsapp", "instagram", "website", "referral", "other"]).default("whatsapp"),
  sourceDetails: varchar("sourceDetails", { length: 255 }), // Detalhes da origem
  
  // Follow-up
  lastContactAt: timestamp("lastContactAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  followUpCount: int("followUpCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ==================== AI CONVERSATIONS (Conversas da IA) ====================
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Tipo de conversa
  conversationType: mysqlEnum("conversationType", ["lead", "student"]).notNull(),
  
  // Referência (lead ou aluno)
  leadId: int("leadId").references(() => leads.id),
  studentId: int("studentId").references(() => students.id),
  
  // Identificação WhatsApp
  whatsappPhone: varchar("whatsappPhone", { length: 20 }).notNull(),
  
  // Status da conversa
  status: mysqlEnum("status", ["active", "paused", "escalated", "closed"]).default("active"),
  escalatedAt: timestamp("escalatedAt"),
  escalationReason: varchar("escalationReason", { length: 255 }),
  
  // Contexto da conversa (memória de curto prazo)
  currentContext: text("currentContext"), // JSON com contexto atual
  currentIntent: varchar("currentIntent", { length: 100 }), // Intenção atual detectada
  
  // Métricas
  messageCount: int("messageCount").default(0),
  aiMessageCount: int("aiMessageCount").default(0),
  humanMessageCount: int("humanMessageCount").default(0),
  
  // Satisfação
  satisfactionRating: int("satisfactionRating"), // 1-5
  satisfactionFeedback: text("satisfactionFeedback"),
  
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// ==================== AI MESSAGES (Mensagens da IA) ====================
export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => aiConversations.id),
  
  // Remetente
  sender: mysqlEnum("sender", ["user", "ai", "personal"]).notNull(),
  
  // Conteúdo
  message: text("message").notNull(),
  messageType: mysqlEnum("messageType", ["text", "audio", "image", "video", "file"]).default("text"),
  mediaUrl: text("mediaUrl"),
  
  // Metadados da IA (quando sender = 'ai')
  aiModel: varchar("aiModel", { length: 100 }), // Modelo usado
  aiPromptTokens: int("aiPromptTokens"), // Tokens do prompt
  aiCompletionTokens: int("aiCompletionTokens"), // Tokens da resposta
  aiLatencyMs: int("aiLatencyMs"), // Latência em ms
  
  // Análise da mensagem do usuário (quando sender = 'user')
  detectedIntent: varchar("detectedIntent", { length: 100 }), // Intenção detectada
  detectedSentiment: mysqlEnum("detectedSentiment", ["positive", "neutral", "negative"]),
  detectedUrgency: mysqlEnum("detectedUrgency", ["low", "medium", "high"]),
  
  // Ações tomadas pela IA
  actionsTaken: text("actionsTaken"), // JSON array de ações (ex: ["scheduled_evaluation", "sent_workout_info"])
  
  // Status de entrega (WhatsApp)
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "delivered", "read", "failed"]).default("pending"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  failureReason: varchar("failureReason", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// ==================== AI MEMORY (Memória de Longo Prazo da IA) ====================
export const aiMemory = mysqlTable("ai_memory", {
  id: int("id").autoincrement().primaryKey(),
  personalId: int("personalId").notNull().references(() => personals.id),
  
  // Referência (lead ou aluno)
  leadId: int("leadId").references(() => leads.id),
  studentId: int("studentId").references(() => students.id),
  
  // Tipo de memória
  memoryType: mysqlEnum("memoryType", [
    "preference", // Preferência do usuário
    "fact", // Fato sobre o usuário
    "goal", // Objetivo mencionado
    "concern", // Preocupação/problema
    "feedback", // Feedback dado
    "interaction", // Interação importante
    "context" // Contexto geral
  ]).notNull(),
  
  // Conteúdo
  key: varchar("key", { length: 255 }).notNull(), // Chave identificadora (ex: "preferred_time", "injury_history")
  value: text("value").notNull(), // Valor da memória
  
  // Importância
  importance: mysqlEnum("importance", ["low", "medium", "high", "critical"]).default("medium"),
  
  // Validade
  expiresAt: timestamp("expiresAt"), // Algumas memórias podem expirar
  
  // Origem
  sourceMessageId: int("sourceMessageId").references(() => aiMessages.id), // Mensagem que originou a memória
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiMemory = typeof aiMemory.$inferSelect;
export type InsertAiMemory = typeof aiMemory.$inferInsert;
