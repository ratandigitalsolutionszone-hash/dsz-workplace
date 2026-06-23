CREATE TABLE `email_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_id` int NOT NULL,
	`sent_by_id` int NOT NULL,
	`recipients` text NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`recipient_name` varchar(255) NOT NULL,
	`recipient_email` varchar(320) NOT NULL,
	`is_frequent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_history_report_id_idx` ON `email_history` (`report_id`);--> statement-breakpoint
CREATE INDEX `email_history_sent_by_id_idx` ON `email_history` (`sent_by_id`);--> statement-breakpoint
CREATE INDEX `email_recipient_user_id_idx` ON `email_recipients` (`user_id`);