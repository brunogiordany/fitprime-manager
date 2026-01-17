CREATE TABLE `personal_registration_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int,
	`email` varchar(320) NOT NULL,
	`name` text,
	`phone` varchar(20),
	`cpf` varchar(14),
	`source` enum('quiz','direct','oauth','invite','migration') DEFAULT 'direct',
	`quizResponseId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`status` enum('completed','abandoned','merged','duplicate') DEFAULT 'completed',
	`mergedIntoId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personal_registration_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `personal_registration_history` ADD CONSTRAINT `personal_registration_history_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;