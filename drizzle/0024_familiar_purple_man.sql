ALTER TABLE `anamneses` ADD `dailyCalories` int;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `doesCardio` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `cardioActivities` text;--> statement-breakpoint
ALTER TABLE `measurements` ADD `estimatedBMR` decimal(7,2);