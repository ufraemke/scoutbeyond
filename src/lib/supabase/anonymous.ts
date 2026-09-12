import { createClient } from "@/lib/supabase/client";

/**
 * Ensure the browser has an anonymous Supabase session for owner-scoped RLS.
 */
export async function ensureAnonymousSession() {
  const supabase = createClient();
  const { data: existing, error: existingError } = await supabase.auth.getSession();
  if (existingError) {
    throw existingError;
  }
  if (existing.session) {
    return existing.session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }
  if (!data.session) {
    throw new Error("Anonymous sign-in did not return a session.");
  }
  return data.session;
}
