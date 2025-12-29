ALTER TABLE `anamneses` MODIFY COLUMN `mainGoal` enum('weight_loss','muscle_gain','recomposition','conditioning','health','rehabilitation','sports','bulking','cutting','other');--> statement-breakpoint
ALTER TABLE `anamneses` ADD `trainingLocation` enum('full_gym','home_gym','home_basic','outdoor','studio');--> statement-breakpoint
ALTER TABLE `anamneses` ADD `availableEquipment` text;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `weeklyFrequency` int;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `sessionDuration` int;