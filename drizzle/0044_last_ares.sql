CREATE TABLE `admin_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`targetType` varchar(50),
	`targetId` int,
	`targetName` varchar(255),
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`aiAssistantEnabled` boolean NOT NULL DEFAULT false,
	`whatsappIntegrationEnabled` boolean NOT NULL DEFAULT true,
	`stripePaymentsEnabled` boolean NOT NULL DEFAULT true,
	`advancedReportsEnabled` boolean NOT NULL DEFAULT true,
	`aiWorkoutGenerationEnabled` boolean NOT NULL DEFAULT true,
	`aiAnalysisEnabled` boolean NOT NULL DEFAULT true,
	`bulkMessagingEnabled` boolean NOT NULL DEFAULT true,
	`automationsEnabled` boolean NOT NULL DEFAULT true,
	`studentPortalEnabled` boolean NOT NULL DEFAULT true,
	`enabledBy` varchar(255),
	`enabledAt` timestamp,
	`disabledReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` varchar(500),
	`category` varchar(50) DEFAULT 'general',
	`updatedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `admin_activity_log` ADD CONSTRAINT `admin_activity_log_adminUserId_users_id_fk` FOREIGN KEY (`adminUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feature_flags` ADD CONSTRAINT `feature_flags_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;