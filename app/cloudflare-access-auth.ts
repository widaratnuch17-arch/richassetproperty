import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { headers } from "next/headers";

export type CloudflareAccessUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const jwksByTeamDomain = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

export async function getCloudflareAccessUser(): Promise<CloudflareAccessUser | null> {
  const config = getCloudflareAccessConfig();
  if (!config) return null;

  const requestHeaders = await headers();
  const token = requestHeaders.get("cf-access-jwt-assertion");
  if (!token) return null;

  try {
    let jwks = jwksByTeamDomain.get(config.teamDomain);
    if (!jwks) {
      jwks = createRemoteJWKSet(
        new URL(`${config.teamDomain}/cdn-cgi/access/certs`),
      );
      jwksByTeamDomain.set(config.teamDomain, jwks);
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.teamDomain,
      audience: config.audience,
    });
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    if (!email) return null;

    const fullName =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : null;

    return {
      displayName: fullName ?? email,
      email,
      fullName,
    };
  } catch {
    return null;
  }
}

export function cloudflareAccessSignOutPath(): string {
  const config = getCloudflareAccessConfig();
  return config
    ? `${config.teamDomain}/cdn-cgi/access/logout`
    : "/";
}

function getCloudflareAccessConfig() {
  const audience = env.CF_ACCESS_AUD?.trim();
  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  return audience && teamDomain ? { audience, teamDomain } : null;
}

function normalizeTeamDomain(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".cloudflareaccess.com") ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}
