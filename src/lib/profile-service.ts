import {
  fallbackUsername,
  usernameFromHandle,
  validateAvatarUrl,
  validateDisplayName,
  validateUsername,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/lib/types";
import { type User } from "@supabase/supabase-js";

export class ProfileError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

type ProfileRow = Profile;

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name ?? "",
    avatar_url: row.avatar_url ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function suggestedUsername(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromHandle = usernameFromHandle(
    (meta.user_name as string | undefined) ??
      (meta.preferred_username as string | undefined) ??
      (meta.user_handle as string | undefined),
  );
  if (fromHandle && !validateUsername(fromHandle)) return fromHandle;
  return fallbackUsername(user.id);
}

function defaultDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    (meta.display_name as string | undefined) ??
    "";
  return name.slice(0, 40);
}

function defaultAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;
  if (!url || validateAvatarUrl(url)) return null;
  return url;
}

export async function getOrCreateProfile(user: User): Promise<Profile> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);
  if (existing) return mapProfile(existing as ProfileRow);

  let username = suggestedUsername(user);
  const displayName = defaultDisplayName(user);
  const avatarUrl = defaultAvatarUrl(user);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (!error && data) return mapProfile(data as ProfileRow);

    if (error?.code === "23505") {
      const { data: raced } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (raced) return mapProfile(raced as ProfileRow);
      username = `${fallbackUsername(user.id).slice(0, 20)}_${attempt + 1}`;
      continue;
    }

    throw new Error(error?.message ?? "プロフィールの作成に失敗しました");
  }

  throw new Error("プロフィールの作成に失敗しました");
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "username" | "display_name" | "avatar_url">>,
): Promise<Profile> {
  const patch: Partial<Pick<Profile, "username" | "display_name" | "avatar_url">> =
    {};

  if (updates.username !== undefined) {
    const usernameError = validateUsername(updates.username);
    if (usernameError) throw new ProfileError(usernameError, 400);
    patch.username = updates.username;
  }

  if (updates.display_name !== undefined) {
    const displayError = validateDisplayName(updates.display_name);
    if (displayError) throw new ProfileError(displayError, 400);
    patch.display_name = updates.display_name;
  }

  if (updates.avatar_url !== undefined) {
    const avatarError = validateAvatarUrl(updates.avatar_url);
    if (avatarError) throw new ProfileError(avatarError, 400);
    patch.avatar_url = updates.avatar_url;
  }

  if (Object.keys(patch).length === 0) {
    throw new ProfileError("更新する項目がありません", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();

  if (error?.code === "23505") {
    throw new ProfileError("このユーザーIDは既に使われています", 409);
  }
  if (error?.code === "23514") {
    throw new ProfileError("入力内容が正しくありません", 400);
  }
  if (error) throw new Error(error.message);
  if (!data) throw new ProfileError("プロフィールが見つかりません", 404);

  return mapProfile(data as ProfileRow);
}
