import { NextResponse } from "next/server";
import { erlcClient } from "@/lib/erlc/client";

export async function GET() {
  return NextResponse.json({ server: await erlcClient.getServer() });
}
