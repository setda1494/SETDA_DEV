"use server";
import { ContentKind, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createContent, updateContent, setArchived } from "@/lib/admin-content";
import { db } from "@/lib/db";
const kinds=new Set(Object.values(ContentKind));
function json(raw:string):Prisma.InputJsonValue{if(raw.length>65536)throw new Error("JSON_TOO_LARGE");const v:unknown=JSON.parse(raw);if(v===null)throw new Error("JSON_NULL_NOT_ALLOWED");return v as Prisma.InputJsonValue}
const text=(f:FormData,n:string)=>String(f.get(n)??"").trim(),list=(f:FormData,n:string)=>text(f,n).split("\n").map(x=>x.trim()).filter(Boolean);
function typed(f:FormData,kind:ContentKind):Prisma.InputJsonValue{if(f.get("editorMode")==="json")return json(text(f,"data")||"{}");if(kind===ContentKind.PROJECT)return{category:text(f,"category"),description:text(f,"description"),summary:text(f,"summary"),status:text(f,"status"),runtime:text(f,"runtime"),tags:list(f,"tags").map(name=>({name,kind:"tool"})),highlights:list(f,"highlights")};if(kind===ContentKind.RELEASE)return{projectSlug:text(f,"projectSlug"),artifact:text(f,"artifact"),version:text(f,"version"),platform:text(f,"platform"),state:text(f,"state"),downloadUrl:text(f,"downloadUrl")||undefined,changelog:list(f,"changelog")};if(kind===ContentKind.MEDIA)return{projectSlug:text(f,"projectSlug"),kind:text(f,"mediaKind"),src:text(f,"src"),alt:text(f,"alt"),caption:text(f,"caption")||undefined};return{projectSlug:text(f,"projectSlug"),enabled:f.get("enabled")==="on",entry:text(f,"entry")}}
export async function createContentAction(form:FormData){const actor=await requireAdmin(),kind=text(form,"kind") as ContentKind;if(!kinds.has(kind))throw new Error("INVALID_KIND");await createContent(actor,{kind,key:text(form,"key"),title:text(form,"title"),data:typed(form,kind),published:form.get("published")==="on"});revalidatePath("/admin");redirect("/admin?ok=created")}
export async function updateContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");const current=await db.contentEntry.findUnique({where:{id},select:{kind:true}});if(!current)throw new Error("CONTENT_NOT_FOUND");await updateContent(actor,id,{title:text(form,"title"),data:typed(form,current.kind),published:form.get("published")==="on"});revalidatePath("/admin");redirect("/admin?ok=updated")}
export async function archiveContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");await setArchived(actor,id,true);revalidatePath("/admin");redirect("/admin?ok=archived")}
export async function restoreContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");await setArchived(actor,id,false);revalidatePath("/admin");redirect("/admin?ok=restored")}
