/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const chatGPTAuthHeaders = [
  "oai-authenticated-user-email",
  "oai-authenticated-user-full-name",
  "oai-authenticated-user-full-name-encoding",
];

function stripUntrustedChatGPTAuthHeaders(request: Request): Request {
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (hostname.endsWith(".chatgpt.site")) return request;

  const headers = new Headers(request.headers);
  for (const name of chatGPTAuthHeaders) headers.delete(name);
  return new Request(request, { headers });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    request = stripUntrustedChatGPTAuthHeaders(request);
    const url = new URL(request.url);

    if (url.pathname.startsWith("/property-images/")) {
      const key = decodeURIComponent(url.pathname.slice("/property-images/".length));
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
      const row = await env.DB
        .prepare("SELECT mime_type, data, size FROM property_images WHERE id = ? LIMIT 1")
        .bind(key)
        .first<{ mime_type: string; data: string; size: number }>();
      if (!row) return new Response("Not found", { status: 404 });
      const binary = atob(row.data);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new Response(bytes, {
        headers: {
          "content-type": row.mime_type,
          "content-length": String(row.size),
          "cache-control": "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (url.pathname === "/_vinext/image") {
      const source = url.searchParams.get("url");
      if (source?.startsWith("/") && !source.startsWith("//")) {
        return Response.redirect(new URL(source, request.url), 302);
      }

      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
