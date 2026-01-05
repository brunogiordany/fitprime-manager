CREATE TABLE `cardio_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`sessionId` int,
	`workoutLogId` int,
	`cardioDate` date NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`cardioType` enum('treadmill','outdoor_run','stationary_bike','outdoor_bike','elliptical','rowing','stair_climber','swimming','jump_rope','hiit','walking','hiking','dance','boxing','crossfit','sports','other') NOT NULL,
	`cardioTypeName` varchar(100),
	`durationMinutes` int NOT NULL,
	`distanceKm` decimal(6,2),
	`caloriesBurned` int,
	`avgHeartRate` int,
	`maxHeartRate` int,
	`minHeartRate` int,
	`intensity` enum('very_light','light','moderate','vigorous','maximum') DEFAULT 'moderate',
	`avgSpeed` decimal(5,2),
	`maxSpeed` decimal(5,2),
	`avgPace` varchar(10),
	`incline` decimal(4,1),
	`resistance` int,
	`laps` int,
	`steps` int,
	`perceivedEffort` int,
	`feelingBefore` enum('terrible','bad','okay','good','great'),
	`feelingAfter` enum('terrible','bad','okay','good','great'),
	`weather` enum('indoor','sunny','cloudy','rainy','cold','hot','humid') DEFAULT 'indoor',
	`location` varchar(255),
	`notes` text,
	`registeredBy` enum('personal','student') DEFAULT 'personal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `cardio_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cardio_logs` ADD CONSTRAINT `cardio_logs_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardio_logs` ADD CONSTRAINT `cardio_logs_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardio_logs` ADD CONSTRAINT `cardio_logs_sessionId_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardio_logs` ADD CONSTRAINT `cardio_logs_workoutLogId_workout_logs_id_fk` FOREIGN KEY (`workoutLogId`) REFERENCES `workout_logs`(`id`) ON DELETE no action ON UPDATE no action;