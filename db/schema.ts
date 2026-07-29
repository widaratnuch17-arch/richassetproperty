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
  consent: integer("consent", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
