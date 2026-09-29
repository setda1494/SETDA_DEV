import { Prisma } from "@prisma/client";
import { z } from "zod";
import { playableWebGame } from "@/lib/public-content";
export const gameSaveKey=z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/);
export const gameSaveSlot=z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/);
export const gameSaveQuery=z.object({gameKey:gameSaveKey,slot:gameSaveSlot.default("default")});
export const gameSaveBody=z.object({gameKey:gameSaveKey,slot:gameSaveSlot.default("default"),version:z.number().int().min(1).max(100000),payload:z.json()});
export function asPrismaJson(value:z.infer<typeof gameSaveBody>["payload"]):Prisma.InputJsonValue{return value as Prisma.InputJsonValue}
export async function isSaveEnabledGame(gameKey:string){return Boolean(await playableWebGame(gameKey))}
