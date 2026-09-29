import { ContentKind } from "@prisma/client";
import { db } from "@/lib/db";
import { projects, type Project } from "@/lib/site-data";
import { releases, type Release } from "@/lib/releases";
import { projectMedia, type ProjectMedia } from "@/lib/media";

function object(v:unknown):v is Record<string,unknown>{return typeof v==="object"&&v!==null&&!Array.isArray(v)}
function projectFrom(key:string,title:string,data:unknown):Project|null{
 if(!object(data))return null;
 const base=projects.find(p=>p.slug===key);
 const runtime=data.runtime;
 if(!["web","desktop","service","tool"].includes(String(runtime)))return base??null;
 const tags=Array.isArray(data.tags)?data.tags.filter(object).filter(t=>typeof t.name==="string"&&["language","tool","platform"].includes(String(t.kind))).map(t=>({name:String(t.name),kind:t.kind as "language"|"tool"|"platform"})):[];
 const highlights=Array.isArray(data.highlights)?data.highlights.filter((x):x is string=>typeof x==="string"):[];
 return {slug:key,name:title,category:String(data.category??base?.category??"Software"),description:String(data.description??base?.description??""),summary:String(data.summary??base?.summary??""),status:String(data.status??base?.status??"Active"),featured:Boolean(data.featured??base?.featured),runtime:runtime as Project["runtime"],tags:tags.length?tags:(base?.tags??[]),highlights:highlights.length?highlights:(base?.highlights??[]),repository:typeof data.repository==="string"?data.repository:base?.repository,release:typeof data.release==="string"?data.release:base?.release,webGame:object(data.webGame)?{enabled:data.webGame.enabled===true,entry:typeof data.webGame.entry==="string"?data.webGame.entry:undefined}:base?.webGame};
}
function releaseFrom(key:string,title:string,data:unknown):Release|null{
 if(!object(data))return null; const state=data.state;
 if(state!=="published"&&state!=="pending")return null;
 if(typeof data.projectSlug!=="string"||typeof data.artifact!=="string"||typeof data.version!=="string"||typeof data.platform!=="string")return null;
 return {id:key,projectSlug:data.projectSlug,project:title,artifact:data.artifact,version:data.version,platform:data.platform,state,size:typeof data.size==="string"?data.size:undefined,sha256:typeof data.sha256==="string"?data.sha256:undefined,publishedAt:typeof data.publishedAt==="string"?data.publishedAt:undefined,downloadUrl:typeof data.downloadUrl==="string"?data.downloadUrl:undefined,changelog:Array.isArray(data.changelog)?data.changelog.filter((x):x is string=>typeof x==="string"):[]};
}
function mediaFrom(key:string,title:string,data:unknown):ProjectMedia|null{
 if(!object(data)||typeof data.projectSlug!=="string"||(data.kind!=="image"&&data.kind!=="video")||typeof data.src!=="string"||typeof data.alt!=="string")return null;
 return {id:key,projectSlug:data.projectSlug,kind:data.kind,title,caption:typeof data.caption==="string"?data.caption:undefined,src:data.src,poster:typeof data.poster==="string"?data.poster:undefined,alt:data.alt};
}
export async function publicProjects(){
 const rows=await db.contentEntry.findMany({where:{kind:ContentKind.PROJECT,published:true}});
 if(!rows.length)return projects;
 const overrides=new Map(rows.map(r=>[r.key,projectFrom(r.key,r.title,r.data)]));
 const merged=projects.map(p=>overrides.get(p.slug)??p); const known=new Set(projects.map(p=>p.slug));
 return [...merged,...rows.filter(r=>!known.has(r.key)).map(r=>projectFrom(r.key,r.title,r.data)).filter((p):p is Project=>Boolean(p))];
}
export async function publicProject(slug:string){return (await publicProjects()).find(p=>p.slug===slug)}
export async function publicReleases(){
 const rows=await db.contentEntry.findMany({where:{kind:ContentKind.RELEASE,published:true}});
 if(!rows.length)return releases;
 const parsed=rows.map(r=>releaseFrom(r.key,r.title,r.data)).filter((x):x is Release=>Boolean(x));
 return parsed.length?parsed:releases;
}
export async function publicMedia(slug:string){
 const rows=await db.contentEntry.findMany({where:{kind:ContentKind.MEDIA,published:true}});
 const parsed=rows.map(r=>mediaFrom(r.key,r.title,r.data)).filter((x):x is ProjectMedia=>Boolean(x)).filter(x=>x.projectSlug===slug);
 return parsed.length?parsed:projectMedia.filter(x=>x.projectSlug===slug);
}
