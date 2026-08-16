import { getDb } from "../../../db";
import { buyerRequests } from "../../../db/schema";

const MAX_LENGTHS = {
  fullName: 100,
  phone: 30,
  lineId: 100,
  propertyType: 50,
  preferredLocations: 240,
  budgetRange: 60,
  timeline: 60,
  financing: 60,
  details: 1200,
  source: 60,
  medium: 60,
  campaign: 100,
  referrerHost: 120,
} as const;

const propertyTypes = ["บ้านเดี่ยว", "บ้านแฝด", "ทาวน์โฮม", "คอนโด", "ที่ดิน", "อาคารพาณิชย์", "ยังไม่แน่ใจ"];
const budgetRanges = ["ไม่เกิน 2 ล้านบาท", "2–3 ล้านบาท", "3–5 ล้านบาท", "5–10 ล้านบาท", "มากกว่า 10 ล้านบาท", "ยังไม่กำหนด"];
const timelines = ["ภายใน 1 เดือน", "1–3 เดือน", "3–6 เดือน", "มากกว่า 6 เดือน", "กำลังศึกษาข้อมูล"];
const financingOptions = ["เงินสด", "มีวงเงินอนุมัติแล้ว", "ต้องการให้ช่วยเรื่องสินเชื่อ", "ยังไม่แน่ใจ"];

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
    const preferredLocations = clean(payload.preferredLocations, MAX_LENGTHS.preferredLocations);
    const budgetRange = clean(payload.budgetRange, MAX_LENGTHS.budgetRange);
    const bedroomsValue = Number(payload.bedrooms);
    const bedrooms = Number.isSafeInteger(bedroomsValue) && bedroomsValue >= 0 && bedroomsValue <= 20
      ? bedroomsValue
      : null;
    const timeline = clean(payload.timeline, MAX_LENGTHS.timeline);
    const financing = clean(payload.financing, MAX_LENGTHS.financing);
    const details = clean(payload.details, MAX_LENGTHS.details);
    const consent = payload.consent === true;
    const phoneDigits = phone.replace(/\D/g, "");

    if (
      !fullName ||
      phoneDigits.length < 9 ||
      !preferredLocations ||
      !propertyTypes.includes(propertyType) ||
      !budgetRanges.includes(budgetRange) ||
      !timelines.includes(timeline) ||
      !financingOptions.includes(financing) ||
      !consent
    ) {
      return Response.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็นและยินยอมให้นุชติดต่อกลับ" },
        { status: 400 },
      );
    }

    const [buyerRequest] = await getDb()
      .insert(buyerRequests)
      .values({
        fullName,
        phone,
        lineId: lineId || null,
        propertyType,
        preferredLocations,
        budgetRange,
        bedrooms,
        timeline,
        financing,
        details: details || null,
        source: clean(payload.source, MAX_LENGTHS.source).toLowerCase() || "direct",
        medium: clean(payload.medium, MAX_LENGTHS.medium).toLowerCase() || null,
        campaign: clean(payload.campaign, MAX_LENGTHS.campaign) || null,
        referrerHost: clean(payload.referrerHost, MAX_LENGTHS.referrerHost).toLowerCase() || null,
        consent,
      })
      .returning({ id: buyerRequests.id });

    return Response.json({ ok: true, buyerRequestId: buyerRequest.id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "ระบบยังไม่สามารถบันทึกข้อมูลได้ กรุณาติดต่อทาง LINE หรือโทรหานุช" },
      { status: 500 },
    );
  }
}
