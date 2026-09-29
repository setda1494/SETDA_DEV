import { Prisma, Role } from "@prisma/client";
import { db } from "./db";

const safeUser = { id: true, email: true, displayName: true, role: true } as const;

export async function changeUserRole(actor: { id: string; role: Role }, targetId: string, nextRole: Role) {
  if (actor.role !== Role.OWNER) throw new Error("OWNER_REQUIRED");
  if (actor.id === targetId) throw new Error("CANNOT_CHANGE_OWN_ROLE");
  if (nextRole === Role.SYSTEM) throw new Error("SYSTEM_ROLE_MANAGED_SEPARATELY");

  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: targetId }, select: safeUser });
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === Role.SYSTEM) throw new Error("SYSTEM_ROLE_MANAGED_SEPARATELY");

    if (target.role === Role.OWNER && nextRole !== Role.OWNER) {
      const owners = await tx.user.count({ where: { role: Role.OWNER } });
      if (owners <= 1) throw new Error("LAST_OWNER_REQUIRED");
    }
    if (target.role === nextRole) return target;

    const user = await tx.user.update({ where: { id: targetId }, data: { role: nextRole }, select: safeUser });
    await tx.session.deleteMany({ where: { userId: targetId } });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_ROLE_CHANGE",
        before: target as unknown as Prisma.InputJsonValue,
        after: user as unknown as Prisma.InputJsonValue,
      },
    });
    return user;
  });
}
