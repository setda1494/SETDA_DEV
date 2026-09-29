import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const SESSION_COOKIE = "setda_session";
const SESSION_MS = 30 * 86400000;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export type SessionUser = { id: string; email: string; displayName: string; role: "OWNER" | "SYSTEM" | "USER" };
export type AuthSession = { id: string; user: SessionUser; createdAt: Date; expiresAt: Date };

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await db.session.create({ data: { userId, tokenHash: hash(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  try {
    if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  } finally {
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function currentSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return {
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    user: { id: session.user.id, email: session.user.email, displayName: session.user.displayName, role: session.user.role },
  };
}

export async function currentUser(): Promise<SessionUser | null> {
  return (await currentSession())?.user ?? null;
}

export async function optionalCurrentUser(): Promise<SessionUser | null> {
  try { return await currentUser(); } catch { return null; }
}
