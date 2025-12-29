ALTER TABLE `workouts` ADD `goal` enum('hypertrophy','weight_loss','recomposition','conditioning','strength','bulking','cutting','general') DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `workouts` ADD `isTemplate` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `workouts` ADD `generatedByAI` boolean DEFAULT false;