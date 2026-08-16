import { isOwner } from "../../../admin-auth";
import {
  buyerRequestStatuses,
  getBuyerRequests,
  updateBuyerRequest,
  type BuyerRequestStatus,
} from "../../../../db/buyer-requests";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 1_000_000_000 ? amount : undefined;
}

export async function GET() {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  return Response.json({ buyerRequests: await getBuyerRequests() });
}

export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const id = Number(payload.id);
  const status = clean(payload.status, 30) as BuyerRequestStatus;
  const offerAmount = optionalMoney(payload.offerAmount);
  const salePrice = optionalMoney(payload.salePrice);
  const commissionIncome = optionalMoney(payload.commissionIncome);
  const dealExpenses = optionalMoney(payload.dealExpenses);

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !buyerRequestStatuses.includes(status) ||
    offerAmount === undefined ||
    salePrice === undefined ||
    commissionIncome === undefined ||
    dealExpenses === undefined
  ) {
    return Response.json({ error: "ข้อมูลผู้ซื้อไม่ถูกต้อง" }, { status: 400 });
  }

  const buyerRequest = await updateBuyerRequest(id, {
    status,
    adminNotes: clean(payload.adminNotes, 2000) || null,
    nextFollowUp: clean(payload.nextFollowUp, 40) || null,
    appointmentAt: clean(payload.appointmentAt, 40) || null,
    offerAmount,
    salePrice,
    commissionIncome,
    dealExpenses: dealExpenses ?? 0,
    closedAt: clean(payload.closedAt, 40) || null,
  });

  if (!buyerRequest) {
    return Response.json({ error: "ไม่พบข้อมูลผู้ซื้อ" }, { status: 404 });
  }
  return Response.json({ buyerRequest });
}
