CREATE TABLE `lead_funnel_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`fromStage` varchar(50),
	`toStage` varchar(50) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`changedBy` varchar(50) DEFAULT 'system',
	`reason` text,
	CONSTRAINT `lead_funnel_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_funnel_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`stage` enum('new_lead','quiz_started','quiz_completed','trial_started','trial_active','trial_expiring','trial_expired','converted','lost','reengagement') NOT NULL DEFAULT 'new_lead',
	`previousStage` varchar(50),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`changedBy` varchar(50) DEFAULT 'system',
	`notes` text,
	CONSTRAINT `lead_funnel_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_bulk_send_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(50) NOT NULL,
	`leadId` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sending','sent','failed','cancelled') DEFAULT 'pending',
	`whatsappNumberId` int,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`delayMs` int DEFAULT 6000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_bulk_send_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_daily_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`whatsappNumberId` int,
	`messagesSent` int DEFAULT 0,
	`messagesReceived` int DEFAULT 0,
	`messagesFailed` int DEFAULT 0,
	`conversationsStarted` int DEFAULT 0,
	`messagesNewLeads` int DEFAULT 0,
	`messagesTrialActive` int DEFAULT 0,
	`messagesTrialExpiring` int DEFAULT 0,
	`messagesConverted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_daily_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_message_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stage` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`variables` text,
	`isDefault` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_message_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`stevoApiKey` varchar(255),
	`stevoInstanceName` varchar(255),
	`stevoServer` varchar(50) DEFAULT 'sm15',
	`status` enum('disconnected','connecting','connected','error','banned') DEFAULT 'disconnected',
	`lastConnectedAt` timestamp,
	`lastErrorMessage` text,
	`dailyMessageLimit` int DEFAULT 200,
	`messagesSentToday` int DEFAULT 0,
	`lastMessageSentAt` timestamp,
	`lastLimitResetAt` timestamp,
	`totalMessagesSent` int DEFAULT 0,
	`totalMessagesReceived` int DEFAULT 0,
	`totalConversations` int DEFAULT 0,
	`priority` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_numbers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `whatsapp_bulk_send_queue` ADD CONSTRAINT `whatsapp_bulk_send_queue_whatsappNumberId_whatsapp_numbers_id_fk` FOREIGN KEY (`whatsappNumberId`) REFERENCES `whatsapp_numbers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `whatsapp_daily_stats` ADD CONSTRAINT `whatsapp_daily_stats_whatsappNumberId_whatsapp_numbers_id_fk` FOREIGN KEY (`whatsappNumberId`) REFERENCES `whatsapp_numbers`(`id`) ON DELETE no action ON UPDATE no action;