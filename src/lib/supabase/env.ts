export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
  schema?: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)?.trim();
  const schema = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA)?.trim() || "public";

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Please set your Supabase URL and Key in .env.",
    );
  }

  return { url, anonKey, schema };
}

export function readSupabasePublicEnv():
  | { configured: true; env: SupabasePublicEnv }
  | { configured: false } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)?.trim();
  const schema = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA)?.trim() || "public";

  if (!url || !anonKey) {
    return { configured: false };
  }

  return { configured: true, env: { url, anonKey, schema } };
}
