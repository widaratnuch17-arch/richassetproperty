import { eq } from "drizzle-orm";
import { getDb } from ".";
import { adminLoginAttempts } from "./schema";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function getLoginBlockSeconds(
  key: string,
  now = Date.now(),
): Promise<number> {
  const [row] = await getDb()
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.key, key))
    .limit(1);

  if (!row?.blockedUntil || row.blockedUntil <= now) return 0;
  return Math.max(1, Math.ceil((row.blockedUntil - now) / 1000));
}

export async function recordLoginFailure(
  key: string,
  now = Date.now(),
): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.key, key))
    .limit(1);

  if (!row) {
    await db.insert(adminLoginAttempts).values({
      key,
      attempts: 1,
      windowStartedAt: now,
      blockedUntil: null,
    });
    return;
  }

  const windowExpired = now - row.windowStartedAt >= WINDOW_MS;
  const attempts = windowExpired ? 1 : row.attempts + 1;
  await db
    .update(adminLoginAttempts)
    .set({
      attempts,
      windowStartedAt: windowExpired ? now : row.windowStartedAt,
      blockedUntil: attempts >= MAX_FAILURES ? now + BLOCK_MS : null,
    })
    .where(eq(adminLoginAttempts.key, key));
}

export async function clearLoginFailures(key: string): Promise<void> {
  await getDb()
    .delete(adminLoginAttempts)
    .where(eq(adminLoginAttempts.key, key));
}
