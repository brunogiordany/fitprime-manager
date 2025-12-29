CREATE TABLE `session_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`energyLevel` int,
	`painLevel` int,
	`satisfactionLevel` int,
	`difficultyLevel` int,
	`highlights` text,
	`improvements` text,
	`notes` text,
	`mood` enum('great','good','neutral','tired','exhausted'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_sessionId_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;