"use server";
import { ContentKind, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createContent, updateContent, setArchived } from "@/lib/admin-content";
import { db } from "@/lib/db";
import { validateContent, validateReferences } from "@/lib/content-validation";
const kinds=new Set(Object.values(ContentKind));
const text=(f:FormData,n:string)=>String(f.get(n)??"").trim(),list=(f:FormData,n:string)=>text(f,n).split("\n").map(x=>x.trim()).filter(Boolean);
const optional=(v:string)=>v? v:undefined;
function parseTags(f:FormData){return list(f,"tags").map(line=>{const i=line.indexOf(":");if(i<1)throw new Error("INVALID_TAG_FORMAT");return{kind:line.slice(0,i).trim(),name:line.slice(i+1).trim()}})}
function compact<T extends Record<string,unknown>>(value:T){return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined)) as Prisma.InputJsonValue}
function typed(f:FormData,kind:ContentKind):Prisma.InputJsonValue{
 if(kind===ContentKind.PROJECT)return compact({category:text(f,"category"),description:text(f,"description"),summary:text(f,"summary"),status:text(f,"status"),runtime:text(f,"runtime"),tags:parseTags(f),highlights:list(f,"highlights"),featured:f.get("featured")==="on",repository:optional(text(f,"repository")),release:optional(text(f,"release"))});
 if(kind===ContentKind.RELEASE)return compact({projectSlug:text(f,"projectSlug"),artifact:text(f,"artifact"),version:text(f,"version"),platform:text(f,"platform"),state:text(f,"state"),downloadUrl:optional(text(f,"downloadUrl")),size:optional(text(f,"size")),sha256:optional(text(f,"sha256")),publishedAt:optional(text(f,"publishedAt")),changelog:list(f,"changelog")});
 if(kind===ContentKind.MEDIA)return compact({projectSlug:text(f,"projectSlug"),kind:text(f,"mediaKind"),src:text(f,"src"),alt:text(f,"alt"),caption:optional(text(f,"caption")),poster:optional(text(f,"poster"))});
 return compact({projectSlug:text(f,"projectSlug"),enabled:f.get("enabled")==="on",entry:text(f,"entry")});
}
export async function createContentAction(form:FormData){const actor=await requireAdmin(),kind=text(form,"kind") as ContentKind;if(!kinds.has(kind))throw new Error("INVALID_KIND");const data=validateContent(kind,typed(form,kind));await validateReferences(kind,data);await createContent(actor,{kind,key:text(form,"key"),title:text(form,"title"),data,published:form.get("published")==="on"});revalidatePath("/admin");redirect("/admin?ok=created")}
export async function updateContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");const current=await db.contentEntry.findUnique({where:{id},select:{kind:true}});if(!current)throw new Error("CONTENT_NOT_FOUND");const data=validateContent(current.kind,typed(form,current.kind));await validateReferences(current.kind,data);await updateContent(actor,id,{title:text(form,"title"),data,published:form.get("published")==="on"});revalidatePath("/admin");redirect("/admin?ok=updated")}
export async function archiveContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");await setArchived(actor,id,true);revalidatePath("/admin");redirect("/admin?ok=archived")}
export async function restoreContentAction(form:FormData){const actor=await requireAdmin(),id=text(form,"id");if(!id)throw new Error("INVALID_ID");await setArchived(actor,id,false);revalidatePath("/admin");redirect("/admin?ok=restored")}
