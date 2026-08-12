import { eq } from "drizzle-orm";
import { getDb } from ".";
import { propertyImages } from "./schema";

export async function savePropertyImage(values: {
  id: string;
  mimeType: string;
  data: string;
  size: number;
}) {
  await getDb().insert(propertyImages).values(values);
}

export async function getPropertyImage(id: string) {
  const [image] = await getDb()
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.id, id))
    .limit(1);
  return image;
}
