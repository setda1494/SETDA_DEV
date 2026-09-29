import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export const SESSION_COOKIE="setda_session";
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
export type SessionUser={id:string;email:string;displayName:string;role:"OWNER"|"SYSTEM"|"USER"};
export async function createSession(userId:string){const token=randomBytes(32).toString("base64url"),expiresAt=new Date(Date.now()+30*86400000);await db.session.create({data:{userId,tokenHash:hash(token),expiresAt}});(await cookies()).set(SESSION_COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:expiresAt})}
export async function destroySession(){const c=await cookies(),token=c.get(SESSION_COOKIE)?.value;if(token)await db.session.deleteMany({where:{tokenHash:hash(token)}});c.delete(SESSION_COOKIE)}
export async function currentUser():Promise<SessionUser|null>{const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;const s=await db.session.findUnique({where:{tokenHash:hash(token)},include:{user:true}});if(!s||s.expiresAt<=new Date()){if(s)await db.session.delete({where:{id:s.id}});return null}return{id:s.user.id,email:s.user.email,displayName:s.user.displayName,role:s.user.role}}
export async function optionalCurrentUser():Promise<SessionUser|null>{try{return await currentUser()}catch{return null}}
