CREATE TABLE `client_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_by_id` int NOT NULL,
	`assigned_to_id` int,
	`client_name` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`due_date` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`is_pinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`report_date` timestamp NOT NULL,
	`tasks_completed` text,
	`hours_worked` decimal(5,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`position` varchar(255),
	`department` varchar(255),
	`phone_number` varchar(20),
	`profile_photo_url` text,
	`bio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_by_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`location` varchar(255),
	`attendees` text,
	`reminder_sent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `task_created_by_id_idx` ON `client_tasks` (`created_by_id`);--> statement-breakpoint
CREATE INDEX `task_assigned_to_id_idx` ON `client_tasks` (`assigned_to_id`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `client_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `notice_author_id_idx` ON `company_notices` (`author_id`);--> statement-breakpoint
CREATE INDEX `notice_created_at_idx` ON `company_notices` (`createdAt`);--> statement-breakpoint
CREATE INDEX `report_user_id_idx` ON `daily_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `report_date_idx` ON `daily_reports` (`report_date`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `employee_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `meeting_created_by_id_idx` ON `meetings` (`created_by_id`);--> statement-breakpoint
CREATE INDEX `meeting_start_time_idx` ON `meetings` (`start_time`);