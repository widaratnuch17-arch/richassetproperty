import { env } from "cloudflare:workers";
import { isOwner } from "../../../admin-auth";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  if (!env.PROPERTY_IMAGES) {
    return Response.json(
      { error: "ยังไม่เปิดระบบพื้นที่เก็บรูป R2 สำหรับเว็บไซต์นี้" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > 8 * 1024 * 1024) {
    return Response.json(
      { error: "รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB ต่อรูป" },
      { status: 400 },
    );
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  await env.PROPERTY_IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ url: `/property-images/${key}` }, { status: 201 });
}
