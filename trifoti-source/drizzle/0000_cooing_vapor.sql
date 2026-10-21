CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`status` text DEFAULT 'Новая' NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`contact_method` text NOT NULL,
	`project_type` text NOT NULL,
	`project_format` text NOT NULL,
	`budget` text NOT NULL,
	`deadline` text DEFAULT '' NOT NULL,
	`details` text NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_public_id_unique` ON `leads` (`public_id`);