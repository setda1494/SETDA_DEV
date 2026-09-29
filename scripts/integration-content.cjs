/* eslint-disable @typescript-eslint/no-require-imports */
const {PrismaClient,ContentKind}=require("@prisma/client");const {z}=require("zod");const db=new PrismaClient();
const suffix=Date.now().toString(36),prefix="itest-content-"+suffix,slug=z.string().regex(/^[a-z0-9][a-z0-9._-]{1,79}$/);
const https=z.string().refine(v=>{try{return new URL(v).protocol==="https:"}catch{return false}});
const safeLocal=p=>z.string().refine(v=>v.startsWith(p)&&!v.includes("..")&&!v.includes("\\"));
const safeMedia=z.string().refine(v=>(v.startsWith("/media/")&&!v.includes("..")&&!v.includes("\\"))||(()=>{try{return new URL(v).protocol==="https:"}catch{return false}})());
const project=z.object({category:z.string().min(1),description:z.string(),summary:z.string(),status:z.string().min(1),runtime:z.enum(["web","desktop","service","tool"]),tags:z.array(z.object({name:z.string().min(1),kind:z.enum(["language","tool","platform"])})),highlights:z.array(z.string().min(1))});
const webGame=z.object({projectSlug:slug,enabled:z.boolean(),entry:z.union([safeLocal("/games-content/"),https])});
function ok(n,v){if(!v)throw new Error(n+"_FAIL");console.log(n+"=PASS")}
(async()=>{const ids=[];try{const webKey=prefix+"-web",deskKey=prefix+"-desktop",base={category:"Test",description:"test",summary:"test",status:"Test",tags:[{name:"TypeScript",kind:"language"}],highlights:["test"]};
for(const [key,runtime,published,archivedAt] of [[webKey,"web",true,null],[deskKey,"desktop",true,null],[prefix+"-draft","web",false,null],[prefix+"-archived","web",true,new Date()]]){const x=await db.contentEntry.create({data:{kind:ContentKind.PROJECT,key,title:"Integration Test",data:{...base,runtime},published,archivedAt}});ids.push(x.id)}
const visible=await db.contentEntry.findMany({where:{kind:ContentKind.PROJECT,published:true,archivedAt:null,key:{startsWith:prefix}}});
ok("PUBLISHED_FILTER",visible.some(x=>x.key===webKey)&&!visible.some(x=>x.key.endsWith("-draft")));ok("ARCHIVE_FILTER",!visible.some(x=>x.key.endsWith("-archived")));
ok("HTTPS_ONLY",https.safeParse("https://example.com/x").success&&!https.safeParse("http://example.com/x").success&&!https.safeParse("javascript:alert(1)").success&&!https.safeParse("file:///x").success);
ok("MEDIA_PATH_GUARD",safeMedia.safeParse("/media/project/shot.png").success&&!safeMedia.safeParse("/media/../secret").success&&!safeMedia.safeParse("C:\\secret.png").success&&!safeMedia.safeParse("data:text/plain,x").success);
ok("WEB_PATH_GUARD",webGame.safeParse({projectSlug:webKey,enabled:true,entry:"/games-content/demo/index.html"}).success&&!webGame.safeParse({projectSlug:webKey,enabled:true,entry:"/games-content/../secret"}).success);
const desk=visible.find(x=>x.key===deskKey);ok("DESKTOP_PLAY_BLOCK",project.parse(desk.data).runtime!=="web");ok("REFERENCE_ACTIVE",Boolean(await db.contentEntry.findFirst({where:{kind:ContentKind.PROJECT,key:webKey,archivedAt:null}})));console.log("CONTENT_INTEGRATION_PASS");
}finally{if(ids.length)await db.contentEntry.deleteMany({where:{id:{in:ids}}});await db.$disconnect()}})().catch(e=>{console.error(e);process.exit(1)});
