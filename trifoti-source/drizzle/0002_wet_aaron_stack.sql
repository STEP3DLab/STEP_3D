CREATE TABLE `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`event` text NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`source` text DEFAULT 'site' NOT NULL,
	`session_id` text NOT NULL,
	`utm_source` text DEFAULT '' NOT NULL,
	`utm_medium` text DEFAULT '' NOT NULL,
	`utm_campaign` text DEFAULT '' NOT NULL,
	`referrer` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_event_created_at_idx` ON `analytics_events` (`event`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_session_created_at_idx` ON `analytics_events` (`session_id`,`created_at`);