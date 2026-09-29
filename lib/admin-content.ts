import { ContentKind, Prisma, Role, type ContentEntry } from "@prisma/client";
import { db } from "@/lib/db";

export type AdminActor = { id: string; role: Role };
type ContentInput = { kind: ContentKind; key: string; title: string; data: Prisma.InputJsonValue; published?: boolean };

function assertAdmin(actor: AdminActor) {
  if (actor.role !== Role.OWNER && actor.role !== Role.SYSTEM) throw new Error("FORBIDDEN");
}
function auditSnapshot(item: ContentEntry): Prisma.InputJsonValue {
  return {
    kind: item.kind,
    key: item.key,
    title: item.title,
    published: item.published,
    archivedAt: item.archivedAt?.toISOString() ?? null,
    data: JSON.parse(JSON.stringify(item.data)) as Prisma.InputJsonValue,
  };
}
const keyPattern = /^[a-z0-9][a-z0-9._-]{1,79}$/;
function validate(input: ContentInput) {
  const key = input.key.trim().toLowerCase();
  const title = input.title.trim();
  if (!keyPattern.test(key)) throw new Error("INVALID_KEY");
  if (title.length < 2 || title.length > 120) throw new Error("INVALID_TITLE");
  return { ...input, key, title, published: Boolean(input.published) };
}
export async function createContent(actor: AdminActor, input: ContentInput) {
  assertAdmin(actor);
  const value = validate(input);
  return db.$transaction(async (tx) => {
    const item = await tx.contentEntry.create({ data: value });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "CREATE", contentId: item.id, contentKind: item.kind, contentKey: item.key, after: auditSnapshot(item) } });
    return item;
  });
}
export async function updateContent(actor: AdminActor, id: string, input: { title: string; data: Prisma.InputJsonValue; published: boolean }) {
  assertAdmin(actor);
  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) throw new Error("INVALID_TITLE");
  return db.$transaction(async (tx) => {
    const before = await tx.contentEntry.findUniqueOrThrow({ where: { id } });
    if (before.archivedAt) throw new Error("CONTENT_ARCHIVED");
    const item = await tx.contentEntry.update({ where: { id }, data: { title, data: input.data, published: input.published } });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", contentId: item.id, contentKind: item.kind, contentKey: item.key, before: auditSnapshot(before), after: auditSnapshot(item) } });
    return item;
  });
}
export async function setArchived(actor: AdminActor, id: string, archived: boolean) {
  assertAdmin(actor);
  return db.$transaction(async (tx) => {
    const before = await tx.contentEntry.findUniqueOrThrow({ where: { id } });
    if (archived && before.archivedAt) throw new Error("CONTENT_ALREADY_ARCHIVED");
    if (!archived && !before.archivedAt) throw new Error("CONTENT_NOT_ARCHIVED");
    const after = await tx.contentEntry.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null, published: archived ? false : before.published },
    });
    await tx.auditLog.create({
      data: { actorId: actor.id, action: archived ? "ARCHIVE" : "RESTORE", contentId: after.id, contentKind: after.kind, contentKey: after.key, before: auditSnapshot(before), after: auditSnapshot(after) },
    });
    return after;
  });
}
