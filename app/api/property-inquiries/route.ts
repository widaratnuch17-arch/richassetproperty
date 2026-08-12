import {
  createPropertyInquiry,
  propertyExists,
} from "../../../db/property-analytics";

const MAX_LENGTHS = {
  propertyId: 80,
  fullName: 100,
  phone: 30,
  lineId: 100,
  message: 600,
  source: 60,
  medium: 60,
  campaign: 100,
} as const;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== requestUrl.host) {
      return Response.json({ error: "ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น" }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    if (clean(payload.website, 200)) {
      return Response.json({ ok: true }, { status: 201 });
    }

    const propertyId = clean(payload.propertyId, MAX_LENGTHS.propertyId);
    const fullName = clean(payload.fullName, MAX_LENGTHS.fullName);
    const phone = clean(payload.phone, MAX_LENGTHS.phone);
    const lineId = clean(payload.lineId, MAX_LENGTHS.lineId);
    const message = clean(payload.message, MAX_LENGTHS.message);
    const consent = payload.consent === true;
    const phoneDigits = phone.replace(/\D/g, "");

    if (!propertyId || !fullName || phoneDigits.length < 9 || !consent || !(await propertyExists(propertyId))) {
      return Response.json(
        { error: "กรุณากรอกชื่อ เบอร์โทร และยอมรับการติดต่อกลับให้ครบถ้วน" },
        { status: 400 },
      );
    }

    const inquiry = await createPropertyInquiry({
      propertyId,
      fullName,
      phone,
      lineId: lineId || null,
      message: message || null,
      attribution: {
        source: clean(payload.source, MAX_LENGTHS.source).toLowerCase() || "direct",
        medium: clean(payload.medium, MAX_LENGTHS.medium).toLowerCase() || null,
        campaign: clean(payload.campaign, MAX_LENGTHS.campaign) || null,
      },
      consent,
    });

    return Response.json({ ok: true, inquiryId: inquiry.id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "ระบบยังไม่สามารถบันทึกข้อมูลได้ กรุณาติดต่อทาง LINE หรือโทรหานุช" },
      { status: 500 },
    );
  }
}
