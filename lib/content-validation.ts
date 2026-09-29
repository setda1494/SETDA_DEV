import { ContentKind, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

const slug=z.string().regex(/^[a-z0-9][a-z0-9._-]{1,79}$/);
const https=z.string().url().refine(v=>new URL(v).protocol==="https:","HTTPS required");
const safeLocal=(prefix:string)=>z.string().refine(v=>v.startsWith(prefix)&&!v.includes("..")&&!v.includes("\\"),"Unsafe local path");
export const projectSchema=z.object({category:z.string().min(1).max(80),description:z.string().max(1000),summary:z.string().max(2000),status:z.string().min(1).max(80),runtime:z.enum(["web","desktop","service","tool"]),tags:z.array(z.object({name:z.string().min(1).max(60),kind:z.enum(["language","tool","platform"])})).max(40),highlights:z.array(z.string().min(1).max(300)).max(30)});
export const releaseSchema=z.object({projectSlug:slug,artifact:z.string().min(1).max(160),version:z.string().min(1).max(80),platform:z.string().min(1).max(80),state:z.enum(["pending","published"]),downloadUrl:z.union([z.literal(""),https]).optional(),changelog:z.array(z.string().max(300)).max(50)});
export const mediaSchema=z.object({projectSlug:slug,kind:z.enum(["image","video"]),src:z.string().refine(v=>(v.startsWith("/media/")&&!v.includes("..")&&!v.includes("\\"))||(()=>{try{return new URL(v).protocol==="https:"}catch{return false}})(),"Unsafe media source"),alt:z.string().min(1).max(300),caption:z.string().max(500).optional()});
export const webGameSchema=z.object({projectSlug:slug,enabled:z.boolean(),entry:z.union([safeLocal("/games-content/"),https])});
export const contentSchemas={[ContentKind.PROJECT]:projectSchema,[ContentKind.RELEASE]:releaseSchema,[ContentKind.MEDIA]:mediaSchema,[ContentKind.WEB_GAME]:webGameSchema};
export function safeContent<T extends ContentKind>(kind:T,data:unknown){return contentSchemas[kind].safeParse(data)}
export function validateContent(kind:ContentKind,data:unknown):Prisma.InputJsonValue{return contentSchemas[kind].parse(data) as Prisma.InputJsonValue}
export async function validateReferences(kind:ContentKind,data:unknown){if(kind===ContentKind.PROJECT)return;const d=data as {projectSlug:string};const row=await db.contentEntry.findFirst({where:{kind:ContentKind.PROJECT,key:d.projectSlug,archivedAt:null}});if(!row)throw new Error("PROJECT_REFERENCE_NOT_FOUND");if(kind===ContentKind.WEB_GAME){const p=projectSchema.parse(row.data);if(p.runtime!=="web")throw new Error("WEB_GAME_REQUIRES_WEB_PROJECT")}}
