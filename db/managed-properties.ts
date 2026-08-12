import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { propertyDetails, type Property, type PropertyStatus } from "../app/data/properties";
import { getDb } from ".";
import { deletedProperties, managedProperties, propertyImages, propertyInquiries } from "./schema";

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
    visible: row.isVisible && row.status !== "hidden",
  };
}

async function seedProperties() {
  const db = getDb();
  const deleted = await db.select({ id: deletedProperties.id }).from(deletedProperties);
  const deletedIds = new Set(deleted.map((property) => property.id));
  const propertiesToSeed = propertyDetails.filter((property) => !deletedIds.has(property.id));
  if (propertiesToSeed.length === 0) return;
  await db
    .insert(managedProperties)
    .values(
      propertiesToSeed.map((property) => ({
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
        status: property.status === "hidden" ? "active" : property.status ?? "active",
        isVisible: property.visible !== false && property.status !== "hidden",
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
          .where(and(eq(managedProperties.isVisible, true), ne(managedProperties.status, "hidden")))
          .orderBy(asc(managedProperties.createdAt));
    return rows.map(toProperty);
  } catch {
    return propertyDetails.filter(
      (property) => includeHidden || (property.visible !== false && property.status !== "hidden"),
    );
  }
}

export async function getManagedProperty(id: string, includeHidden = false): Promise<Property | undefined> {
  try {
    await seedProperties();
    const db = getDb();
    const [row] = await db
      .select()
      .from(managedProperties)
      .where(
        includeHidden
          ? eq(managedProperties.id, id)
          : and(
              eq(managedProperties.id, id),
              eq(managedProperties.isVisible, true),
              ne(managedProperties.status, "hidden"),
            ),
      )
      .limit(1);
    return row ? toProperty(row) : undefined;
  } catch {
    return propertyDetails.find(
      (property) =>
        property.id === id &&
        (includeHidden || (property.visible !== false && property.status !== "hidden")),
    );
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
    status: property.status === "hidden" ? "active" : property.status ?? "active",
    isVisible: property.visible !== false && property.status !== "hidden",
  });
  await db.delete(deletedProperties).where(eq(deletedProperties.id, property.id));
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
      status: property.status === "hidden" ? "active" : property.status ?? "active",
      isVisible: property.visible !== false && property.status !== "hidden",
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(managedProperties.id, id));
}

export async function updateManagedPropertyVisibility(id: string, visible: boolean) {
  const db = getDb();
  await db
    .update(managedProperties)
    .set({
      isVisible: visible,
      status: sql`CASE WHEN ${managedProperties.status} = 'hidden' THEN 'active' ELSE ${managedProperties.status} END`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(managedProperties.id, id));

  const [row] = await db
    .select()
    .from(managedProperties)
    .where(eq(managedProperties.id, id))
    .limit(1);
  return row ? toProperty(row) : undefined;
}

function storedImageId(url: string) {
  const match = url.match(/^\/property-images\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function deleteManagedProperty(id: string) {
  const db = getDb();
  const [property] = await db
    .select()
    .from(managedProperties)
    .where(eq(managedProperties.id, id))
    .limit(1);
  if (!property) return { status: "not_found" as const };

  const [inquiry] = await db
    .select({ id: propertyInquiries.id })
    .from(propertyInquiries)
    .where(eq(propertyInquiries.propertyId, id))
    .limit(1);
  if (inquiry) return { status: "has_inquiries" as const };

  const imageIds = parseList(property.images)
    .map(storedImageId)
    .filter((imageId): imageId is string => Boolean(imageId));

  await db.insert(deletedProperties).values({ id }).onConflictDoNothing();
  await db.delete(managedProperties).where(eq(managedProperties.id, id));

  if (imageIds.length > 0) {
    const remaining = await db.select({ images: managedProperties.images }).from(managedProperties);
    const referencedImageIds = new Set(
      remaining.flatMap((row) => parseList(row.images).map(storedImageId).filter(Boolean)),
    );
    const orphanedImageIds = imageIds.filter((imageId) => !referencedImageIds.has(imageId));
    if (orphanedImageIds.length > 0) {
      await db.delete(propertyImages).where(inArray(propertyImages.id, orphanedImageIds));
    }
  }

  return { status: "deleted" as const };
}
