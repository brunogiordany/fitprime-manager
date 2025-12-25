ALTER TABLE `charges` MODIFY COLUMN `paymentMethod` enum('pix','credit_card','debit_card','cash','transfer','stripe','other');--> statement-breakpoint
ALTER TABLE `charges` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `charges` ADD `stripeInvoiceId` varchar(255);--> statement-breakpoint
ALTER TABLE `packages` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `plans` ADD `stripePriceId` varchar(255);--> statement-breakpoint
ALTER TABLE `plans` ADD `stripeProductId` varchar(255);--> statement-breakpoint
ALTER TABLE `students` ADD `stripeCustomerId` varchar(255);