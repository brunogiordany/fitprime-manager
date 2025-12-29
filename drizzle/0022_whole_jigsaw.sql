ALTER TABLE `sessions` ADD `workoutId` int;--> statement-breakpoint
ALTER TABLE `sessions` ADD `workoutDayIndex` int;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_workoutId_workouts_id_fk` FOREIGN KEY (`workoutId`) REFERENCES `workouts`(`id`) ON DELETE no action ON UPDATE no action;