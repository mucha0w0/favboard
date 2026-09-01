import { setLocalSessionCookie } from "@/lib/local/session";
import { isSupabaseConfigured } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Local auth not available in Supabase mode" },
      { status: 400 },
    );
  }

  await request.json().catch(() => ({}));
  await setLocalSessionCookie();
  return NextResponse.json({ success: true });
}
