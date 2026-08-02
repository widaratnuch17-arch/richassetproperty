import {
  createContentScheduleItem,
  deleteContentScheduleItem,
  getContentSchedule,
  updateContentScheduleItem,
  type ContentChannel,
  type ContentScheduleStatus,
  type ContentType,
} from "../../../../db/content-schedule";
import { getManagedProperty } from "../../../../db/managed-properties";
import { isOwner } from "../../../admin-auth";

const channels = new Set<ContentChannel>([
  "facebook",
  "tiktok",
  "youtube",
  "lemon8",
  "line_voom",
  "property_portal",
]);
const contentTypes = new Set<ContentType>(["facebook", "shortCaption", "portal"]);
const statuses = new Set<ContentScheduleStatus>(["planned", "posted"]);

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function id(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function scheduledFor(value: unknown) {
  const parsed = text(value, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed)) return "";
  return Number.isNaN(new Date(`${parsed}:00+07:00`).getTime()) ? "" : parsed;
}

function safeUrl(value: unknown) {
  const parsed = text(value, 800);
  if (!parsed) return "";
  try {
    const url = new URL(parsed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function contentTypeForChannel(channel: ContentChannel): ContentType {
  if (channel === "facebook") return "facebook";
  if (channel === "property_portal") return "portal";
  return "shortCaption";
}

export async function GET() {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  return Response.json({ items: await getContentSchedule() });
}

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const propertyId = text(payload.propertyId, 80).toLowerCase();
  const channel = text(payload.channel, 30) as ContentChannel;
  const requestedContentType = text(payload.contentType, 30) as ContentType;
  const date = scheduledFor(payload.scheduledFor);
  const property = await getManagedProperty(propertyId);

  if (!property || property.status !== "active" || !channels.has(channel) || !date) {
    return Response.json(
      { error: "กรุณาเลือกทรัพย์พร้อมขาย ช่องทาง และวันเวลาให้ครบ" },
      { status: 400 },
    );
  }

  const contentType = contentTypes.has(requestedContentType)
    ? requestedContentType
    : contentTypeForChannel(channel);
  const item = await createContentScheduleItem({
    propertyId,
    channel,
    contentType,
    destination: text(payload.destination, 150) || null,
    scheduledFor: date,
    notes: text(payload.notes, 500) || null,
  });
  return Response.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const itemId = id(payload.id);
  const status = text(payload.status, 20) as ContentScheduleStatus;
  const date = payload.scheduledFor === undefined ? undefined : scheduledFor(payload.scheduledFor);
  const channel = payload.channel === undefined
    ? undefined
    : (text(payload.channel, 30) as ContentChannel);

  if (
    !itemId ||
    (payload.status !== undefined && !statuses.has(status)) ||
    (payload.scheduledFor !== undefined && !date) ||
    (channel !== undefined && !channels.has(channel))
  ) {
    return Response.json({ error: "ข้อมูลอัปเดตไม่ถูกต้อง" }, { status: 400 });
  }

  const postUrl = payload.postUrl === undefined ? undefined : safeUrl(payload.postUrl) || null;
  const values = {
    ...(payload.status === undefined ? {} : { status }),
    ...(date === undefined ? {} : { scheduledFor: date }),
    ...(channel === undefined
      ? {}
      : { channel, contentType: contentTypeForChannel(channel) }),
    ...(payload.destination === undefined
      ? {}
      : { destination: text(payload.destination, 150) || null }),
    ...(payload.notes === undefined ? {} : { notes: text(payload.notes, 500) || null }),
    ...(payload.postUrl === undefined ? {} : { postUrl }),
    ...(status === "posted"
      ? { postedAt: new Date().toISOString() }
      : payload.status === "planned"
        ? { postedAt: null }
        : {}),
  };
  const item = await updateContentScheduleItem(itemId, values);
  if (!item) return Response.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
  return Response.json({ item });
}

export async function DELETE(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  const payload = (await request.json()) as Record<string, unknown>;
  const itemId = id(payload.id);
  if (!itemId) return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const deleted = await deleteContentScheduleItem(itemId);
  if (!deleted) return Response.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
  return Response.json({ ok: true });
}
