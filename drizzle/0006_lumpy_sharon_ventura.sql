ALTER TABLE `property_inquiries` ADD `appointment_at` text;--> statement-breakpoint
ALTER TABLE `property_inquiries` ADD `offer_amount` integer;--> statement-breakpoint
ALTER TABLE `property_inquiries` ADD `sale_price` integer;--> statement-breakpoint
ALTER TABLE `property_inquiries` ADD `commission_income` integer;--> statement-breakpoint
ALTER TABLE `property_inquiries` ADD `deal_expenses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `property_inquiries` ADD `closed_at` text;--> statement-breakpoint
CREATE INDEX `idx_property_inquiries_closed_at` ON `property_inquiries` (`closed_at`);--> statement-breakpoint
PRAGMA optimize;
