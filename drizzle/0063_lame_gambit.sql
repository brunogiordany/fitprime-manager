CREATE TABLE `admin_whatsapp_automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` enum('lead_trial_signup','lead_trial_2days_before','lead_trial_expired','lead_followup_7days','personal_payment_2days','personal_payment_dueday','personal_payment_overdue','personal_payment_confirmed','personal_reengagement_30days','custom') NOT NULL,
	`targetType` enum('lead','personal','both') DEFAULT 'lead',
	`messageTemplate` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`delayMinutes` int DEFAULT 0,
	`sendWindowStart` varchar(5) DEFAULT '08:00',
	`sendWindowEnd` varchar(5) DEFAULT '20:00',
	`sendOnWeekends` boolean DEFAULT false,
	`excludeExistingPersonals` boolean DEFAULT true,
	`excludeRecentMessages` int DEFAULT 24,
	`totalSent` int DEFAULT 0,
	`totalDelivered` int DEFAULT 0,
	`totalRead` int DEFAULT 0,
	`totalReplied` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_whatsapp_automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_whatsapp_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stevoApiKey` varchar(255),
	`stevoInstanceName` varchar(255),
	`stevoServer` varchar(50) DEFAULT 'sm15',
	`stevoWebhookToken` varchar(255),
	`connectionStatus` enum('disconnected','connecting','connected','error') DEFAULT 'disconnected',
	`lastConnectedAt` timestamp,
	`lastErrorMessage` text,
	`connectedPhone` varchar(20),
	`connectedName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_whatsapp_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('lead','personal') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientPhone` varchar(20) NOT NULL,
	`recipientName` varchar(255),
	`direction` enum('outbound','inbound') NOT NULL,
	`message` text NOT NULL,
	`messageType` enum('text','image','document','audio','video') DEFAULT 'text',
	`mediaUrl` varchar(500),
	`automationId` int,
	`status` enum('pending','sent','delivered','read','failed') DEFAULT 'pending',
	`stevoMessageId` varchar(255),
	`errorMessage` text,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_whatsapp_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('lead','personal') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientPhone` varchar(20) NOT NULL,
	`recipientName` varchar(255),
	`message` text NOT NULL,
	`automationId` int,
	`status` enum('pending','processing','sent','failed','cancelled') DEFAULT 'pending',
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`scheduledAt` timestamp NOT NULL,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_whatsapp_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_whatsapp_messages` ADD CONSTRAINT `admin_whatsapp_messages_automationId_admin_whatsapp_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `admin_whatsapp_automations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_whatsapp_queue` ADD CONSTRAINT `admin_whatsapp_queue_automationId_admin_whatsapp_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `admin_whatsapp_automations`(`id`) ON DELETE no action ON UPDATE no action;