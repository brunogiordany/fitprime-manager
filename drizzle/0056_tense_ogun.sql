CREATE TABLE `email_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`leadEmail` varchar(320) NOT NULL,
	`sequenceId` int NOT NULL,
	`templateId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('pending','sent','failed','bounced','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`errorMessage` text,
	`resendId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` enum('quiz_completed','quiz_qualified','quiz_disqualified','days_without_conversion','manual') NOT NULL,
	`triggerDays` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailSendId` int NOT NULL,
	`eventType` enum('open','click','unsubscribe') NOT NULL,
	`linkUrl` varchar(500),
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_email_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadEmail` varchar(320) NOT NULL,
	`isSubscribed` boolean NOT NULL DEFAULT true,
	`unsubscribedAt` timestamp,
	`unsubscribeReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_email_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_email_subscriptions_leadEmail_unique` UNIQUE(`leadEmail`)
);
--> statement-breakpoint
CREATE TABLE `lead_email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`textContent` text,
	`delayDays` int NOT NULL DEFAULT 0,
	`delayHours` int NOT NULL DEFAULT 0,
	`position` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_sends` ADD CONSTRAINT `email_sends_sequenceId_email_sequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `email_sequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_sends` ADD CONSTRAINT `email_sends_templateId_lead_email_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `lead_email_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_tracking` ADD CONSTRAINT `email_tracking_emailSendId_email_sends_id_fk` FOREIGN KEY (`emailSendId`) REFERENCES `email_sends`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_email_templates` ADD CONSTRAINT `lead_email_templates_sequenceId_email_sequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `email_sequences`(`id`) ON DELETE no action ON UPDATE no action;