import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    discordId: text("discord_id").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_discord_id_unique").on(table.discordId)],
);

export const facets = sqliteTable(
  "facets",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("facets_slug_unique").on(table.slug)],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    facetId: text("facet_id").notNull().references(() => facets.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("tags_slug_unique").on(table.slug),
    index("tags_facet_idx").on(table.facetId),
  ],
);

export const tagImplications = sqliteTable(
  "tag_implications",
  {
    sourceTagId: text("source_tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    impliedTagId: text("implied_tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.sourceTagId, table.impliedTagId] })],
);

export const identities = sqliteTable(
  "identities",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    canonicalName: text("canonical_name").notNull(),
    kind: text("kind", { enum: ["fictional", "real", "group"] }).notNull(),
    imageKey: text("image_key"),
    imageSourceUrl: text("image_source_url").notNull(),
    imageCredit: text("image_credit").notNull().default(""),
    rightsStatus: text("rights_status", { enum: ["unknown", "confirmed", "restricted"] }).notNull().default("unknown"),
    rightsNotes: text("rights_notes").notNull().default(""),
    status: text("status", { enum: ["draft", "published", "unpublished"] }).notNull().default("draft"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("identities_slug_unique").on(table.slug),
    index("identities_status_idx").on(table.status),
  ],
);

export const aliases = sqliteTable(
  "identity_aliases",
  {
    id: text("id").primaryKey(),
    identityId: text("identity_id").notNull().references(() => identities.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (table) => [index("aliases_identity_idx").on(table.identityId)],
);

export const identityTags = sqliteTable(
  "identity_tags",
  {
    identityId: text("identity_id").notNull().references(() => identities.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    source: text("source", { enum: ["direct", "inferred"] }).notNull().default("direct"),
  },
  (table) => [
    primaryKey({ columns: [table.identityId, table.tagId] }),
    index("identity_tags_tag_idx").on(table.tagId),
  ],
);

export const diagnosticEvents = sqliteTable(
  "diagnostic_events",
  {
    id: text("id").primaryKey(),
    occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    event: text("event").notNull(),
    route: text("route").notNull(),
    status: integer("status"),
    contentType: text("content_type"),
    requestId: text("request_id").notNull(),
  },
  (table) => [index("diagnostic_events_occurred_at_idx").on(table.occurredAt)],
);
