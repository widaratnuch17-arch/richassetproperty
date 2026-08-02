import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
