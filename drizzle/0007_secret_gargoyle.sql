CREATE TABLE `property_images` (
	`id` text PRIMARY KEY NOT NULL,
	`mime_type` text NOT NULL,
	`data` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_property_images_created_at` ON `property_images` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
