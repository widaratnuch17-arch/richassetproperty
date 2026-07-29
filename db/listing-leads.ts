import { desc, eq, sql } from "drizzle-orm";
import { getDb } from ".";
import { listingLeads } from "./schema";

export const listingLeadStatuses = [
  "new",
  "contacted",
  "evaluating",
  "appointment",
  "won",
  "closed",
] as const;

export type ListingLeadStatus = (typeof listingLeadStatuses)[number];

export type ListingLead = {
  id: number;
  fullName: string;
  phone: string;
  lineId: string | null;
  propertyType: string;
  location: string;
  askingPrice: string | null;
  timeline: string | null;
  details: string | null;
  source: string;
  status: ListingLeadStatus;
  adminNotes: string | null;
  nextFollowUp: string | null;
  consent: boolean;
  createdAt: string;
  updatedAt: string | null;
};

function toListingLead(row: typeof listingLeads.$inferSelect): ListingLead {
  return {
    ...row,
    status: listingLeadStatuses.includes(row.status as ListingLeadStatus)
      ? (row.status as ListingLeadStatus)
      : "new",
  };
}

export async function getListingLeads(): Promise<ListingLead[]> {
  const rows = await getDb()
    .select()
    .from(listingLeads)
    .orderBy(desc(listingLeads.createdAt), desc(listingLeads.id));
  return rows.map(toListingLead);
}

export async function updateListingLead(
  id: number,
  values: {
    status: ListingLeadStatus;
    adminNotes: string | null;
    nextFollowUp: string | null;
  },
): Promise<ListingLead | undefined> {
  const [row] = await getDb()
    .update(listingLeads)
    .set({
      ...values,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(listingLeads.id, id))
    .returning();

  return row ? toListingLead(row) : undefined;
}
