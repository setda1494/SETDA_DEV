import { Role } from "@prisma/client";import { db } from "./db";
export async function changeUserRole(actor:{id:string;role:Role},targetId:string,nextRole:Role){
 if(actor.role!==Role.OWNER)throw new Error("OWNER_REQUIRED");
 if(actor.id===targetId)throw new Error("CANNOT_CHANGE_OWN_ROLE");
 const target=await db.user.findUnique({where:{id:targetId},select:{id:true,role:true}});if(!target)throw new Error("USER_NOT_FOUND");
 if(target.role===Role.OWNER&&nextRole!==Role.OWNER){const owners=await db.user.count({where:{role:Role.OWNER}});if(owners<=1)throw new Error("LAST_OWNER_REQUIRED")}
 return db.$transaction(async tx=>{const user=await tx.user.update({where:{id:targetId},data:{role:nextRole},select:{id:true,email:true,displayName:true,role:true}});await tx.session.deleteMany({where:{userId:targetId}});return user})
}