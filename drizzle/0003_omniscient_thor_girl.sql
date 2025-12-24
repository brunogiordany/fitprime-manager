CREATE TABLE `exercise_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`set1Weight` varchar(20),
	`set1Reps` int,
	`set2Weight` varchar(20),
	`set2Reps` int,
	`set3Weight` varchar(20),
	`set3Reps` int,
	`set4Weight` varchar(20),
	`set4Reps` int,
	`set5Weight` varchar(20),
	`set5Reps` int,
	`notes` text,
	`completed` boolean DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutId` int NOT NULL,
	`workoutDayId` int NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`sessionNumber` int DEFAULT 1,
	`duration` int,
	`notes` text,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `exercise_logs` ADD CONSTRAINT `exercise_logs_workoutLogId_workout_logs_id_fk` FOREIGN KEY (`workoutLogId`) REFERENCES `workout_logs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercise_logs` ADD CONSTRAINT `exercise_logs_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD CONSTRAINT `workout_logs_workoutId_workouts_id_fk` FOREIGN KEY (`workoutId`) REFERENCES `workouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD CONSTRAINT `workout_logs_workoutDayId_workout_days_id_fk` FOREIGN KEY (`workoutDayId`) REFERENCES `workout_days`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD CONSTRAINT `workout_logs_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD CONSTRAINT `workout_logs_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;