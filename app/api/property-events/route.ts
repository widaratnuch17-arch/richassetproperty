import {
  propertyEventTypes,
  propertyExists,
  recordPropertyEvent,
  type PropertyEventType,
} from "../../../db/property-analytics";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: "ไม่อนุญาตให้บันทึกข้อมูลจากเว็บไซต์อื่น" }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const id = clean(payload.id, 80);
    const propertyId = clean(payload.propertyId, 80);
    const eventType = clean(payload.eventType, 30) as PropertyEventType;

    if (
      !/^[a-zA-Z0-9_-]{12,80}$/.test(id) ||
      !propertyId ||
      !propertyEventTypes.includes(eventType) ||
      !(await propertyExists(propertyId))
    ) {
      return Response.json({ error: "ข้อมูลการวัดผลไม่ถูกต้อง" }, { status: 400 });
    }

    await recordPropertyEvent({
      id,
      propertyId,
      eventType,
      attribution: {
        source: clean(payload.source, 60).toLowerCase() || "direct",
        medium: clean(payload.medium, 60).toLowerCase() || null,
        campaign: clean(payload.campaign, 100) || null,
        referrerHost: clean(payload.referrerHost, 160).toLowerCase() || null,
      },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "ไม่สามารถบันทึกข้อมูลการวัดผลได้" }, { status: 500 });
  }
}
