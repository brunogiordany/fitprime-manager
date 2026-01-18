CREATE TABLE `lead_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`tagId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` varchar(50) DEFAULT 'system',
	CONSTRAINT `lead_tag_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#6b7280',
	`description` text,
	`isAutomatic` boolean DEFAULT false,
	`autoRule` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lead_tag_assignments` ADD CONSTRAINT `lead_tag_assignments_tagId_lead_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `lead_tags`(`id`) ON DELETE no action ON UPDATE no action;