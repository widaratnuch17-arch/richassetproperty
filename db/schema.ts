import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const listingLeads = sqliteTable("listing_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id"),
  propertyType: text("property_type").notNull(),
  location: text("location").notNull(),
  askingPrice: text("asking_price"),
  timeline: text("timeline"),
  details: text("details"),
  source: text("source").notNull().default("website"),
  status: text("status").notNull().default("new"),
  adminNotes: text("admin_notes"),
  nextFollowUp: text("next_follow_up"),
  consent: integer("consent", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at"),
});

export const managedProperties = sqliteTable("managed_properties", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  price: text("price").notNull(),
  land: text("land").notNull(),
  usableArea: text("usable_area").notNull(),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  parking: integer("parking").notNull().default(0),
  summary: text("summary").notNull(),
  highlights: text("highlights").notNull().default("[]"),
  nearby: text("nearby").notNull().default("[]"),
  mapUrl: text("map_url").notNull().default(""),
  images: text("images").notNull().default("[]"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminLoginAttempts = sqliteTable("admin_login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: integer("window_started_at").notNull(),
  blockedUntil: integer("blocked_until"),
});

export const contentSchedule = sqliteTable(
  "content_schedule",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: text("property_id")
      .notNull()
      .references(() => managedProperties.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    contentType: text("content_type").notNull(),
    destination: text("destination"),
    scheduledFor: text("scheduled_for").notNull(),
    status: text("status").notNull().default("planned"),
    postUrl: text("post_url"),
    notes: text("notes"),
    postedAt: text("posted_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_content_schedule_status_scheduled_for").on(
      table.status,
      table.scheduledFor,
    ),
    index("idx_content_schedule_property_id").on(table.propertyId),
  ],
);

export const propertyEvents = sqliteTable(
  "property_events",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => managedProperties.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    source: text("source").notNull().default("direct"),
    medium: text("medium"),
    campaign: text("campaign"),
    referrerHost: text("referrer_host"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_property_events_property_created_at").on(table.propertyId, table.createdAt),
    index("idx_property_events_type_created_at").on(table.eventType, table.createdAt),
    index("idx_property_events_source_created_at").on(table.source, table.createdAt),
  ],
);

export const propertyInquiries = sqliteTable(
  "property_inquiries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: text("property_id")
      .notNull()
      .references(() => managedProperties.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    lineId: text("line_id"),
    message: text("message"),
    source: text("source").notNull().default("direct"),
    medium: text("medium"),
    campaign: text("campaign"),
    status: text("status").notNull().default("new"),
    adminNotes: text("admin_notes"),
    nextFollowUp: text("next_follow_up"),
    consent: integer("consent", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("idx_property_inquiries_property_created_at").on(table.propertyId, table.createdAt),
    index("idx_property_inquiries_status_created_at").on(table.status, table.createdAt),
    index("idx_property_inquiries_source_created_at").on(table.source, table.createdAt),
  ],
);
