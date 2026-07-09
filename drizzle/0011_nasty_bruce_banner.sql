CREATE TABLE `permission_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changed_by` int NOT NULL,
	`affected_role` enum('super_admin','admin','team_leader','employee') NOT NULL,
	`permission_id` int NOT NULL,
	`previous_value` boolean NOT NULL,
	`new_value` boolean NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permission_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` varchar(100) NOT NULL,
	`action` varchar(100) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('super_admin','admin','team_leader','employee') NOT NULL,
	`permission_id` int NOT NULL,
	`granted` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `permission_audit_changed_by_idx` ON `permission_audit_log` (`changed_by`);--> statement-breakpoint
CREATE INDEX `permission_audit_affected_role_idx` ON `permission_audit_log` (`affected_role`);--> statement-breakpoint
CREATE INDEX `permission_audit_created_at_idx` ON `permission_audit_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `permission_module_action_unique` ON `permissions` (`module`,`action`);--> statement-breakpoint
CREATE INDEX `role_permission_unique` ON `role_permissions` (`role`,`permission_id`);