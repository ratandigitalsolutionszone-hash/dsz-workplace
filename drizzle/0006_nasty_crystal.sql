CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_id` int NOT NULL,
	`user_id` int NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_id` int NOT NULL,
	`report_id` int NOT NULL,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`team_leader_id` int NOT NULL,
	`created_by` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `team_members_team_id_idx` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_members_user_id_idx` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `team_members_team_user_unique` ON `team_members` (`team_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `team_reports_team_id_idx` ON `team_reports` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_reports_report_id_idx` ON `team_reports` (`report_id`);--> statement-breakpoint
CREATE INDEX `team_reports_team_report_unique` ON `team_reports` (`team_id`,`report_id`);--> statement-breakpoint
CREATE INDEX `team_leader_id_idx` ON `teams` (`team_leader_id`);--> statement-breakpoint
CREATE INDEX `team_created_by_idx` ON `teams` (`created_by`);