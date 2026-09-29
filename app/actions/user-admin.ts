"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { changeUserRole } from "@/lib/user-admin";

export async function changeUserRoleAction(form: FormData) {
  const actor = await requireOwner();
  const targetId = String(form.get("userId") ?? "");
  const role = String(form.get("role") ?? "") as Role;
  if (!targetId) throw new Error("USER_REQUIRED");
  if (!Object.values(Role).includes(role)) throw new Error("INVALID_ROLE");
  await changeUserRole(actor, targetId, role);
  revalidatePath("/admin");
}
