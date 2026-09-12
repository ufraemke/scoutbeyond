import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";

export async function createClient() {
  const { url, anonKey, schema } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    db: { schema: schema || "public" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. Safe to ignore without auth middleware.
        }
      },
    },
  });
}
