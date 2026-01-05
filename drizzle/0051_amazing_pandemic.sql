CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateKey` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`textContent` text,
	`senderType` enum('default','convites','avisos','cobranca','sistema','contato') NOT NULL DEFAULT 'default',
	`isActive` boolean NOT NULL DEFAULT true,
	`variables` text,
	`previewData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_templates_templateKey_unique` UNIQUE(`templateKey`)
);
