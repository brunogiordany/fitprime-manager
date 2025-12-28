ALTER TABLE `students` ADD `hasChildren` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `students` ADD `maritalStatus` enum('single','married','divorced','widowed','other');