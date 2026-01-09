CREATE TABLE `ai_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`type` enum('cardio_nutrition','workout','diet') NOT NULL DEFAULT 'cardio_nutrition',
	`cardioSessionsPerWeek` int,
	`cardioMinutesPerSession` int,
	`cardioTypes` text,
	`cardioIntensity` varchar(50),
	`cardioTiming` varchar(255),
	`cardioNotes` text,
	`dailyCalories` int,
	`proteinGrams` int,
	`carbsGrams` int,
	`fatGrams` int,
	`mealFrequency` int,
	`hydration` varchar(100),
	`nutritionNotes` text,
	`weeklyCalorieDeficitOrSurplus` int,
	`estimatedWeeklyWeightChange` varchar(50),
	`timeToGoal` varchar(100),
	`summary` text,
	`warnings` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_recommendations` ADD CONSTRAINT `ai_recommendations_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_recommendations` ADD CONSTRAINT `ai_recommendations_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;