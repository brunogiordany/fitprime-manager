CREATE TABLE `page_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`date` timestamp NOT NULL,
	`views` int DEFAULT 0,
	`uniqueVisitors` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`bounces` int DEFAULT 0,
	`totalTimeOnPage` int DEFAULT 0,
	`sourceDistribution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`blocks` text,
	`settings` text,
	`versionNumber` int NOT NULL,
	`createdBy` varchar(255),
	`changeDescription` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`blocks` text,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`ogImage` varchar(500),
	`template` varchar(50),
	`settings` text,
	`totalViews` int DEFAULT 0,
	`totalConversions` int DEFAULT 0,
	`bounceRate` decimal(5,2) DEFAULT '0',
	`avgTimeOnPage` int DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tracking_pixels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('google_analytics','facebook_pixel','tiktok_pixel','google_ads','custom') NOT NULL,
	`name` varchar(255) NOT NULL,
	`pixelId` varchar(255),
	`apiKey` varchar(500),
	`apiSecret` varchar(500),
	`isActive` boolean DEFAULT true,
	`settings` text,
	`enabledEvents` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracking_pixels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `page_analytics` ADD CONSTRAINT `page_analytics_pageId_site_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `site_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_versions` ADD CONSTRAINT `page_versions_pageId_site_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `site_pages`(`id`) ON DELETE no action ON UPDATE no action;