import { asc, eq, sql } from "drizzle-orm";
import { getDb } from ".";
import { contentSchedule } from "./schema";

export type ContentChannel =
  | "facebook"
  | "tiktok"
  | "youtube"
  | "lemon8"
  | "line_voom"
  | "property_portal";

export type ContentType = "facebook" | "shortCaption" | "portal";
export type ContentScheduleStatus = "planned" | "posted";

export type ContentScheduleItem = {
  id: number;
  propertyId: string;
  channel: ContentChannel;
  contentType: ContentType;
  destination: string | null;
  scheduledFor: string;
  status: ContentScheduleStatus;
  postUrl: string | null;
  notes: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewContentScheduleItem = Omit<
  ContentScheduleItem,
  "id" | "status" | "postUrl" | "postedAt" | "createdAt" | "updatedAt"
>;

function toItem(row: typeof contentSchedule.$inferSelect): ContentScheduleItem {
  return {
    ...row,
    channel: row.channel as ContentChannel,
    contentType: row.contentType as ContentType,
    status: row.status as ContentScheduleStatus,
  };
}

export async function getContentSchedule(): Promise<ContentScheduleItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentSchedule)
    .orderBy(asc(contentSchedule.scheduledFor), asc(contentSchedule.id));
  return rows.map(toItem);
}

export async function createContentScheduleItem(input: NewContentScheduleItem) {
  const db = getDb();
  const [row] = await db
    .insert(contentSchedule)
    .values(input)
    .returning();
  return toItem(row);
}

export async function updateContentScheduleItem(
  id: number,
  values: Partial<
    Pick<
      ContentScheduleItem,
      | "channel"
      | "contentType"
      | "destination"
      | "scheduledFor"
      | "status"
      | "postUrl"
      | "notes"
      | "postedAt"
    >
  >,
) {
  const db = getDb();
  const [row] = await db
    .update(contentSchedule)
    .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(contentSchedule.id, id))
    .returning();
  return row ? toItem(row) : null;
}

export async function deleteContentScheduleItem(id: number) {
  const db = getDb();
  const [row] = await db
    .delete(contentSchedule)
    .where(eq(contentSchedule.id, id))
    .returning({ id: contentSchedule.id });
  return Boolean(row);
}
