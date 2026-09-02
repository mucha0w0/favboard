"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingMode, setCheckingMode] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const authErrorMessage =
    searchParams.get("error") === "auth"
      ? "認証に失敗しました。もう一度お試しください。"
      : "";
  const displayMessage = message || authErrorMessage;

  useEffect(() => {
    fetch("/api/auth/mode")
      .then((r) => r.json())
      .then((data) => setIsLocalMode(data.mode === "local"))
      .finally(() => setCheckingMode(false));
  }, [searchParams]);

  async function handleLocalLogin() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/local", { method: "POST" });

    if (res.ok) {
      router.push(redirect);
    } else {
      setMessage("ログインに失敗しました");
    }
    setLoading(false);
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
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
        router.push(redirect);
      }
    }

    setLoading(false);
  }

  if (checkingMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-5 w-5 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-stone-900"
          >
            Visual Wishlist
          </Link>
          <p className="mt-3 text-sm text-stone-500">
            {isLocalMode
              ? "ローカルモード"
              : isSignUp
                ? "アカウントを作成"
                : "ログイン"}
          </p>
        </div>

        {displayMessage && (
          <Alert
            variant={displayMessage.includes("送信") ? "info" : "error"}
            className="mb-4"
          >
            {displayMessage}
          </Alert>
        )}

        {isLocalMode ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="mb-5 text-xs leading-relaxed text-stone-500">
              データはこのPCの{" "}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-stone-600">
                .data/
              </code>{" "}
              に保存されます。
            </p>
            <Button
              className="w-full"
              onClick={handleLocalLogin}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              はじめる
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSupabaseLogin}
            className="rounded-lg border border-stone-200 bg-white p-6"
          >
            <div className="space-y-4">
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
            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? "アカウント作成" : "ログイン"}
            </Button>
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-stone-400 transition-colors hover:text-stone-700"
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
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
