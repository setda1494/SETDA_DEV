import { createHash } from "node:crypto";
import { db } from "./db";

function bucketKey(scope: string, subject: string) {
  return scope + ":" + createHash("sha256").update(subject.trim().toLowerCase()).digest("hex");
}

export async function consumeRateLimit(scope: string, subject: string, limit: number, windowMs: number) {
  const key = bucketKey(scope, subject);
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  return db.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!bucket || bucket.resetAt <= now) {
      await tx.rateLimitBucket.upsert({ where: { key }, create: { key, count: 1, resetAt: nextReset }, update: { count: 1, resetAt: nextReset } });
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: nextReset };
    }
    if (bucket.count >= limit) return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    const updated = await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: Math.max(0, limit - updated.count), resetAt: updated.resetAt };
  });
}

export async function clearRateLimit(scope: string, subject: string) {
  await db.rateLimitBucket.deleteMany({ where: { key: bucketKey(scope, subject) } });
}
