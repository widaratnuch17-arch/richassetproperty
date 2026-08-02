declare namespace Cloudflare {
  interface Env {
    ADMIN_PASSWORD?: string;
    ADMIN_PASSWORD_HASH?: string;
    ADMIN_SESSION_SECRET?: string;
    CF_ACCESS_AUD?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    DB: D1Database;
    PROPERTY_IMAGES?: R2Bucket;
  }
}
