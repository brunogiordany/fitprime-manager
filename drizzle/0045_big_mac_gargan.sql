ALTER TABLE `personals` ADD `nutritionBetaEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `personals` ADD `nutritionBetaEnabledAt` timestamp;--> statement-breakpoint
ALTER TABLE `personals` ADD `nutritionBetaEnabledBy` varchar(255);--> statement-breakpoint
ALTER TABLE `personals` ADD `crn` varchar(50);