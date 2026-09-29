import { createHash, randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "./db";

const PREFIX = "setda_svc_";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function issueServiceToken(userId: string, name: string, expiresAt?: Date) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== Role.SYSTEM) throw new Error("SYSTEM_ACCOUNT_REQUIRED");
  const token = PREFIX + randomBytes(32).toString("base64url");
  await db.serviceToken.create({ data: { userId, name, tokenHash: hash(token), expiresAt } });
  return token;
}

export async function authenticateServiceToken(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  if (!token.startsWith(PREFIX) || token.length > 128) return null;
  const record = await db.serviceToken.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { select: { id: true, email: true, displayName: true, role: true } } },
  });
  if (!record || record.revokedAt || (record.expiresAt && record.expiresAt <= new Date()) || record.user.role !== Role.SYSTEM) return null;
  await db.serviceToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
  return { tokenId: record.id, tokenName: record.name, user: record.user };
}
