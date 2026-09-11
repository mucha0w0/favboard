import { createClient } from "@/lib/supabase/client";

/**
 * Email/password auth is implemented and kept for later use,
 * but the website currently only exposes X (Twitter) login.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  redirectTo: string,
) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}
