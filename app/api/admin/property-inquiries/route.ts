import { isOwner } from "../../../admin-auth";
import {
  createPropertyInquiry,
  propertyExists,
  propertyInquiryStatuses,
  updatePropertyInquiry,
  type PropertyInquiryStatus,
} from "../../../../db/property-analytics";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function money(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000_000 ? parsed : NaN;
}

export async function POST(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  const payload = (await request.json()) as Record<string, unknown>;
  const propertyId = clean(payload.propertyId, 80);
  const fullName = clean(payload.fullName, 100);
  const phone = clean(payload.phone, 30);
  const source = clean(payload.source, 60).toLowerCase() || "manual";
  if (!propertyId || !fullName || phone.replace(/\D/g, "").length < 9 || !(await propertyExists(propertyId))) {
    return Response.json({ error: "กรุณาระบุทรัพย์ ชื่อ และเบอร์โทรให้ครบถ้วน" }, { status: 400 });
  }
  const inquiry = await createPropertyInquiry({
    propertyId, fullName, phone, lineId: clean(payload.lineId, 100) || null,
    message: clean(payload.message, 600) || null,
    attribution: { source, medium: "manual", campaign: null }, consent: true,
  });
  return Response.json({ inquiry }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id);
  const status = clean(payload.status, 30) as PropertyInquiryStatus;
  const offerAmount = money(payload.offerAmount);
  const salePrice = money(payload.salePrice);
  const commissionIncome = money(payload.commissionIncome);
  const dealExpenses = money(payload.dealExpenses);

  if (
    !Number.isSafeInteger(id) || id < 1 || !propertyInquiryStatuses.includes(status) ||
    [offerAmount, salePrice, commissionIncome, dealExpenses].some(Number.isNaN) ||
    (status === "won" && (!clean(payload.closedAt, 40) || !salePrice || commissionIncome === null))
  ) {
    return Response.json({ error: status === "won" ? "ก่อนปิดการขาย กรุณาระบุวันที่ปิด มูลค่าขาย และค่าคอมมิชชัน" : "ข้อมูลผู้สนใจไม่ถูกต้อง" }, { status: 400 });
  }

  const inquiry = await updatePropertyInquiry(id, {
    status,
    adminNotes: clean(payload.adminNotes, 2000) || null,
    nextFollowUp: clean(payload.nextFollowUp, 40) || null,
    appointmentAt: clean(payload.appointmentAt, 40) || null,
    offerAmount,
    salePrice,
    commissionIncome,
    dealExpenses: dealExpenses ?? 0,
    closedAt: status === "won" ? clean(payload.closedAt, 40) : null,
  });

  if (!inquiry) {
    return Response.json({ error: "ไม่พบข้อมูลผู้สนใจ" }, { status: 404 });
  }

  return Response.json({ inquiry });
}
