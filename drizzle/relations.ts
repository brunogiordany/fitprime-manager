import { relations } from "drizzle-orm/relations";
import { students, anamneses, personals, anamnesisHistory, users, automations, charges, packages, chatMessages, workoutLogs, exerciseLogs, exercises, workoutDays, materials, measurements, messageLog, messageQueue, plans, passwordResetTokens, payments, pendingChanges, photoAnalyses, photos, sessions, sessionFeedback, workouts, studentBadges, studentInvites, workoutLogExercises, workoutLogSets, workoutLogSuggestions } from "./schema";

export const anamnesesRelations = relations(anamneses, ({one, many}) => ({
	student: one(students, {
		fields: [anamneses.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [anamneses.personalId],
		references: [personals.id]
	}),
	anamnesisHistories: many(anamnesisHistory),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	anamneses: many(anamneses),
	anamnesisHistories: many(anamnesisHistory),
	charges: many(charges),
	chatMessages: many(chatMessages),
	materials: many(materials),
	measurements: many(measurements),
	messageLogs: many(messageLog),
	messageQueues: many(messageQueue),
	packages: many(packages),
	payments: many(payments),
	pendingChanges: many(pendingChanges),
	photoAnalyses: many(photoAnalyses),
	photos: many(photos),
	sessionFeedbacks: many(sessionFeedback),
	sessions: many(sessions),
	studentBadges: many(studentBadges),
	studentInvites: many(studentInvites),
	personal: one(personals, {
		fields: [students.personalId],
		references: [personals.id]
	}),
	user: one(users, {
		fields: [students.userId],
		references: [users.id]
	}),
	workoutLogSuggestions: many(workoutLogSuggestions),
	workoutLogs: many(workoutLogs),
	workouts: many(workouts),
}));

export const personalsRelations = relations(personals, ({one, many}) => ({
	anamneses: many(anamneses),
	automations: many(automations),
	charges: many(charges),
	chatMessages: many(chatMessages),
	materials: many(materials),
	measurements: many(measurements),
	messageLogs: many(messageLog),
	messageQueues: many(messageQueue),
	packages: many(packages),
	payments: many(payments),
	pendingChanges: many(pendingChanges),
	user: one(users, {
		fields: [personals.userId],
		references: [users.id]
	}),
	photoAnalyses: many(photoAnalyses),
	photos: many(photos),
	plans: many(plans),
	sessionFeedbacks: many(sessionFeedback),
	sessions: many(sessions),
	studentBadges: many(studentBadges),
	studentInvites: many(studentInvites),
	students: many(students),
	workoutLogSuggestions: many(workoutLogSuggestions),
	workoutLogs: many(workoutLogs),
	workouts: many(workouts),
}));

export const anamnesisHistoryRelations = relations(anamnesisHistory, ({one}) => ({
	anamnesis: one(anamneses, {
		fields: [anamnesisHistory.anamnesisId],
		references: [anamneses.id]
	}),
	student: one(students, {
		fields: [anamnesisHistory.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [anamnesisHistory.changedBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	anamnesisHistories: many(anamnesisHistory),
	passwordResetTokens: many(passwordResetTokens),
	personals: many(personals),
	students: many(students),
}));

export const automationsRelations = relations(automations, ({one, many}) => ({
	personal: one(personals, {
		fields: [automations.personalId],
		references: [personals.id]
	}),
	messageLogs: many(messageLog),
	messageQueues: many(messageQueue),
}));

export const chargesRelations = relations(charges, ({one, many}) => ({
	student: one(students, {
		fields: [charges.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [charges.personalId],
		references: [personals.id]
	}),
	package: one(packages, {
		fields: [charges.packageId],
		references: [packages.id]
	}),
	payments: many(payments),
}));

export const packagesRelations = relations(packages, ({one, many}) => ({
	charges: many(charges),
	student: one(students, {
		fields: [packages.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [packages.personalId],
		references: [personals.id]
	}),
	plan: one(plans, {
		fields: [packages.planId],
		references: [plans.id]
	}),
	sessions: many(sessions),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	personal: one(personals, {
		fields: [chatMessages.personalId],
		references: [personals.id]
	}),
	student: one(students, {
		fields: [chatMessages.studentId],
		references: [students.id]
	}),
}));

export const exerciseLogsRelations = relations(exerciseLogs, ({one}) => ({
	workoutLog: one(workoutLogs, {
		fields: [exerciseLogs.workoutLogId],
		references: [workoutLogs.id]
	}),
	exercise: one(exercises, {
		fields: [exerciseLogs.exerciseId],
		references: [exercises.id]
	}),
}));

export const workoutLogsRelations = relations(workoutLogs, ({one, many}) => ({
	exerciseLogs: many(exerciseLogs),
	workoutLogExercises: many(workoutLogExercises),
	workoutLogSuggestions: many(workoutLogSuggestions),
	workout: one(workouts, {
		fields: [workoutLogs.workoutId],
		references: [workouts.id]
	}),
	workoutDay: one(workoutDays, {
		fields: [workoutLogs.workoutDayId],
		references: [workoutDays.id]
	}),
	student: one(students, {
		fields: [workoutLogs.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [workoutLogs.personalId],
		references: [personals.id]
	}),
}));

export const exercisesRelations = relations(exercises, ({one, many}) => ({
	exerciseLogs: many(exerciseLogs),
	workoutDay: one(workoutDays, {
		fields: [exercises.workoutDayId],
		references: [workoutDays.id]
	}),
	workoutLogExercises: many(workoutLogExercises),
}));

export const workoutDaysRelations = relations(workoutDays, ({one, many}) => ({
	exercises: many(exercises),
	workout: one(workouts, {
		fields: [workoutDays.workoutId],
		references: [workouts.id]
	}),
	workoutLogs: many(workoutLogs),
}));

export const materialsRelations = relations(materials, ({one}) => ({
	student: one(students, {
		fields: [materials.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [materials.personalId],
		references: [personals.id]
	}),
}));

export const measurementsRelations = relations(measurements, ({one, many}) => ({
	student: one(students, {
		fields: [measurements.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [measurements.personalId],
		references: [personals.id]
	}),
	photoAnalyses: many(photoAnalyses),
}));

export const messageLogRelations = relations(messageLog, ({one}) => ({
	personal: one(personals, {
		fields: [messageLog.personalId],
		references: [personals.id]
	}),
	student: one(students, {
		fields: [messageLog.studentId],
		references: [students.id]
	}),
	automation: one(automations, {
		fields: [messageLog.automationId],
		references: [automations.id]
	}),
	messageQueue: one(messageQueue, {
		fields: [messageLog.messageQueueId],
		references: [messageQueue.id]
	}),
}));

export const messageQueueRelations = relations(messageQueue, ({one, many}) => ({
	messageLogs: many(messageLog),
	personal: one(personals, {
		fields: [messageQueue.personalId],
		references: [personals.id]
	}),
	student: one(students, {
		fields: [messageQueue.studentId],
		references: [students.id]
	}),
	automation: one(automations, {
		fields: [messageQueue.automationId],
		references: [automations.id]
	}),
}));

export const plansRelations = relations(plans, ({one, many}) => ({
	packages: many(packages),
	personal: one(personals, {
		fields: [plans.personalId],
		references: [personals.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	charge: one(charges, {
		fields: [payments.chargeId],
		references: [charges.id]
	}),
	student: one(students, {
		fields: [payments.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [payments.personalId],
		references: [personals.id]
	}),
}));

export const pendingChangesRelations = relations(pendingChanges, ({one}) => ({
	personal: one(personals, {
		fields: [pendingChanges.personalId],
		references: [personals.id]
	}),
	student: one(students, {
		fields: [pendingChanges.studentId],
		references: [students.id]
	}),
}));

export const photoAnalysesRelations = relations(photoAnalyses, ({one}) => ({
	student: one(students, {
		fields: [photoAnalyses.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [photoAnalyses.personalId],
		references: [personals.id]
	}),
	photo_beforePhotoId: one(photos, {
		fields: [photoAnalyses.beforePhotoId],
		references: [photos.id],
		relationName: "photoAnalyses_beforePhotoId_photos_id"
	}),
	photo_afterPhotoId: one(photos, {
		fields: [photoAnalyses.afterPhotoId],
		references: [photos.id],
		relationName: "photoAnalyses_afterPhotoId_photos_id"
	}),
	measurement: one(measurements, {
		fields: [photoAnalyses.measurementId],
		references: [measurements.id]
	}),
}));

export const photosRelations = relations(photos, ({one, many}) => ({
	photoAnalyses_beforePhotoId: many(photoAnalyses, {
		relationName: "photoAnalyses_beforePhotoId_photos_id"
	}),
	photoAnalyses_afterPhotoId: many(photoAnalyses, {
		relationName: "photoAnalyses_afterPhotoId_photos_id"
	}),
	student: one(students, {
		fields: [photos.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [photos.personalId],
		references: [personals.id]
	}),
}));

export const sessionFeedbackRelations = relations(sessionFeedback, ({one}) => ({
	session: one(sessions, {
		fields: [sessionFeedback.sessionId],
		references: [sessions.id]
	}),
	student: one(students, {
		fields: [sessionFeedback.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [sessionFeedback.personalId],
		references: [personals.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one, many}) => ({
	sessionFeedbacks: many(sessionFeedback),
	student: one(students, {
		fields: [sessions.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [sessions.personalId],
		references: [personals.id]
	}),
	package: one(packages, {
		fields: [sessions.packageId],
		references: [packages.id]
	}),
	workout: one(workouts, {
		fields: [sessions.workoutId],
		references: [workouts.id]
	}),
}));

export const workoutsRelations = relations(workouts, ({one, many}) => ({
	sessions: many(sessions),
	workoutDays: many(workoutDays),
	workoutLogs: many(workoutLogs),
	student: one(students, {
		fields: [workouts.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [workouts.personalId],
		references: [personals.id]
	}),
}));

export const studentBadgesRelations = relations(studentBadges, ({one}) => ({
	student: one(students, {
		fields: [studentBadges.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [studentBadges.personalId],
		references: [personals.id]
	}),
}));

export const studentInvitesRelations = relations(studentInvites, ({one}) => ({
	personal: one(personals, {
		fields: [studentInvites.personalId],
		references: [personals.id]
	}),
	student: one(students, {
		fields: [studentInvites.studentId],
		references: [students.id]
	}),
}));

export const workoutLogExercisesRelations = relations(workoutLogExercises, ({one, many}) => ({
	workoutLog: one(workoutLogs, {
		fields: [workoutLogExercises.workoutLogId],
		references: [workoutLogs.id]
	}),
	exercise: one(exercises, {
		fields: [workoutLogExercises.exerciseId],
		references: [exercises.id]
	}),
	workoutLogSets: many(workoutLogSets),
	workoutLogSuggestions: many(workoutLogSuggestions),
}));

export const workoutLogSetsRelations = relations(workoutLogSets, ({one, many}) => ({
	workoutLogExercise: one(workoutLogExercises, {
		fields: [workoutLogSets.workoutLogExerciseId],
		references: [workoutLogExercises.id]
	}),
	workoutLogSuggestions: many(workoutLogSuggestions),
}));

export const workoutLogSuggestionsRelations = relations(workoutLogSuggestions, ({one}) => ({
	workoutLog: one(workoutLogs, {
		fields: [workoutLogSuggestions.workoutLogId],
		references: [workoutLogs.id]
	}),
	workoutLogExercise: one(workoutLogExercises, {
		fields: [workoutLogSuggestions.workoutLogExerciseId],
		references: [workoutLogExercises.id]
	}),
	workoutLogSet: one(workoutLogSets, {
		fields: [workoutLogSuggestions.workoutLogSetId],
		references: [workoutLogSets.id]
	}),
	student: one(students, {
		fields: [workoutLogSuggestions.studentId],
		references: [students.id]
	}),
	personal: one(personals, {
		fields: [workoutLogSuggestions.personalId],
		references: [personals.id]
	}),
}));