CREATE TABLE `ai_analysis_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`analysisType` enum('complete','workout_comparison','progress','recommendation') NOT NULL DEFAULT 'complete',
	`studentName` varchar(255) NOT NULL,
	`summary` text,
	`strengths` text,
	`attentionPoints` text,
	`muscleGroupsEvolving` text,
	`muscleGroupsToFocus` text,
	`recommendations` text,
	`measurementSnapshot` text,
	`workoutSnapshot` text,
	`mainRecommendation` text,
	`mainRecommendationPriority` enum('low','medium','high') DEFAULT 'medium',
	`consistencyScore` decimal(5,2),
	`progressScore` decimal(5,2),
	`generatedWorkoutId` int,
	`sharedViaWhatsapp` boolean DEFAULT false,
	`sharedAt` timestamp,
	`exportedAsPdf` boolean DEFAULT false,
	`pdfUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_analysis_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_analysis_history` ADD CONSTRAINT `ai_analysis_history_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_analysis_history` ADD CONSTRAINT `ai_analysis_history_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_analysis_history` ADD CONSTRAINT `ai_analysis_history_generatedWorkoutId_workouts_id_fk` FOREIGN KEY (`generatedWorkoutId`) REFERENCES `workouts`(`id`) ON DELETE no action ON UPDATE no action;