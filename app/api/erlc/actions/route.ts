import { NextResponse } from "next/server";
import { erlcClient } from "@/lib/erlc/client";

export async function GET() {
  return NextResponse.json({ actions: await erlcClient.listModerationActions() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await erlcClient.runAction({
    type: body.type,
    playerId: body.playerId,
    reason: body.reason,
  });
  return NextResponse.json(result);
}
