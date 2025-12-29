ALTER TABLE `students` MODIFY COLUMN `canEditAnamnesis` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `canEditMeasurements` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canEditPhotos` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canViewCharges` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canScheduleSessions` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canCancelSessions` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canSendMessages` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `students` ADD `canViewWorkouts` boolean DEFAULT true;