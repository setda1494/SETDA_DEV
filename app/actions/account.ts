"use server";

import { redirect } from "next/navigation";
import { currentSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function revokeOtherSessionsAction() {
  const session = await currentSession();
  if (!session) redirect("/login?next=/account");
  await db.session.deleteMany({ where: { userId: session.user.id, id: { not: session.id } } });
  redirect("/account?revoked=others");
}

export async function revokeAllSessionsAction() {
  const session = await currentSession();
  if (!session) redirect("/login?next=/account");
  await db.session.deleteMany({ where: { userId: session.user.id } });
  await destroySession();
  redirect("/login?revoked=all");
}
