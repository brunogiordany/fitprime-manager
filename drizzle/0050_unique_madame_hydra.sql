CREATE TABLE `fitness_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`provider` enum('strava','garmin','apple_health','google_fit','fitbit','polar','suunto','coros','manual_import') NOT NULL,
	`status` enum('connected','disconnected','expired','error') NOT NULL DEFAULT 'disconnected',
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`externalAthleteId` varchar(100),
	`externalUsername` varchar(100),
	`externalProfileUrl` varchar(500),
	`autoSync` boolean DEFAULT true,
	`syncActivities` boolean DEFAULT true,
	`lastSyncAt` timestamp,
	`lastSyncStatus` enum('success','partial','failed'),
	`lastSyncError` text,
	`authorizedScopes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fitness_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `synced_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`studentId` int NOT NULL,
	`personalId` int NOT NULL,
	`cardioLogId` int,
	`externalActivityId` varchar(100) NOT NULL,
	`provider` enum('strava','garmin','apple_health','google_fit','fitbit','polar','suunto','coros','manual_import') NOT NULL,
	`activityName` varchar(255),
	`activityType` varchar(100),
	`sportType` varchar(100),
	`startDate` timestamp NOT NULL,
	`startDateLocal` timestamp,
	`timezone` varchar(100),
	`distanceMeters` decimal(10,2),
	`movingTimeSeconds` int,
	`elapsedTimeSeconds` int,
	`totalElevationGain` decimal(8,2),
	`averageSpeed` decimal(6,2),
	`maxSpeed` decimal(6,2),
	`averageHeartrate` int,
	`maxHeartrate` int,
	`calories` int,
	`averageCadence` decimal(5,1),
	`averageWatts` int,
	`maxWatts` int,
	`startLatlng` varchar(50),
	`endLatlng` varchar(50),
	`rawData` json,
	`syncStatus` enum('synced','converted','ignored','error') DEFAULT 'synced',
	`convertedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `synced_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fitness_integrations` ADD CONSTRAINT `fitness_integrations_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fitness_integrations` ADD CONSTRAINT `fitness_integrations_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_activities` ADD CONSTRAINT `synced_activities_integrationId_fitness_integrations_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `fitness_integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_activities` ADD CONSTRAINT `synced_activities_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_activities` ADD CONSTRAINT `synced_activities_personalId_personals_id_fk` FOREIGN KEY (`personalId`) REFERENCES `personals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_activities` ADD CONSTRAINT `synced_activities_cardioLogId_cardio_logs_id_fk` FOREIGN KEY (`cardioLogId`) REFERENCES `cardio_logs`(`id`) ON DELETE no action ON UPDATE no action;