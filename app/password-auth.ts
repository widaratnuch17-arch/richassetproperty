import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "rich_asset_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

export type PasswordUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

type SessionPayload = {
  email: string;
  exp: number;
};

export async function getPasswordUser(): Promise<PasswordUser | null> {
  const secret = env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) return null;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token, secret);
  if (!payload) return null;

  return {
    displayName: "นุช",
    email: payload.email,
    fullName: "นุช",
  };
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const plainSecret = env.ADMIN_PASSWORD?.trim();
  if (plainSecret) {
    const [actual, expected] = await Promise.all([
      sha256(new TextEncoder().encode(password)),
      sha256(new TextEncoder().encode(plainSecret)),
    ]);
    return constantTimeEqual(actual, expected);
  }

  const encodedHash = env.ADMIN_PASSWORD_HASH?.trim();
  if (!encodedHash) return false;

  const [algorithm, iterationsValue, saltValue, hashValue] =
    encodedHash.split("$");
  const iterations = Number(iterationsValue);
  if (
    algorithm !== "pbkdf2-sha256" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 1_000_000
  ) {
    return false;
  }

  try {
    const salt = decodeBase64Url(saltValue);
    const expectedHash = decodeBase64Url(hashValue);
    if (salt.length < 16 || expectedHash.length < 32) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const actualHash = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          salt: Uint8Array.from(salt).buffer,
          iterations,
        },
        key,
        expectedHash.length * 8,
      ),
    );
    return constantTimeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", Uint8Array.from(value).buffer),
  );
}

export async function createAdminSessionToken(email: string): Promise<string | null> {
  const secret = env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) return null;

  const payload: SessionPayload = {
    email,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encodedPayload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

export function adminSessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export function safeAdminReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";

  try {
    const url = new URL(value, "https://admin.local");
    if (url.origin !== "https://admin.local") return "/admin";
    if (["/admin/login", "/admin/logout"].includes(url.pathname)) return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2 || token.length > 2048) return null;

  try {
    const expectedSignature = await sign(parts[0], secret);
    const actualSignature = decodeBase64Url(parts[1]);
    if (!constantTimeEqual(actualSignature, expectedSignature)) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(parts[0])),
    ) as Partial<SessionPayload>;
    if (
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return { email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
