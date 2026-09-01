import { clearLocalSessionCookie } from "@/lib/local/session";
import { isSupabaseConfigured } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST() {
  if (!isSupabaseConfigured()) {
    await clearLocalSessionCookie();
  }
  return NextResponse.json({ success: true });
}
