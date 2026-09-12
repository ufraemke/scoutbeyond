import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { url, anonKey, schema } = getSupabasePublicEnv();

  return createBrowserClient(url, anonKey, {
    db: { schema: schema || "public" },
  });
}
