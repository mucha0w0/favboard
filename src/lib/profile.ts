export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const DISPLAY_NAME_MAX = 40;
export const AVATAR_URL_MAX = 800_000;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const HTTP_AVATAR_PATTERN = /^https?:\/\/[^\s]+$/i;
const DATA_AVATAR_PATTERN =
  /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/]+=*$/i;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "c",
  "dashboard",
  "edit",
  "favboard",
  "help",
  "login",
  "logout",
  "me",
  "null",
  "profile",
  "settings",
  "signup",
  "support",
  "undefined",
  "user",
  "users",
  "www",
]);

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function normalizeDisplayName(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function usernameFromHandle(raw: string | undefined | null): string {
  const cleaned = normalizeUsername(raw ?? "").replace(/[^a-z0-9_]/g, "");
  if (cleaned.length < USERNAME_MIN) return "";
  return cleaned.slice(0, USERNAME_MAX);
}

export function fallbackUsername(userId: string): string {
  const hex = userId.replace(/-/g, "").slice(0, 8);
  return `user_${hex}`.slice(0, USERNAME_MAX);
}

export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `ユーザーIDは${USERNAME_MIN}〜${USERNAME_MAX}文字です`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "ユーザーIDは半角英数字とアンダースコアのみ使えます";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "このユーザーIDは使用できません";
  }
  return null;
}

export function validateDisplayName(displayName: string): string | null {
  if (displayName.length > DISPLAY_NAME_MAX) {
    return `ディスプレイネームは${DISPLAY_NAME_MAX}文字以内です`;
  }
  return null;
}

export function validateAvatarUrl(
  avatarUrl: string | null,
): string | null {
  if (avatarUrl == null || avatarUrl === "") return null;
  if (avatarUrl.length > AVATAR_URL_MAX) {
    return "プロフィール画像が大きすぎます";
  }
  if (DATA_AVATAR_PATTERN.test(avatarUrl) || HTTP_AVATAR_PATTERN.test(avatarUrl)) {
    return null;
  }
  return "プロフィール画像の形式が正しくありません";
}

export function profileInitials(
  displayName: string,
  username: string,
): string {
  const source = displayName.trim() || username.trim();
  if (!source) return "?";
  const chars = Array.from(source);
  if (/^[a-z0-9_]+$/i.test(source)) {
    return chars.slice(0, 2).join("").toUpperCase();
  }
  return chars.slice(0, 2).join("");
}
