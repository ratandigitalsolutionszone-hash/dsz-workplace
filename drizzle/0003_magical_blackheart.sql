CREATE TABLE `gmail_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`gmail_email` varchar(320) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gmail_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `gmail_tokens_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE INDEX `gmail_token_user_id_idx` ON `gmail_tokens` (`user_id`);