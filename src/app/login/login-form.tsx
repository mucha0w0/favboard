"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirect"));
  const authErrorMessage =
    searchParams.get("error") === "auth"
      ? "認証に失敗しました。もう一度お試しください。"
      : "";
  const displayMessage = message || authErrorMessage;

  async function handleXLogin() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "x",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleSupabaseLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "確認メールを送信しました。メール内のリンクからログインしてください。",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-stone-900 transition-opacity hover:opacity-70"
          >
            Favboard
          </Link>
          <p className="mt-3 text-sm text-stone-500">
            {isSignUp ? "アカウントを作成" : "ログイン"}
          </p>
        </div>

        {displayMessage && (
          <Alert
            variant={displayMessage.includes("送信") ? "info" : "error"}
            className="mb-6 text-center"
          >
            {displayMessage}
          </Alert>
        )}

        <div className="space-y-6">
          <Button
            type="button"
            className="w-full bg-black text-white hover:bg-neutral-800"
            onClick={handleXLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-base leading-none" aria-hidden>
                𝕏
              </span>
            )}
            Xでログイン
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">または</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={handleSupabaseLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? "アカウント作成" : "ログイン"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-stone-400 transition-colors hover:text-stone-700"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
              }}
            >
              {isSignUp
                ? "すでにアカウントをお持ちの方はこちら"
                : "新規アカウントを作成"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
