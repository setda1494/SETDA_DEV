/* eslint-disable @typescript-eslint/no-require-imports */
const {PrismaClient,ContentKind}=require("@prisma/client");const db=new PrismaClient();
const projects=[
["project2080","Project2080",{category:"Game",description:"Extraction-style game project built as a production-focused vertical slice.",summary:"A Windows Unity project covering combat, inventory, progression, missions, bosses and release-candidate validation.",status:"Final Candidate",featured:true,runtime:"desktop",tags:[{name:"C#",kind:"language"},{name:"Unity",kind:"tool"},{name:"Windows",kind:"platform"}],highlights:["Windows desktop game","Release-candidate validation","Combat, loot and progression systems"]}],
["remote-home","REMOTE_HOME",{category:"Server / Infra",description:"Remote development and home-computing environment for secure access and automation.",summary:"A remote development stack connecting the home workstation and mobile development workflow.",status:"Active",featured:true,runtime:"service",tags:[{name:"PowerShell",kind:"language"},{name:"OpenSSH",kind:"tool"},{name:"Tailscale",kind:"tool"}],highlights:["Remote SSH workflow","Private network access","Recovery-oriented automation"]}],
["vbox-share-sync","VirtualBox Share Sync",{category:"Software",description:"Linux utility for synchronizing VirtualBox shared folders with a local workspace.",summary:"A Linux classroom utility that keeps VirtualBox shared-folder content synchronized with a local working directory.",status:"Stable",runtime:"tool",tags:[{name:"Shell",kind:"language"},{name:"Linux",kind:"platform"},{name:"VirtualBox",kind:"tool"}],highlights:["CLI and GUI entry points","systemd service integration","Shared-folder synchronization"]}],
["setda-dev","SETDA1494 Developer Hub",{category:"Web",description:"Developer portfolio, release archive and web-game platform.",summary:"This site: a project archive, release surface, account system and browser-game host.",status:"Phase 6",featured:true,runtime:"web",tags:[{name:"TypeScript",kind:"language"},{name:"Next.js",kind:"tool"},{name:"PostgreSQL",kind:"tool"}],highlights:["Database-backed content administration","DB-backed accounts and sessions","Cloud-save API foundation"],webGame:{enabled:false}}]
];
const releases=[
["project2080-fc","Project2080",{projectSlug:"project2080",artifact:"Windows build",version:"Final Candidate",platform:"Windows x64",state:"pending",changelog:["Release candidate validated locally","Binary publication pending"]}],
["setda-dev-phase6","SETDA1494 Developer Hub",{projectSlug:"setda-dev",artifact:"Web deployment",version:"Phase 6",platform:"Web",state:"pending",changelog:["Database-backed content administration","Published DB content precedence"]}],
["vbox-sync-stable","VirtualBox Share Sync",{projectSlug:"vbox-share-sync",artifact:"Linux utility",version:"stable",platform:"Linux",state:"pending",changelog:["CLI and GUI workflow","systemd integration"]}]
];
(async()=>{try{
for(const [key,title,data] of projects)await db.contentEntry.upsert({where:{kind_key:{kind:ContentKind.PROJECT,key}},create:{kind:ContentKind.PROJECT,key,title,data,published:true},update:{title,data,published:true}});
for(const [key,title,data] of releases)await db.contentEntry.upsert({where:{kind_key:{kind:ContentKind.RELEASE,key}},create:{kind:ContentKind.RELEASE,key,title,data,published:true},update:{title,data,published:true}});
const counts=await db.contentEntry.groupBy({by:["kind"],_count:{_all:true}});console.log(JSON.stringify(counts));console.log("SEED_PASS");
}finally{await db.$disconnect()}})().catch(e=>{console.error(e);process.exit(1)});
