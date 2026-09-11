import { getOrCreateProfile, ProfileError, updateProfile } from "@/lib/profile-service";
import {
  normalizeDisplayName,
  normalizeUsername,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/lib/types";
import { NextResponse } from "next/server";

function toPublicError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Server error";
  if (
    /could not find the table/i.test(message) ||
    /relation .+profiles.+ does not exist/i.test(message) ||
    /schema cache/i.test(message)
  ) {
    return "プロフィール用テーブルが未作成です。Supabase で 002_profiles.sql を実行してください。";
  }
  return message;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateProfile(user);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: toPublicError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const updates: Partial<Pick<Profile, "username" | "display_name" | "avatar_url">> =
    {};

  if ("username" in raw) {
    if (typeof raw.username !== "string") {
      return NextResponse.json(
        { error: "ユーザーIDの形式が正しくありません" },
        { status: 400 },
      );
    }
    updates.username = normalizeUsername(raw.username);
  }

  if ("display_name" in raw) {
    if (typeof raw.display_name !== "string") {
      return NextResponse.json(
        { error: "ディスプレイネームの形式が正しくありません" },
        { status: 400 },
      );
    }
    updates.display_name = normalizeDisplayName(raw.display_name);
  }

  if ("avatar_url" in raw) {
    if (raw.avatar_url !== null && typeof raw.avatar_url !== "string") {
      return NextResponse.json(
        { error: "プロフィール画像の形式が正しくありません" },
        { status: 400 },
      );
    }
    updates.avatar_url =
      typeof raw.avatar_url === "string" && raw.avatar_url.trim()
        ? raw.avatar_url.trim()
        : null;
  }

  try {
    await getOrCreateProfile(user);
    const profile = await updateProfile(user.id, updates);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof ProfileError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: toPublicError(error) }, { status: 500 });
  }
}
