import { asc, eq, ne, sql } from "drizzle-orm";
import { propertyDetails, type Property, type PropertyStatus } from "../app/data/properties";
import { getDb } from ".";
import { managedProperties } from "./schema";

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toProperty(row: typeof managedProperties.$inferSelect): Property {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    location: row.location,
    price: row.price,
    land: row.land,
    usableArea: row.usableArea,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    summary: row.summary,
    highlights: parseList(row.highlights),
    nearby: parseList(row.nearby),
    map: row.mapUrl,
    images: parseList(row.images),
    status: row.status as PropertyStatus,
  };
}

async function seedProperties() {
  const db = getDb();
  await db
    .insert(managedProperties)
    .values(
      propertyDetails.map((property) => ({
        id: property.id,
        type: property.type,
        title: property.title,
        location: property.location,
        price: property.price,
        land: property.land,
        usableArea: property.usableArea,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        summary: property.summary,
        highlights: JSON.stringify(property.highlights),
        nearby: JSON.stringify(property.nearby),
        mapUrl: property.map,
        images: JSON.stringify(property.images),
        status: property.status ?? "active",
      })),
    )
    .onConflictDoNothing();
}

export async function getManagedProperties(includeHidden = false): Promise<Property[]> {
  try {
    await seedProperties();
    const db = getDb();
    const rows = includeHidden
      ? await db.select().from(managedProperties).orderBy(asc(managedProperties.createdAt))
      : await db
          .select()
          .from(managedProperties)
          .where(ne(managedProperties.status, "hidden"))
          .orderBy(asc(managedProperties.createdAt));
    return rows.map(toProperty);
  } catch {
    return propertyDetails.filter((property) => includeHidden || property.status !== "hidden");
  }
}

export async function getManagedProperty(id: string): Promise<Property | undefined> {
  try {
    await seedProperties();
    const db = getDb();
    const [row] = await db
      .select()
      .from(managedProperties)
      .where(eq(managedProperties.id, id))
      .limit(1);
    return row ? toProperty(row) : undefined;
  } catch {
    return propertyDetails.find((property) => property.id === id);
  }
}

export async function createManagedProperty(property: Property) {
  const db = getDb();
  await db.insert(managedProperties).values({
    id: property.id,
    type: property.type,
    title: property.title,
    location: property.location,
    price: property.price,
    land: property.land,
    usableArea: property.usableArea,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    summary: property.summary,
    highlights: JSON.stringify(property.highlights),
    nearby: JSON.stringify(property.nearby),
    mapUrl: property.map,
    images: JSON.stringify(property.images),
    status: property.status ?? "active",
  });
}

export async function updateManagedProperty(id: string, property: Omit<Property, "id">) {
  const db = getDb();
  await db
    .update(managedProperties)
    .set({
      type: property.type,
      title: property.title,
      location: property.location,
      price: property.price,
      land: property.land,
      usableArea: property.usableArea,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking: property.parking,
      summary: property.summary,
      highlights: JSON.stringify(property.highlights),
      nearby: JSON.stringify(property.nearby),
      mapUrl: property.map,
      images: JSON.stringify(property.images),
      status: property.status ?? "active",
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(managedProperties.id, id));
}
