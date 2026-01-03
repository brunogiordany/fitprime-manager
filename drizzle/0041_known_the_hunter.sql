CREATE TABLE `ai_assistant_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`assistantName` varchar(100) NOT NULL DEFAULT 'Assistente',
	`assistantGender` enum('male','female','neutral') DEFAULT 'female',
	`communicationTone` enum('formal','casual','motivational','friendly') DEFAULT 'friendly',
	`useEmojis` boolean DEFAULT true,
	`emojiFrequency` enum('low','medium','high') DEFAULT 'medium',
	`customPersonality` text,
	`personalBio` text,
	`servicesOffered` text,
	`workingHoursDescription` text,
	`locationDescription` text,
	`priceRange` varchar(255),
	`isEnabled` boolean DEFAULT true,
	`enabledForLeads` boolean DEFAULT true,
	`enabledForStudents` boolean DEFAULT true,
	`autoReplyEnabled` boolean DEFAULT true,
	`autoReplyStartHour` int DEFAULT 8,
	`autoReplyEndHour` int DEFAULT 22,
	`autoReplyWeekends` boolean DEFAULT true,
	`welcomeMessageLead` text,
	`welcomeMessageStudent` text,
	`awayMessage` text,
	`escalateOnKeywords` text,
	`escalateAfterMessages` int DEFAULT 10,
	`escalateOnSentiment` boolean DEFAULT true,
	`canScheduleEvaluation` boolean DEFAULT true,
	`canScheduleSession` boolean DEFAULT true,
	`canAnswerWorkoutQuestions` boolean DEFAULT true,
	`canAnswerDietQuestions` boolean DEFAULT true,
	`canSendMotivation` boolean DEFAULT true,
	`canHandlePayments` boolean DEFAULT false,
	`minResponseDelay` int DEFAULT 2,
	`maxResponseDelay` int DEFAULT 8,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_assistant_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_assistant_config_personalId_unique` UNIQUE(`personalId`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`conversationType` enum('lead','student') NOT NULL,
	`leadId` int,
	`studentId` int,
	`whatsappPhone` varchar(20) NOT NULL,
	`status` enum('active','paused','escalated','closed') DEFAULT 'active',
	`escalatedAt` timestamp,
	`escalationReason` varchar(255),
	`currentContext` text,
	`currentIntent` varchar(100),
	`messageCount` int DEFAULT 0,
	`aiMessageCount` int DEFAULT 0,
	`humanMessageCount` int DEFAULT 0,
	`satisfactionRating` int,
	`satisfactionFeedback` text,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`leadId` int,
	`studentId` int,
	`memoryType` enum('preference','fact','goal','concern','feedback','interaction','context') NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`importance` enum('low','medium','high','critical') DEFAULT 'medium',
	`expiresAt` timestamp,
	`sourceMessageId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sender` enum('user','ai','personal') NOT NULL,
	`message` text NOT NULL,
	`messageType` enum('text','audio','image','video','file') DEFAULT 'text',
	`mediaUrl` text,
	`aiModel` varchar(100),
	`aiPromptTokens` int,
	`aiCompletionTokens` int,
	`aiLatencyMs` int,
	`detectedIntent` varchar(100),
	`detectedSentiment` enum('positive','neutral','negative'),
	`detectedUrgency` enum('low','medium','high'),
	`actionsTaken` text,
	`deliveryStatus` enum('pending','sent','delivered','read','failed') DEFAULT 'pending',
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`mainGoal` varchar(255),
	`currentActivity` varchar(255),
	`availability` text,
	`budget` varchar(100),
	`urgency` enum('low','medium','high') DEFAULT 'medium',
	`notes` text,
	`temperature` enum('cold','warm','hot') DEFAULT 'warm',
	`score` int DEFAULT 0,
	`status` enum('new','contacted','qualified','scheduled','converted','lost') DEFAULT 'new',
	`lostReason` varchar(255),
	`evaluationScheduledAt` timestamp,
	`evaluationNotes` text,
	`convertedToStudentId` int,
	`convertedAt` timestamp,
	`source` enum('whatsapp','instagram','website','referral','other') DEFAULT 'whatsapp',
	`sourceDetails` varchar(255),
	`lastContactAt` timestamp,
	`nextFollowUpAt` timestamp,
	`followUpCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_assistant_config` ADD CONSTRAINT `ai_assistant_config_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_memory` ADD CONSTRAINT `ai_memory_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_memory` ADD CONSTRAINT `ai_memory_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_memory` ADD CONSTRAINT `ai_memory_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_memory` ADD CONSTRAINT `ai_memory_sourceMessageId_ai_messages_id_fk` FOREIGN KEY (`sourceMessageId`) REFERENCES `ai_messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversationId_ai_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_convertedToStudentId_students_id_fk` FOREIGN KEY (`convertedToStudentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;