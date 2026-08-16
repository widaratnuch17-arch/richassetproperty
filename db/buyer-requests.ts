import { desc, eq, sql } from "drizzle-orm";
import { getDb } from ".";
import { buyerRequests } from "./schema";

export const buyerRequestStatuses = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "won",
  "closed",
] as const;

export type BuyerRequestStatus = (typeof buyerRequestStatuses)[number];

export type BuyerRequest = {
  id: number;
  fullName: string;
  phone: string;
  lineId: string | null;
  propertyType: string;
  preferredLocations: string;
  budgetRange: string;
  bedrooms: number | null;
  timeline: string;
  financing: string;
  details: string | null;
  source: string;
  medium: string | null;
  campaign: string | null;
  referrerHost: string | null;
  status: BuyerRequestStatus;
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

function toBuyerRequest(row: typeof buyerRequests.$inferSelect): BuyerRequest {
  return {
    ...row,
    status: buyerRequestStatuses.includes(row.status as BuyerRequestStatus)
      ? (row.status as BuyerRequestStatus)
      : "new",
  };
}

export async function getBuyerRequests(): Promise<BuyerRequest[]> {
  const rows = await getDb()
    .select()
    .from(buyerRequests)
    .orderBy(desc(buyerRequests.createdAt), desc(buyerRequests.id));
  return rows.map(toBuyerRequest);
}

export async function updateBuyerRequest(
  id: number,
  values: {
    status: BuyerRequestStatus;
    adminNotes: string | null;
    nextFollowUp: string | null;
    appointmentAt: string | null;
    offerAmount: number | null;
    salePrice: number | null;
    commissionIncome: number | null;
    dealExpenses: number;
    closedAt: string | null;
  },
): Promise<BuyerRequest | undefined> {
  const [row] = await getDb()
    .update(buyerRequests)
    .set({
      ...values,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(buyerRequests.id, id))
    .returning();

  return row ? toBuyerRequest(row) : undefined;
}
