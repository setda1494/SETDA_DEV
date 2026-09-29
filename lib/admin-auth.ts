import{redirect}from"next/navigation";import{currentUser}from"@/lib/auth";
export async function requireAdmin(){const user=await currentUser();if(!user)redirect("/login?next=/admin");if(user.role!=="OWNER"&&user.role!=="SYSTEM")redirect("/");return user}
