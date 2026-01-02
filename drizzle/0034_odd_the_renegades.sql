CREATE TABLE `ab_test_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isControl` boolean DEFAULT false,
	`blocks` text,
	`settings` text,
	`impressions` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`totalTimeOnPage` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_test_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`originalPageId` int NOT NULL,
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`trafficSplit` int DEFAULT 50,
	`goalType` enum('conversion','click','time_on_page','scroll_depth') DEFAULT 'conversion',
	`goalValue` varchar(255),
	`winnerId` int,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int,
	`filename` varchar(255) NOT NULL,
	`originalFilename` varchar(255),
	`url` varchar(500) NOT NULL,
	`type` enum('image','video','icon','document','other') DEFAULT 'image',
	`mimeType` varchar(100),
	`width` int,
	`height` int,
	`fileSize` int,
	`alt` varchar(255),
	`caption` text,
	`tags` text,
	`thumbnailUrl` varchar(500),
	`mediumUrl` varchar(500),
	`largeUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`blockType` varchar(50) NOT NULL,
	`blockId` varchar(100) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`content` text,
	`delay` int DEFAULT 0,
	`animation` varchar(50),
	`animationDuration` int DEFAULT 500,
	`videoSync` boolean DEFAULT false,
	`videoTimestamp` int,
	`videoId` varchar(100),
	`isVisible` boolean DEFAULT true,
	`visibilityCondition` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ab_test_variants` ADD CONSTRAINT `ab_test_variants_testId_ab_tests_id_fk` FOREIGN KEY (`testId`) REFERENCES `ab_tests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ab_tests` ADD CONSTRAINT `ab_tests_originalPageId_site_pages_id_fk` FOREIGN KEY (`originalPageId`) REFERENCES `site_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_assets` ADD CONSTRAINT `page_assets_pageId_site_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `site_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_blocks` ADD CONSTRAINT `page_blocks_pageId_site_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `site_pages`(`id`) ON DELETE no action ON UPDATE no action;