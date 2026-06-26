ALTER TABLE `meetings` ADD `schedule_cron_task_uid` varchar(65);--> statement-breakpoint
CREATE INDEX `meeting_schedule_cron_task_uid_idx` ON `meetings` (`schedule_cron_task_uid`);