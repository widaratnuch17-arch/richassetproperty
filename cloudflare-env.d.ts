declare namespace Cloudflare {
  interface Env {
    CF_ACCESS_AUD?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    DB: D1Database;
    PROPERTY_IMAGES?: R2Bucket;
  }
}
