"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageFileToAvatarDataUrl } from "@/lib/image-input";
import {
  DISPLAY_NAME_MAX,
  USERNAME_MAX,
  normalizeDisplayName,
  normalizeUsername,
  profileInitials,
  validateDisplayName,
  validateUsername,
} from "@/lib/profile";
import { type Profile } from "@/lib/types";
import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

interface AccountSettingsProps {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}

export function AccountSettings({ profile, onSaved }: AccountSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usernameError = username
    ? validateUsername(normalizeUsername(username))
    : "ユーザーIDを入力してください";
  const displayNameError = validateDisplayName(
    normalizeDisplayName(displayName),
  );

  const dirty =
    normalizeUsername(username) !== profile.username ||
    normalizeDisplayName(displayName) !== (profile.display_name ?? "") ||
    avatarUrl !== profile.avatar_url;

  const canSave =
    dirty && !usernameError && !displayNameError && !saving && !imageLoading;

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    setImageLoading(true);
    setError("");
    setSuccess("");
    try {
      const dataUrl = await imageFileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "画像の読み込みに失敗しました",
      );
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizeUsername(username),
          display_name: normalizeDisplayName(displayName),
          avatar_url: avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      onSaved(data);
      setUsername(data.username);
      setDisplayName(data.display_name);
      setAvatarUrl(data.avatar_url);
      setSuccess("保存しました");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const initials = profileInitials(displayName, username);

  return (
    <section className="mb-12 border-b border-stone-200/80 pb-10 sm:mb-14">
      <h2 className="mb-6 text-lg font-semibold text-stone-900">
        アカウント設定
      </h2>
      <form
        className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="flex shrink-0 flex-col items-start gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading || saving}
              className="relative h-20 w-20 rounded-full text-sm font-medium text-stone-600 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              aria-label="プロフィール画像を変更"
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-stone-200 ring-1 ring-stone-200/80">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
                {imageLoading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </span>
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white ring-2 ring-stone-50">
                <Camera className="h-3 w-3" />
              </span>
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl(null);
                  setSuccess("");
                }}
                disabled={saving}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-stone-500 shadow-sm ring-1 ring-stone-200 hover:text-stone-800"
                aria-label="プロフィール画像を削除"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-stone-400">クリックして画像を変更</p>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">ディスプレイネーム</Label>
            <Input
              id="display-name"
              value={displayName}
              maxLength={DISPLAY_NAME_MAX}
              placeholder="表示名"
              disabled={saving}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSuccess("");
              }}
            />
            {displayNameError && (
              <p className="text-xs text-red-600">{displayNameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">ユーザーID</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-stone-400">@</span>
              <Input
                id="username"
                value={username}
                maxLength={USERNAME_MAX}
                placeholder="your_id"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={saving}
                onChange={(e) => {
                  setUsername(normalizeUsername(e.target.value));
                  setSuccess("");
                }}
              />
            </div>
            <p className="text-xs text-stone-400">
              半角英数字とアンダースコア、3〜24文字
            </p>
            {username && usernameError && (
              <p className="text-xs text-red-600">{usernameError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" type="submit" disabled={!canSave}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              保存
            </Button>
            {success && (
              <Alert variant="success" className="mb-0">
                {success}
              </Alert>
            )}
          </div>
          {error && (
            <Alert variant="error" className="mb-0">
              {error}
            </Alert>
          )}
        </div>
      </form>
    </section>
  );
}
