import { ContentKind, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
const slug=z.string().regex(/^[a-z0-9][a-z0-9._-]{1,79}$/);
const isHttps=(v:string)=>{try{return new URL(v).protocol==="https:"}catch{return false}};
const https=z.string().refine(isHttps,"HTTPS required");
const safeLocal=(prefix:string)=>z.string().refine(v=>v.startsWith(prefix)&&!v.includes("..")&&!v.includes("\\"),"Unsafe local path");
const safeMedia=z.string().refine(v=>(v.startsWith("/media/")&&!v.includes("..")&&!v.includes("\\"))||isHttps(v),"Unsafe media source");
export const projectSchema=z.object({category:z.string().min(1).max(80),description:z.string().max(1000),summary:z.string().max(2000),status:z.string().min(1).max(80),runtime:z.enum(["web","desktop","service","tool"]),tags:z.array(z.object({name:z.string().min(1).max(60),kind:z.enum(["language","tool","platform"])})).max(40),highlights:z.array(z.string().min(1).max(300)).max(30),featured:z.boolean().optional(),repository:https.optional(),release:slug.optional()});
export const releaseSchema=z.object({projectSlug:slug,artifact:z.string().min(1).max(160),version:z.string().min(1).max(80),platform:z.string().min(1).max(80),state:z.enum(["pending","published"]),downloadUrl:https.optional(),size:z.string().max(80).optional(),sha256:z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),publishedAt:z.string().datetime().optional(),changelog:z.array(z.string().max(300)).max(50)});
export const mediaSchema=z.object({projectSlug:slug,kind:z.enum(["image","video"]),src:safeMedia,alt:z.string().min(1).max(300),caption:z.string().max(500).optional(),poster:safeMedia.optional()});
export const webGameSchema=z.object({projectSlug:slug,enabled:z.boolean(),entry:z.union([safeLocal("/games-content/"),https])});
export const contentSchemas={[ContentKind.PROJECT]:projectSchema,[ContentKind.RELEASE]:releaseSchema,[ContentKind.MEDIA]:mediaSchema,[ContentKind.WEB_GAME]:webGameSchema};
export function safeContent<T extends ContentKind>(kind:T,data:unknown){return contentSchemas[kind].safeParse(data)}
export function validateContent(kind:ContentKind,data:unknown):Prisma.InputJsonValue{return contentSchemas[kind].parse(data) as Prisma.InputJsonValue}
export async function validateReferences(kind:ContentKind,data:unknown){if(kind===ContentKind.PROJECT)return;const d=data as {projectSlug:string};const row=await db.contentEntry.findFirst({where:{kind:ContentKind.PROJECT,key:d.projectSlug,archivedAt:null}});if(!row)throw new Error("PROJECT_REFERENCE_NOT_FOUND");if(kind===ContentKind.WEB_GAME){const p=projectSchema.parse(row.data);if(p.runtime!=="web")throw new Error("WEB_GAME_REQUIRES_WEB_PROJECT")}}
