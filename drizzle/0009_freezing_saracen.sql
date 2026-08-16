CREATE TABLE `buyer_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`line_id` text,
	`property_type` text NOT NULL,
	`preferred_locations` text NOT NULL,
	`budget_range` text NOT NULL,
	`bedrooms` integer,
	`timeline` text NOT NULL,
	`financing` text NOT NULL,
	`details` text,
	`source` text DEFAULT 'direct' NOT NULL,
	`medium` text,
	`campaign` text,
	`referrer_host` text,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_notes` text,
	`next_follow_up` text,
	`appointment_at` text,
	`offer_amount` integer,
	`sale_price` integer,
	`commission_income` integer,
	`deal_expenses` integer DEFAULT 0 NOT NULL,
	`closed_at` text,
	`consent` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_buyer_requests_status_created_at` ON `buyer_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_buyer_requests_source_created_at` ON `buyer_requests` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_buyer_requests_next_follow_up` ON `buyer_requests` (`next_follow_up`);