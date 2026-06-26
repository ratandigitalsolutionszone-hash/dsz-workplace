CREATE TABLE `daily_report_edit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_id` int NOT NULL,
	`edited_by` int NOT NULL,
	`tasks_completed` text,
	`hours_worked` decimal(5,2),
	`notes` text,
	`edited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_report_edit_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `daily_reports` ADD `last_edited_by` int;--> statement-breakpoint
ALTER TABLE `daily_reports` ADD `last_edited_at` timestamp;--> statement-breakpoint
CREATE INDEX `edit_history_report_id_idx` ON `daily_report_edit_history` (`report_id`);--> statement-breakpoint
CREATE INDEX `edit_history_edited_by_idx` ON `daily_report_edit_history` (`edited_by`);--> statement-breakpoint
CREATE INDEX `edit_history_edited_at_idx` ON `daily_report_edit_history` (`edited_at`);