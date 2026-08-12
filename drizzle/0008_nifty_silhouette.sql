CREATE TABLE `deleted_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`deleted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `managed_properties` ADD `is_visible` integer DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE `managed_properties`
SET `is_visible` = false, `status` = 'active'
WHERE `status` = 'hidden';
--> statement-breakpoint
PRAGMA optimize;
