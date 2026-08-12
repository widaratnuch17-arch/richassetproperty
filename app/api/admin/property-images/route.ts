import { isOwner } from "../../../admin-auth";
import { savePropertyImage } from "../../../../db/property-images";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > 1_250_000) {
    return Response.json(
      { error: "รูปยังมีขนาดใหญ่เกินไป กรุณาเลือกผ่านปุ่มในแบบฟอร์มเพื่อให้ระบบปรับรูปอัตโนมัติ" },
      { status: 400 },
    );
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  await savePropertyImage({ id: key, mimeType: file.type, data: btoa(binary), size: file.size });

  return Response.json({ url: `/property-images/${key}` }, { status: 201 });
}
