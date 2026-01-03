CREATE TABLE `cakto_webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event` varchar(100) NOT NULL,
	`orderId` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(20),
	`productId` varchar(255),
	`amount` decimal(10,2),
	`action` varchar(50) NOT NULL,
	`actionResult` enum('success','failed','skipped') DEFAULT 'success',
	`actionDetails` text,
	`rawPayload` text,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cakto_webhook_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pending_activations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`name` varchar(255),
	`cpf` varchar(14),
	`caktoOrderId` varchar(255) NOT NULL,
	`caktoSubscriptionId` varchar(255),
	`productId` varchar(255),
	`productName` varchar(255),
	`amount` decimal(10,2),
	`paymentMethod` varchar(50),
	`planType` enum('beginner','starter','pro','business','premium','enterprise'),
	`activationToken` varchar(255) NOT NULL,
	`tokenExpiresAt` timestamp NOT NULL,
	`status` enum('pending','activated','expired') NOT NULL DEFAULT 'pending',
	`activatedAt` timestamp,
	`activatedUserId` int,
	`welcomeEmailSentAt` timestamp,
	`reminderEmailSentAt` timestamp,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pending_activations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pending_activations_caktoOrderId_unique` UNIQUE(`caktoOrderId`),
	CONSTRAINT `pending_activations_activationToken_unique` UNIQUE(`activationToken`)
);
--> statement-breakpoint
ALTER TABLE `pending_activations` ADD CONSTRAINT `pending_activations_activatedUserId_users_id_fk` FOREIGN KEY (`activatedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;