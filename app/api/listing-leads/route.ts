import { getDb } from "../../../db";
import { listingLeads } from "../../../db/schema";

const MAX_LENGTHS = {
  fullName: 100,
  phone: 30,
  lineId: 100,
  propertyType: 40,
  location: 200,
  askingPrice: 80,
  timeline: 80,
  details: 1200,
} as const;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== requestUrl.host) {
      return Response.json({ error: "ไม่สามารถส่งข้อมูลจากเว็บไซต์อื่นได้" }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    if (clean(payload.website, 200)) {
      return Response.json({ ok: true }, { status: 201 });
    }

    const fullName = clean(payload.fullName, MAX_LENGTHS.fullName);
    const phone = clean(payload.phone, MAX_LENGTHS.phone);
    const lineId = clean(payload.lineId, MAX_LENGTHS.lineId);
    const propertyType = clean(payload.propertyType, MAX_LENGTHS.propertyType);
    const location = clean(payload.location, MAX_LENGTHS.location);
    const askingPrice = clean(payload.askingPrice, MAX_LENGTHS.askingPrice);
    const timeline = clean(payload.timeline, MAX_LENGTHS.timeline);
    const details = clean(payload.details, MAX_LENGTHS.details);
    const consent = payload.consent === true;
    const phoneDigits = phone.replace(/\D/g, "");

    if (!fullName || !propertyType || !location || phoneDigits.length < 9 || !consent) {
      return Response.json(
        { error: "กรุณากรอกชื่อ เบอร์โทร ประเภททรัพย์ ทำเล และยอมรับการติดต่อกลับ" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [lead] = await db
      .insert(listingLeads)
      .values({
        fullName,
        phone,
        lineId: lineId || null,
        propertyType,
        location,
        askingPrice: askingPrice || null,
        timeline: timeline || null,
        details: details || null,
        consent,
      })
      .returning({ id: listingLeads.id });

    return Response.json({ ok: true, leadId: lead.id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "ระบบยังไม่สามารถบันทึกข้อมูลได้ กรุณาติดต่อทาง LINE หรือโทรหานุช" },
      { status: 500 },
    );
  }
}
