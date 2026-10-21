CREATE TABLE `lead_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`storage_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lead_files_storage_key_unique` ON `lead_files` (`storage_key`);--> statement-breakpoint
ALTER TABLE `leads` ADD `public_token` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `estimate_min` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `estimate_max` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `estimate_summary` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `utm_source` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `utm_medium` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `utm_campaign` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `referrer` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `leads_public_token_unique` ON `leads` (`public_token`);