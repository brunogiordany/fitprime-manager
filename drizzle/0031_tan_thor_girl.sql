ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` date;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_cpf_unique` UNIQUE(`cpf`);