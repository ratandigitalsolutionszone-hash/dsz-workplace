CREATE TABLE `role_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`previous_role` enum('super_admin','admin','team_leader','employee') NOT NULL,
	`new_role` enum('super_admin','admin','team_leader','employee') NOT NULL,
	`changed_by` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','admin','team_leader','employee') NOT NULL DEFAULT 'employee';--> statement-breakpoint
CREATE INDEX `role_audit_user_id_idx` ON `role_audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `role_audit_changed_by_idx` ON `role_audit_log` (`changed_by`);--> statement-breakpoint
CREATE INDEX `role_audit_created_at_idx` ON `role_audit_log` (`createdAt`);