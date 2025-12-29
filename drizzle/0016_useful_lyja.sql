ALTER TABLE `students` MODIFY COLUMN `status` enum('active','inactive','pending','paused') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `students` ADD `pausedAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `pausedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `pauseReason` varchar(255);