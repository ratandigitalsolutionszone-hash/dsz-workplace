ALTER TABLE `employee_profiles` ADD `employee_id` varchar(50);--> statement-breakpoint
CREATE INDEX `employee_id_idx` ON `employee_profiles` (`employee_id`);