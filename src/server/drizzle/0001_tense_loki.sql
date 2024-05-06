CREATE TABLE `UserLockTable` (
	`user_id` text NOT NULL,
	`lock_id` text NOT NULL,
	PRIMARY KEY(`lock_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lock_id`) REFERENCES `locks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `locks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locks_name_unique` ON `locks` (`name`);