import type { Property, PropertyStatus } from "../../../data/properties";
import {
  createManagedProperty,
  getManagedProperties,
  updateManagedProperty,
} from "../../../../db/managed-properties";
import { isOwner } from "../../../admin-auth";

const statuses = new Set<PropertyStatus>(["active", "reserved", "sold", "hidden"]);

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function list(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item, 300)).filter(Boolean).slice(0, 20)
    : [];
}

function parseProperty(payload: Record<string, unknown>): Property | null {
  const id = text(payload.id, 80).toLowerCase();
  const status = text(payload.status, 20) as PropertyStatus;
  const property: Property = {
    id,
    type: text(payload.type, 80),
    title: text(payload.title, 200),
    location: text(payload.location, 250),
    price: text(payload.price, 100),
    land: text(payload.land, 100),
    usableArea: text(payload.usableArea, 100),
    bedrooms: number(payload.bedrooms),
    bathrooms: number(payload.bathrooms),
    parking: number(payload.parking),
    summary: text(payload.summary, 1500),
    highlights: list(payload.highlights),
    nearby: list(payload.nearby),
    map: text(payload.map, 500),
    images: list(payload.images),
    status: statuses.has(status) ? status : "active",
  };

  if (
    !/^[a-z0-9-]+$/.test(property.id) ||
    !property.type ||
    !property.title ||
    !property.location ||
    !property.price ||
    !property.summary ||
    property.images.length === 0
  ) {
    return null;
  }
  return property;
}

export async function GET() {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  return Response.json({ properties: await getManagedProperties(true) });
}

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  const payload = (await request.json()) as Record<string, unknown>;
  const property = parseProperty(payload);
  if (!property) {
    return Response.json({ error: "ข้อมูลทรัพย์ยังไม่ครบหรือรหัส URL ไม่ถูกต้อง" }, { status: 400 });
  }
  try {
    await createManagedProperty(property);
    return Response.json({ property }, { status: 201 });
  } catch {
    return Response.json({ error: "ไม่สามารถเพิ่มทรัพย์ได้ รหัส URL อาจถูกใช้แล้ว" }, { status: 409 });
  }
}

export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  const payload = (await request.json()) as Record<string, unknown>;
  const property = parseProperty(payload);
  if (!property) {
    return Response.json({ error: "ข้อมูลทรัพย์ยังไม่ครบ" }, { status: 400 });
  }
  const { id, ...values } = property;
  await updateManagedProperty(id, values);
  return Response.json({ property });
}
