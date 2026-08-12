import { desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from ".";
import { managedProperties, propertyEvents, propertyInquiries } from "./schema";

export const propertyEventTypes = ["view", "phone_click", "line_click", "share_click"] as const;
export type PropertyEventType = (typeof propertyEventTypes)[number];

export const propertyInquiryStatuses = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "won",
  "closed",
] as const;
export type PropertyInquiryStatus = (typeof propertyInquiryStatuses)[number];

export type Attribution = {
  source: string;
  medium: string | null;
  campaign: string | null;
  referrerHost?: string | null;
};

export type PropertyPerformanceEvent = {
  propertyId: string;
  eventType: PropertyEventType;
  source: string;
  medium: string | null;
  campaign: string | null;
  createdAt: string;
};

export type PropertyInquiry = {
  id: number;
  propertyId: string;
  fullName: string;
  phone: string;
  lineId: string | null;
  message: string | null;
  source: string;
  medium: string | null;
  campaign: string | null;
  status: PropertyInquiryStatus;
  adminNotes: string | null;
  nextFollowUp: string | null;
  appointmentAt: string | null;
  offerAmount: number | null;
  salePrice: number | null;
  commissionIncome: number | null;
  dealExpenses: number;
  closedAt: string | null;
  consent: boolean;
  createdAt: string;
  updatedAt: string | null;
};

function sinceDate(days: number) {
  if (days <= 0) return null;
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toInquiry(row: typeof propertyInquiries.$inferSelect): PropertyInquiry {
  return {
    ...row,
    status: propertyInquiryStatuses.includes(row.status as PropertyInquiryStatus)
      ? (row.status as PropertyInquiryStatus)
      : "new",
  };
}

export async function recordPropertyEvent(values: {
  id: string;
  propertyId: string;
  eventType: PropertyEventType;
  attribution: Attribution;
}) {
  await getDb()
    .insert(propertyEvents)
    .values({
      id: values.id,
      propertyId: values.propertyId,
      eventType: values.eventType,
      source: values.attribution.source,
      medium: values.attribution.medium,
      campaign: values.attribution.campaign,
      referrerHost: values.attribution.referrerHost ?? null,
    })
    .onConflictDoNothing();
}

export async function createPropertyInquiry(values: {
  propertyId: string;
  fullName: string;
  phone: string;
  lineId: string | null;
  message: string | null;
  attribution: Attribution;
  consent: boolean;
}) {
  const [inquiry] = await getDb()
    .insert(propertyInquiries)
    .values({
      propertyId: values.propertyId,
      fullName: values.fullName,
      phone: values.phone,
      lineId: values.lineId,
      message: values.message,
      source: values.attribution.source,
      medium: values.attribution.medium,
      campaign: values.attribution.campaign,
      consent: values.consent,
    })
    .returning();
  return toInquiry(inquiry);
}

export async function getPropertyPerformance(days: number) {
  const since = sinceDate(days);
  const db = getDb();
  const eventWhere = since ? gte(propertyEvents.createdAt, since) : undefined;
  const inquiryWhere = since ? gte(propertyInquiries.createdAt, since) : undefined;
  const [eventRows, inquiryRows] = await Promise.all([
    db.select({
      propertyId: propertyEvents.propertyId,
      eventType: propertyEvents.eventType,
      source: propertyEvents.source,
      medium: propertyEvents.medium,
      campaign: propertyEvents.campaign,
      createdAt: propertyEvents.createdAt,
    }).from(propertyEvents).where(eventWhere).orderBy(desc(propertyEvents.createdAt)),
    db.select().from(propertyInquiries).where(inquiryWhere).orderBy(desc(propertyInquiries.createdAt)),
  ]);

  return {
    events: eventRows.filter((row): row is PropertyPerformanceEvent =>
      propertyEventTypes.includes(row.eventType as PropertyEventType),
    ),
    inquiries: inquiryRows.map(toInquiry),
  };
}

export async function updatePropertyInquiry(
  id: number,
  values: {
    status: PropertyInquiryStatus;
    adminNotes: string | null;
    nextFollowUp: string | null;
    appointmentAt: string | null;
    offerAmount: number | null;
    salePrice: number | null;
    commissionIncome: number | null;
    dealExpenses: number;
    closedAt: string | null;
  },
) {
  const [row] = await getDb()
    .update(propertyInquiries)
    .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(propertyInquiries.id, id))
    .returning();
  return row ? toInquiry(row) : undefined;
}

export async function getPropertyInquiries() {
  const rows = await getDb()
    .select()
    .from(propertyInquiries)
    .orderBy(desc(propertyInquiries.createdAt), desc(propertyInquiries.id));
  return rows.map(toInquiry);
}

export async function propertyExists(propertyId: string) {
  const [{ count }] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(managedProperties)
    .where(eq(managedProperties.id, propertyId));
  return count > 0;
}
