CREATE TABLE `identity_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_id` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`identity_id`) REFERENCES `identities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `aliases_identity_idx` ON `identity_aliases` (`identity_id`);--> statement-breakpoint
CREATE TABLE `facets` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facets_slug_unique` ON `facets` (`slug`);--> statement-breakpoint
CREATE TABLE `identities` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`canonical_name` text NOT NULL,
	`kind` text NOT NULL,
	`image_key` text,
	`image_source_url` text NOT NULL,
	`image_credit` text DEFAULT '' NOT NULL,
	`rights_status` text DEFAULT 'unknown' NOT NULL,
	`rights_notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identities_slug_unique` ON `identities` (`slug`);--> statement-breakpoint
CREATE INDEX `identities_status_idx` ON `identities` (`status`);--> statement-breakpoint
CREATE TABLE `identity_tags` (
	`identity_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	PRIMARY KEY(`identity_id`, `tag_id`),
	FOREIGN KEY (`identity_id`) REFERENCES `identities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `identity_tags_tag_idx` ON `identity_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `tag_implications` (
	`source_tag_id` text NOT NULL,
	`implied_tag_id` text NOT NULL,
	PRIMARY KEY(`source_tag_id`, `implied_tag_id`),
	FOREIGN KEY (`source_tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`implied_tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`facet_id` text NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`facet_id`) REFERENCES `facets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `tags_facet_idx` ON `tags` (`facet_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);