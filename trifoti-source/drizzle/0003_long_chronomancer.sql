ALTER TABLE `leads` ADD `sales_stage` text DEFAULT 'Не указан' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `quote_amount` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `paid_amount` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `lost_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `sales_revision` integer DEFAULT 0 NOT NULL;