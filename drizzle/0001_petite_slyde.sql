CREATE TABLE `diagnostic_events` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`event` text NOT NULL,
	`route` text NOT NULL,
	`status` integer,
	`content_type` text,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `diagnostic_events_occurred_at_idx` ON `diagnostic_events` (`occurred_at`);