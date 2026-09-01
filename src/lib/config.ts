export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes("your-project") &&
    key !== "your-anon-key"
  );
}

export const LOCAL_DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
