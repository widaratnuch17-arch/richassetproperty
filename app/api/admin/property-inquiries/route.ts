import { isOwner } from "../../../admin-auth";
import {
  propertyInquiryStatuses,
  updatePropertyInquiry,
  type PropertyInquiryStatus,
} from "../../../../db/property-analytics";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id);
  const status = clean(payload.status, 30) as PropertyInquiryStatus;

  if (!Number.isSafeInteger(id) || id < 1 || !propertyInquiryStatuses.includes(status)) {
    return Response.json({ error: "ข้อมูลผู้สนใจไม่ถูกต้อง" }, { status: 400 });
  }

  const inquiry = await updatePropertyInquiry(id, {
    status,
    adminNotes: clean(payload.adminNotes, 2000) || null,
    nextFollowUp: clean(payload.nextFollowUp, 40) || null,
  });

  if (!inquiry) {
    return Response.json({ error: "ไม่พบข้อมูลผู้สนใจ" }, { status: 404 });
  }

  return Response.json({ inquiry });
}
