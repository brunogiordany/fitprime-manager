CREATE TABLE `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`visitorName` varchar(255),
	`visitorEmail` varchar(320),
	`visitorPhone` varchar(20),
	`status` enum('active','closed','waiting') NOT NULL DEFAULT 'active',
	`assignedToPersonalId` int,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`source` enum('landing','website','app') NOT NULL DEFAULT 'landing',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_conversations_visitorId_unique` UNIQUE(`visitorId`)
);
--> statement-breakpoint
CREATE TABLE `chat_support_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sender` enum('visitor','ai','personal') NOT NULL,
	`senderName` varchar(255),
	`message` text NOT NULL,
	`isAutoReply` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personal_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`planId` varchar(50) NOT NULL,
	`planName` varchar(100) NOT NULL,
	`country` enum('BR','US') NOT NULL DEFAULT 'BR',
	`studentLimit` int NOT NULL,
	`currentStudents` int NOT NULL DEFAULT 0,
	`extraStudents` int NOT NULL DEFAULT 0,
	`planPrice` decimal(10,2) NOT NULL,
	`extraStudentPrice` decimal(10,2) NOT NULL,
	`currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` enum('active','trial','past_due','cancelled','expired') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`lastExtraCharge` decimal(10,2) DEFAULT '0',
	`lastExtraChargeAt` timestamp,
	`accumulatedExtraCharge` decimal(10,2) DEFAULT '0',
	`accumulatedExtraStudents` int DEFAULT 0,
	`lastAccumulationReset` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`beforePhotoId` int NOT NULL,
	`afterPhotoId` int NOT NULL,
	`analysisType` enum('evolution','single','comprehensive') DEFAULT 'evolution',
	`analysis` text NOT NULL,
	`analysisJson` text,
	`overallProgress` int,
	`muscleGain` int,
	`fatLoss` int,
	`postureImprovement` int,
	`measurementId` int,
	`daysBetween` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` enum('student','personal','system') DEFAULT 'system',
	CONSTRAINT `photo_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalStarts` int DEFAULT 0,
	`totalCompletions` int DEFAULT 0,
	`totalQualified` int DEFAULT 0,
	`totalDisqualified` int DEFAULT 0,
	`viewedPricing` int DEFAULT 0,
	`clickedCta` int DEFAULT 0,
	`convertedTrial` int DEFAULT 0,
	`convertedPaid` int DEFAULT 0,
	`profileBeginner` int DEFAULT 0,
	`profileStarter` int DEFAULT 0,
	`profilePro` int DEFAULT 0,
	`profileBusiness` int DEFAULT 0,
	`painDistribution` text,
	`sourceDistribution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(255) NOT NULL,
	`sessionId` varchar(255),
	`studentsCount` varchar(50),
	`revenue` varchar(50),
	`managementPain` varchar(50),
	`timePain` varchar(50),
	`retentionPain` varchar(50),
	`billingPain` varchar(50),
	`priority` varchar(50),
	`allAnswers` text,
	`recommendedProfile` varchar(50),
	`recommendedPlan` varchar(100),
	`totalScore` int,
	`identifiedPains` text,
	`isQualified` boolean DEFAULT true,
	`disqualificationReason` varchar(255),
	`viewedPricing` boolean DEFAULT false,
	`clickedCta` boolean DEFAULT false,
	`selectedPlan` varchar(100),
	`convertedToTrial` boolean DEFAULT false,
	`convertedToPaid` boolean DEFAULT false,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`utmContent` varchar(255),
	`utmTerm` varchar(255),
	`referrer` varchar(500),
	`landingPage` varchar(500),
	`userAgent` text,
	`deviceType` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`eventType` enum('student_added','student_removed','limit_exceeded','extra_charged','plan_upgraded','plan_downgraded','upgrade_suggested','payment_failed','subscription_renewed') NOT NULL,
	`previousValue` int,
	`newValue` int,
	`chargeAmount` decimal(10,2),
	`currency` enum('BRL','USD') DEFAULT 'BRL',
	`details` text,
	`stripeInvoiceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_log_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogId` int NOT NULL,
	`exerciseId` int,
	`orderIndex` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`muscleGroup` varchar(100),
	`plannedSets` int,
	`plannedReps` varchar(20),
	`plannedRest` int,
	`completedSets` int DEFAULT 0,
	`totalReps` int DEFAULT 0,
	`totalVolume` decimal(10,2) DEFAULT '0',
	`maxWeight` decimal(6,2),
	`notes` text,
	`isCompleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_log_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_log_sets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogExerciseId` int NOT NULL,
	`setNumber` int NOT NULL,
	`setType` enum('warmup','feeler','working','drop','rest_pause','failure') DEFAULT 'working',
	`weight` decimal(6,2),
	`reps` int,
	`restTime` int,
	`isDropSet` boolean DEFAULT false,
	`dropWeight` decimal(6,2),
	`dropReps` int,
	`isRestPause` boolean DEFAULT false,
	`restPauseWeight` decimal(6,2),
	`restPauseReps` int,
	`restPausePause` int,
	`rpe` int,
	`isCompleted` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_log_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_log_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogId` int NOT NULL,
	`workoutLogExerciseId` int,
	`workoutLogSetId` int,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`suggestionType` enum('weight_change','reps_change','exercise_change','add_set','remove_set','note','other') NOT NULL,
	`originalValue` text,
	`suggestedValue` text,
	`reason` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_log_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `exercise_logs` DROP FOREIGN KEY `exercise_logs_workoutLogId_workout_logs_id_fk`;
--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `message` text;--> statement-breakpoint
ALTER TABLE `pending_changes` MODIFY COLUMN `entityType` enum('student','anamnesis','measurement','workout') NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_logs` MODIFY COLUMN `workoutId` int;--> statement-breakpoint
ALTER TABLE `workout_logs` MODIFY COLUMN `workoutDayId` int;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `messageType` enum('text','audio','image','video','file','link') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `mediaName` varchar(255);--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `mediaMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `mediaSize` int;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `mediaDuration` int;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `audioTranscription` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `linkPreviewTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `linkPreviewDescription` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `linkPreviewImage` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `linkPreviewUrl` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `isEdited` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `editedAt` timestamp;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `originalMessage` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `deletedForSender` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `deletedForAll` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `measurements` ADD `bioFileUrl` text;--> statement-breakpoint
ALTER TABLE `measurements` ADD `bioFileKey` text;--> statement-breakpoint
ALTER TABLE `measurements` ADD `bioAiAnalysis` text;--> statement-breakpoint
ALTER TABLE `measurements` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `personals` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `personals` ADD `testAccessEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `personals` ADD `testAccessGrantedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `personals` ADD `testAccessGrantedAt` timestamp;--> statement-breakpoint
ALTER TABLE `photos` ADD `poseId` varchar(100);--> statement-breakpoint
ALTER TABLE `photos` ADD `aiAnalysis` text;--> statement-breakpoint
ALTER TABLE `photos` ADD `aiAnalyzedAt` timestamp;--> statement-breakpoint
ALTER TABLE `photos` ADD `bodyFatEstimate` decimal(5,2);--> statement-breakpoint
ALTER TABLE `photos` ADD `muscleScore` int;--> statement-breakpoint
ALTER TABLE `photos` ADD `postureScore` int;--> statement-breakpoint
ALTER TABLE `students` ADD `lastAnalyzedAt` timestamp;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `sessionId` int;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `trainingDate` date NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `dayName` varchar(100);--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `startTime` varchar(5);--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `endTime` varchar(5);--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `totalDuration` int;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `totalSets` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `totalReps` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `totalVolume` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `totalExercises` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `feeling` enum('great','good','normal','tired','exhausted');--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `status` enum('in_progress','completed','cancelled') DEFAULT 'in_progress';--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `hasPendingSuggestions` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_assignedToPersonalId_personals_id_fk` FOREIGN KEY (`assignedToPersonalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_support_messages` ADD CONSTRAINT `chat_support_messages_conversationId_chat_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personal_subscriptions` ADD CONSTRAINT `personal_subscriptions_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_analyses` ADD CONSTRAINT `photo_analyses_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_analyses` ADD CONSTRAINT `photo_analyses_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_analyses` ADD CONSTRAINT `photo_analyses_beforePhotoId_photos_id_fk` FOREIGN KEY (`beforePhotoId`) REFERENCES `photos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_analyses` ADD CONSTRAINT `photo_analyses_afterPhotoId_photos_id_fk` FOREIGN KEY (`afterPhotoId`) REFERENCES `photos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_analyses` ADD CONSTRAINT `photo_analyses_measurementId_measurements_id_fk` FOREIGN KEY (`measurementId`) REFERENCES `measurements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_usage_logs` ADD CONSTRAINT `subscription_usage_logs_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_usage_logs` ADD CONSTRAINT `subscription_usage_logs_subscriptionId_personal_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `personal_subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_exercises` ADD CONSTRAINT `workout_log_exercises_workoutLogId_workout_logs_id_fk` FOREIGN KEY (`workoutLogId`) REFERENCES `workout_logs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_exercises` ADD CONSTRAINT `workout_log_exercises_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_sets` ADD CONSTRAINT `workout_log_sets_workoutLogExerciseId_workout_log_exercises_id_fk` FOREIGN KEY (`workoutLogExerciseId`) REFERENCES `workout_log_exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_suggestions` ADD CONSTRAINT `workout_log_suggestions_workoutLogId_workout_logs_id_fk` FOREIGN KEY (`workoutLogId`) REFERENCES `workout_logs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_suggestions` ADD CONSTRAINT `workout_log_suggestions_workoutLogExerciseId_workout_log_exercises_id_fk` FOREIGN KEY (`workoutLogExerciseId`) REFERENCES `workout_log_exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_suggestions` ADD CONSTRAINT `workout_log_suggestions_workoutLogSetId_workout_log_sets_id_fk` FOREIGN KEY (`workoutLogSetId`) REFERENCES `workout_log_sets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_suggestions` ADD CONSTRAINT `workout_log_suggestions_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_log_suggestions` ADD CONSTRAINT `workout_log_suggestions_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD CONSTRAINT `workout_logs_sessionId_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` DROP COLUMN `sessionDate`;--> statement-breakpoint
ALTER TABLE `workout_logs` DROP COLUMN `sessionNumber`;--> statement-breakpoint
ALTER TABLE `workout_logs` DROP COLUMN `duration`;--> statement-breakpoint
ALTER TABLE `workout_logs` DROP COLUMN `completed`;