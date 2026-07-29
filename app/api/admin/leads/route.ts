import { isOwner } from "../../../admin-auth";
import {
  getListingLeads,
  listingLeadStatuses,
  updateListingLead,
  type ListingLeadStatus,
} from "../../../../db/listing-leads";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  return Response.json({ leads: await getListingLeads() });
}

export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id);
  const status = clean(payload.status, 30) as ListingLeadStatus;

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !listingLeadStatuses.includes(status)
  ) {
    return Response.json({ error: "ข้อมูลลูกค้าไม่ถูกต้อง" }, { status: 400 });
  }

  const lead = await updateListingLead(id, {
    status,
    adminNotes: clean(payload.adminNotes, 2000) || null,
    nextFollowUp: clean(payload.nextFollowUp, 40) || null,
  });

  if (!lead) {
    return Response.json({ error: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });
  }

  return Response.json({ lead });
}
