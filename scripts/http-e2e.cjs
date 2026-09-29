/* eslint-disable @typescript-eslint/no-require-imports */
const {spawn}=require("node:child_process");
const base="http://127.0.0.1:3011";
const checks=[];
const ok=(name,pass,detail="")=>{checks.push([name,pass,detail]);console.log(name+"="+(pass?"PASS":"FAIL")+(detail?" "+detail:""));};
async function hit(path,opts={}){return fetch(base+path,{redirect:"manual",...opts})}
(async()=>{
 const child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p","3011"],{cwd:process.cwd(),stdio:["ignore","pipe","pipe"],env:{...process.env,NODE_ENV:"production"}});
 let log="";child.stdout.on("data",d=>log+=d);child.stderr.on("data",d=>log+=d);
 try{
  for(let i=0;i<40;i++){try{const r=await hit("/");if(r.status===200)break}catch{} await new Promise(r=>setTimeout(r,250))}
  for(const [name,path] of [["HOME_HTTP","/"],["PROJECTS_HTTP","/projects"],["RELEASES_HTTP","/releases"],["GAMES_HTTP","/games"],["LOGIN_HTTP","/login"],["REGISTER_HTTP","/register"]]){const r=await hit(path);ok(name,r.status===200,"status="+r.status)}
  let r=await hit("/projects/project2080");ok("PROJECT_DETAIL_HTTP",r.status===200,"status="+r.status);
  r=await hit("/projects/not-a-real-project");ok("UNKNOWN_PROJECT_404",r.status===404,"status="+r.status);
  r=await hit("/play/project2080");ok("DESKTOP_GAME_BLOCK_HTTP",r.status===404,"status="+r.status);
  r=await hit("/play/not-a-real-game");ok("UNKNOWN_GAME_404",r.status===404,"status="+r.status);
  r=await hit("/admin");ok("ADMIN_AUTH_REDIRECT",r.status>=300&&r.status<400&&(r.headers.get("location")||"").includes("/login"),"status="+r.status+" location="+r.headers.get("location"));
  r=await hit("/api/saves");ok("SAVE_AUTH_REQUIRED",r.status===401,"status="+r.status);
  r=await hit("/login",{headers:{cookie:"setda_session=invalid-e2e-token"}});ok("STALE_SESSION_PUBLIC_RESILIENCE",r.status===200,"status="+r.status);
  if(checks.some(x=>!x[1])){console.error(log);process.exitCode=1}else console.log("HTTP_E2E_PASS");
 }finally{child.kill("SIGTERM")}
})().catch(e=>{console.error(e);process.exit(1)});
