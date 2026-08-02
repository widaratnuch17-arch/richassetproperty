import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "../../password-auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    "",
    adminSessionCookieOptions(0),
  );
  return response;
}
