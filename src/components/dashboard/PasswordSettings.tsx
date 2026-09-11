"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_MIN_LENGTH,
  mapPasswordUpdateError,
  validateNewPassword,
} from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function userHasPasswordAuth(user: {
  identities?: { provider: string }[] | null;
  app_metadata?: { provider?: string; providers?: string[] };
}): boolean {
  if (user.identities?.some((identity) => identity.provider === "email")) {
    return true;
  }
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes("email")) return true;
  return user.app_metadata?.provider === "email";
}

export function PasswordSettings() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setHasPassword(user ? userHasPasswordAuth(user) : false);
      setReady(true);
    }
    void load();
  }, []);

  const passwordError = (() => {
    if (!nextPassword && !confirmPassword) return null;
    if (nextPassword.length > 0 && nextPassword.length < PASSWORD_MIN_LENGTH) {
      return `パスワードは${PASSWORD_MIN_LENGTH}文字以上です`;
    }
    if (/\s/.test(nextPassword)) return "パスワードに空白は使えません";
    if (
      hasPassword &&
      currentPassword &&
      nextPassword &&
      nextPassword === currentPassword
    ) {
      return "現在のパスワードと別のパスワードを入力してください";
    }
    if (confirmPassword && nextPassword !== confirmPassword) {
      return "新しいパスワードが一致しません";
    }
    return null;
  })();

  const canSubmit =
    !saving &&
    Boolean(email) &&
    (!hasPassword || currentPassword.length > 0) &&
    !validateNewPassword(
      nextPassword,
      confirmPassword,
      hasPassword ? currentPassword : undefined,
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !email) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      if (hasPassword) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (verifyError) {
          setError(mapPasswordUpdateError(verifyError.message));
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: nextPassword,
      });
      if (updateError) {
        setError(mapPasswordUpdateError(updateError.message));
        return;
      }

      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setHasPassword(true);
      setSuccess("パスワードを変更しました");
    } catch {
      setError("パスワードの変更に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="mt-10 border-t border-stone-200/80 pt-8">
        <h3 className="text-sm font-medium text-stone-900">パスワード</h3>
        <Loader2 className="mt-4 h-4 w-4 animate-spin text-stone-300" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="mt-10 border-t border-stone-200/80 pt-8">
        <h3 className="text-sm font-medium text-stone-900">パスワード</h3>
        <p className="mt-2 text-sm text-stone-500">
          メールアドレスで登録したアカウントのみ、パスワードを変更できます。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-stone-200/80 pt-8">
      <h3 className="text-sm font-medium text-stone-900">パスワード</h3>
      <p className="mt-1.5 text-xs text-stone-400">
        {hasPassword
          ? "現在のパスワードを確認してから、新しいパスワードを保存します。"
          : "メールアドレスでもログインできるよう、パスワードを設定できます。"}
      </p>

      <form className="mt-5 max-w-md space-y-5" onSubmit={handleSubmit}>
        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">現在のパスワード</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              disabled={saving}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setSuccess("");
              }}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="new-password">新しいパスワード</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={nextPassword}
            disabled={saving}
            onChange={(e) => {
              setNextPassword(e.target.value);
              setSuccess("");
            }}
          />
          <p className="text-xs text-stone-400">
            {PASSWORD_MIN_LENGTH}文字以上
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={confirmPassword}
            disabled={saving}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setSuccess("");
            }}
          />
        </div>
        {passwordError && (
          <Alert variant="error">{passwordError}</Alert>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" type="submit" disabled={!canSubmit}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {hasPassword ? "パスワードを変更" : "パスワードを設定"}
          </Button>
          {success && (
            <Alert variant="success" className="mb-0">
              {success}
            </Alert>
          )}
        </div>
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </div>
  );
}
