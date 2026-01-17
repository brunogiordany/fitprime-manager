ALTER TABLE `quiz_responses` ADD `personalId` int;--> statement-breakpoint
ALTER TABLE `quiz_responses` ADD `converted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `quiz_responses` ADD `mergedIntoId` int;--> statement-breakpoint
ALTER TABLE `quiz_responses` ADD `mergedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quiz_responses` ADD CONSTRAINT `quiz_responses_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;