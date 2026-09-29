import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { asPrismaJson, gameSaveBody, gameSaveQuery, isSaveEnabledGame } from "@/lib/game-save";

const MAX_BODY_BYTES=262144;
const unavailable=()=>NextResponse.json({error:"service_unavailable"},{status:503});

export async function GET(req:Request){
  try{
    const user=await currentUser();
    if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
    const url=new URL(req.url);
    const parsed=gameSaveQuery.safeParse({gameKey:url.searchParams.get("gameKey"),slot:url.searchParams.get("slot")??"default"});
    if(!parsed.success)return NextResponse.json({error:"invalid_request"},{status:400});
    if(!await isSaveEnabledGame(parsed.data.gameKey))return NextResponse.json({error:"game_not_available"},{status:404});
    const save=await db.gameSave.findUnique({where:{userId_gameKey_slot:{userId:user.id,...parsed.data}}});
    return NextResponse.json({save});
  }catch{return unavailable()}
}

export async function PUT(req:Request){
  try{
    const user=await currentUser();
    if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
    const length=Number(req.headers.get("content-length")??0);
    if(Number.isFinite(length)&&length>MAX_BODY_BYTES)return NextResponse.json({error:"payload_too_large"},{status:413});
    const raw=await req.text();
    if(Buffer.byteLength(raw)>MAX_BODY_BYTES)return NextResponse.json({error:"payload_too_large"},{status:413});
    let value:unknown;
    try{value=JSON.parse(raw)}catch{return NextResponse.json({error:"invalid_json"},{status:400})}
    const parsed=gameSaveBody.safeParse(value);
    if(!parsed.success)return NextResponse.json({error:"invalid_request"},{status:400});
    if(!await isSaveEnabledGame(parsed.data.gameKey))return NextResponse.json({error:"game_not_available"},{status:404});
    const d=parsed.data;
    const save=await db.gameSave.upsert({where:{userId_gameKey_slot:{userId:user.id,gameKey:d.gameKey,slot:d.slot}},create:{userId:user.id,gameKey:d.gameKey,slot:d.slot,version:d.version,payload:asPrismaJson(d.payload)},update:{version:d.version,payload:asPrismaJson(d.payload)}});
    return NextResponse.json({save:{gameKey:save.gameKey,slot:save.slot,version:save.version,updatedAt:save.updatedAt}});
  }catch{return unavailable()}
}
