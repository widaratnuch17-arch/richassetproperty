CREATE TABLE `content_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` text NOT NULL,
	`channel` text NOT NULL,
	`content_type` text NOT NULL,
	`destination` text,
	`scheduled_for` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`post_url` text,
	`notes` text,
	`posted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `managed_properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_schedule_status_scheduled_for` ON `content_schedule` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `idx_content_schedule_property_id` ON `content_schedule` (`property_id`);--> statement-breakpoint
PRAGMA optimize;
