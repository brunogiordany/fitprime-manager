CREATE TABLE `pending_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personalId` int NOT NULL,
	`studentId` int NOT NULL,
	`entityType` enum('student','anamnesis','measurement') NOT NULL,
	`entityId` int NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`requestedBy` enum('student','personal') NOT NULL,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pending_changes` ADD CONSTRAINT `pending_changes_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_changes` ADD CONSTRAINT `pending_changes_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;