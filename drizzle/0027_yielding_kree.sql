CREATE TABLE `student_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`badgeType` enum('first_session','streak_7','streak_30','streak_90','perfect_month','sessions_10','sessions_50','sessions_100','first_measurement','weight_goal','body_fat_goal','muscle_gain','profile_complete','early_bird','night_owl','weekend_warrior','anniversary_1','comeback') NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` text,
	CONSTRAINT `student_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `student_badges` ADD CONSTRAINT `student_badges_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_badges` ADD CONSTRAINT `student_badges_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;