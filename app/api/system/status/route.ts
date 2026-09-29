import { NextRequest, NextResponse } from "next/server";
import { authenticateServiceToken } from "@/lib/service-auth";

export async function GET(request: NextRequest) {
  const service = await authenticateServiceToken(request.headers.get("authorization"));
  if (!service) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    service: { id: service.user.id, name: service.user.displayName, role: service.user.role, tokenName: service.tokenName },
  });
}
