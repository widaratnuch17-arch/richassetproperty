import { NextResponse } from "next/server";
import {
  clearLoginFailures,
  getLoginBlockSeconds,
  recordLoginFailure,
} from "../../../../db/admin-login-attempts";
import { OWNER_EMAIL } from "../../../admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  safeAdminReturnPath,
  verifyAdminPassword,
} from "../../../password-auth";

export async function POST(request: Request) {
  const key = await loginAttemptKey(request);
  const blockedFor = await getLoginBlockSeconds(key);
  if (blockedFor > 0) {
    return NextResponse.json(
      { error: "ลองรหัสหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
      { status: 429, headers: { "retry-after": String(blockedFor) } },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const password = typeof payload.password === "string" ? payload.password : "";
  if (password.length < 12 || password.length > 256) {
    await recordLoginFailure(key);
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  if (!(await verifyAdminPassword(password))) {
    await recordLoginFailure(key);
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const token = await createAdminSessionToken(OWNER_EMAIL);
  if (!token) {
    return NextResponse.json(
      { error: "ระบบหลังบ้านยังตั้งค่าไม่สมบูรณ์" },
      { status: 503 },
    );
  }

  await clearLoginFailures(key);
  const returnTo = safeAdminReturnPath(payload.returnTo);
  const response = NextResponse.json({ ok: true, returnTo });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    token,
    adminSessionCookieOptions(),
  );
  return response;
}

async function loginAttemptKey(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  const bytes = new TextEncoder().encode(ip);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
