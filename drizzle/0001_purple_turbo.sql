CREATE TABLE `anamneses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`occupation` varchar(255),
	`lifestyle` enum('sedentary','light','moderate','active','very_active'),
	`sleepHours` int,
	`sleepQuality` enum('poor','fair','good','excellent'),
	`stressLevel` enum('low','moderate','high','very_high'),
	`medicalHistory` text,
	`injuries` text,
	`surgeries` text,
	`medications` text,
	`allergies` text,
	`mainGoal` enum('weight_loss','muscle_gain','conditioning','health','rehabilitation','sports','other'),
	`secondaryGoals` text,
	`targetWeight` decimal(5,2),
	`motivation` text,
	`mealsPerDay` int,
	`waterIntake` decimal(4,2),
	`dietRestrictions` text,
	`supplements` text,
	`exerciseExperience` enum('none','beginner','intermediate','advanced'),
	`previousActivities` text,
	`availableDays` text,
	`preferredTime` enum('morning','afternoon','evening','flexible'),
	`observations` text,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamneses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anamnesis_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anamnesisId` int NOT NULL,
	`studentId` int NOT NULL,
	`changes` text NOT NULL,
	`changedBy` int NOT NULL,
	`version` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anamnesis_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`trigger` enum('session_reminder','session_confirmation','payment_reminder','payment_overdue','birthday','inactive_student','welcome','custom') NOT NULL,
	`messageTemplate` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`triggerHoursBefore` int,
	`triggerDaysAfter` int,
	`sendWindowStart` varchar(5),
	`sendWindowEnd` varchar(5),
	`maxMessagesPerDay` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`packageId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`dueDate` date NOT NULL,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('pix','credit_card','debit_card','cash','transfer','other'),
	`paidAt` timestamp,
	`paidAmount` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutDayId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`muscleGroup` varchar(100),
	`sets` int DEFAULT 3,
	`reps` varchar(50),
	`weight` varchar(50),
	`restSeconds` int DEFAULT 60,
	`tempo` varchar(20),
	`notes` text,
	`videoUrl` varchar(500),
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int,
	`personalId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('pdf','video','image','link','other') DEFAULT 'other',
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(255),
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`measureDate` date NOT NULL,
	`weight` decimal(5,2),
	`height` decimal(5,2),
	`bodyFat` decimal(5,2),
	`muscleMass` decimal(5,2),
	`chest` decimal(5,2),
	`waist` decimal(5,2),
	`hip` decimal(5,2),
	`rightArm` decimal(5,2),
	`leftArm` decimal(5,2),
	`rightThigh` decimal(5,2),
	`leftThigh` decimal(5,2),
	`rightCalf` decimal(5,2),
	`leftCalf` decimal(5,2),
	`neck` decimal(5,2),
	`bmi` decimal(5,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`studentId` int NOT NULL,
	`automationId` int,
	`messageQueueId` int,
	`direction` enum('outbound','inbound') NOT NULL,
	`phone` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` enum('sent','delivered','read','failed') DEFAULT 'sent',
	`evolutionMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`studentId` int NOT NULL,
	`automationId` int,
	`phone` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','expired','cancelled','pending') NOT NULL DEFAULT 'pending',
	`startDate` date NOT NULL,
	`endDate` date,
	`totalSessions` int,
	`usedSessions` int DEFAULT 0,
	`remainingSessions` int,
	`price` decimal(10,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chargeId` int NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('pix','credit_card','debit_card','cash','transfer','other') NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`transactionId` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255),
	`cref` varchar(50),
	`bio` text,
	`specialties` text,
	`workingHours` text,
	`whatsappNumber` varchar(20),
	`evolutionApiKey` varchar(255),
	`evolutionInstance` varchar(255),
	`subscriptionStatus` enum('active','trial','expired','cancelled') NOT NULL DEFAULT 'trial',
	`subscriptionPeriod` enum('monthly','quarterly','semiannual','annual') DEFAULT 'monthly',
	`subscriptionExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`category` enum('front','back','side_left','side_right','other') DEFAULT 'other',
	`photoDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('recurring','fixed','sessions') NOT NULL,
	`billingCycle` enum('weekly','biweekly','monthly'),
	`durationMonths` int,
	`totalSessions` int,
	`price` decimal(10,2) NOT NULL,
	`sessionsPerWeek` int,
	`sessionDuration` int DEFAULT 60,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`packageId` int,
	`scheduledAt` timestamp NOT NULL,
	`duration` int DEFAULT 60,
	`status` enum('scheduled','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`type` enum('regular','trial','makeup','extra') DEFAULT 'regular',
	`location` varchar(255),
	`notes` text,
	`cancelReason` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`birthDate` date,
	`gender` enum('male','female','other'),
	`cpf` varchar(14),
	`address` text,
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`notes` text,
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`whatsappOptIn` boolean DEFAULT true,
	`avatarUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutId` int NOT NULL,
	`dayOfWeek` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
	`name` varchar(100),
	`notes` text,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('strength','cardio','flexibility','functional','mixed') DEFAULT 'strength',
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
	`startDate` date,
	`endDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','personal','student') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `anamneses` ADD CONSTRAINT `anamneses_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anamneses` ADD CONSTRAINT `anamneses_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anamnesis_history` ADD CONSTRAINT `anamnesis_history_anamnesisId_anamneses_id_fk` FOREIGN KEY (`anamnesisId`) REFERENCES `anamneses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anamnesis_history` ADD CONSTRAINT `anamnesis_history_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anamnesis_history` ADD CONSTRAINT `anamnesis_history_changedBy_users_id_fk` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automations` ADD CONSTRAINT `automations_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `charges` ADD CONSTRAINT `charges_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `charges` ADD CONSTRAINT `charges_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `charges` ADD CONSTRAINT `charges_packageId_packages_id_fk` FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_workoutDayId_workout_days_id_fk` FOREIGN KEY (`workoutDayId`) REFERENCES `workout_days`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `measurements` ADD CONSTRAINT `measurements_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `measurements` ADD CONSTRAINT `measurements_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_automationId_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_messageQueueId_message_queue_id_fk` FOREIGN KEY (`messageQueueId`) REFERENCES `message_queue`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_queue` ADD CONSTRAINT `message_queue_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_queue` ADD CONSTRAINT `message_queue_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_queue` ADD CONSTRAINT `message_queue_automationId_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_chargeId_charges_id_fk` FOREIGN KEY (`chargeId`) REFERENCES `charges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personals` ADD CONSTRAINT `personals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photos` ADD CONSTRAINT `photos_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photos` ADD CONSTRAINT `photos_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plans` ADD CONSTRAINT `plans_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_packageId_packages_id_fk` FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_days` ADD CONSTRAINT `workout_days_workoutId_workouts_id_fk` FOREIGN KEY (`workoutId`) REFERENCES `workouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workouts` ADD CONSTRAINT `workouts_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workouts` ADD CONSTRAINT `workouts_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;