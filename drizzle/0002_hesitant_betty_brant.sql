ALTER TABLE `plans` MODIFY COLUMN `billingCycle` enum('weekly','biweekly','monthly','quarterly','semiannual','annual');--> statement-breakpoint
ALTER TABLE `plans` ADD `billingDay` int DEFAULT 5;