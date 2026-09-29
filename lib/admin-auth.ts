import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== Role.OWNER && user.role !== Role.SYSTEM) redirect("/");
  return user;
}

export async function requireOwner() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== Role.OWNER) redirect("/admin");
  return user;
}
