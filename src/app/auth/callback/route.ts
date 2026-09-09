import { isSupabaseConfigured } from "@/lib/config";
import { safeInternalPath } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            redirectResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return redirectResponse;
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
