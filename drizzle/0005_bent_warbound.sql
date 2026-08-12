CREATE TABLE `property_events` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`event_type` text NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`medium` text,
	`campaign` text,
	`referrer_host` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `managed_properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_property_events_property_created_at` ON `property_events` (`property_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_property_events_type_created_at` ON `property_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_property_events_source_created_at` ON `property_events` (`source`,`created_at`);--> statement-breakpoint
CREATE TABLE `property_inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`line_id` text,
	`message` text,
	`source` text DEFAULT 'direct' NOT NULL,
	`medium` text,
	`campaign` text,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_notes` text,
	`next_follow_up` text,
	`consent` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`property_id`) REFERENCES `managed_properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_property_inquiries_property_created_at` ON `property_inquiries` (`property_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_property_inquiries_status_created_at` ON `property_inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_property_inquiries_source_created_at` ON `property_inquiries` (`source`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
