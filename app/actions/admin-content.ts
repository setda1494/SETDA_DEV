"use server";
import { ContentKind, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createContent, updateContent } from "@/lib/admin-content";

const kinds=new Set(Object.values(ContentKind));
function json(raw:string):Prisma.InputJsonValue{
  if(raw.length>65536) throw new Error("JSON_TOO_LARGE");
  const value:unknown=JSON.parse(raw);
  if(value===null) throw new Error("JSON_NULL_NOT_ALLOWED");
  return value as Prisma.InputJsonValue;
}
export async function createContentAction(form:FormData){
  const actor=await requireAdmin();
  const kind=String(form.get("kind")??"") as ContentKind;
  if(!kinds.has(kind)) throw new Error("INVALID_KIND");
  await createContent(actor,{kind,key:String(form.get("key")??""),title:String(form.get("title")??""),data:json(String(form.get("data")??"{}")),published:form.get("published")==="on"});
  revalidatePath("/admin"); redirect("/admin?ok=created");
}
export async function updateContentAction(form:FormData){
  const actor=await requireAdmin(); const id=String(form.get("id")??"");
  if(!id) throw new Error("INVALID_ID");
  await updateContent(actor,id,{title:String(form.get("title")??""),data:json(String(form.get("data")??"{}")),published:form.get("published")==="on"});
  revalidatePath("/admin"); redirect("/admin?ok=updated");
}
