import { createClient as createBrowserClient } from "./client";
import { readSupabasePublicEnv } from "./env";

export interface ProblemRecord {
  id: string;
  raw_input?: string;
  statement?: string;
  status: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a research session from Supabase by ID.
 * Legacy helper for the older problems table — prefer live research_runs APIs.
 */
export async function getProblemSession(
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const env = readSupabasePublicEnv();
  if (!env.configured) return null;

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    console.warn("[Supabase] getProblemSession error:", error);
    return null;
  }

  const record = data as ProblemRecord;
  return record.data || record;
}

/**
 * List the most recent research sessions.
 */
export async function listRecentProblems(limit = 10): Promise<ProblemRecord[]> {
  const env = readSupabasePublicEnv();
  if (!env.configured) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("problems")
    .select("id, raw_input, statement, status, data, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.warn("[Supabase] listRecentProblems error:", error);
    return [];
  }

  return data as ProblemRecord[];
}

/**
 * Fetch candidate technologies for a legacy session.
 */
export async function getCandidates(
  sessionId: string,
): Promise<Record<string, unknown>[]> {
  const env = readSupabasePublicEnv();
  if (!env.configured) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("session_id", sessionId)
    .order("overall_score", { ascending: false });

  if (error) {
    console.warn("[Supabase] getCandidates error:", error);
    return [];
  }

  return (data as Record<string, unknown>[]) || [];
}

/**
 * Fetch sources for a legacy session.
 */
export async function getSources(
  sessionId: string,
): Promise<Record<string, unknown>[]> {
  const env = readSupabasePublicEnv();
  if (!env.configured) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("session_id", sessionId)
    .order("credibility_score", { ascending: false });

  if (error) {
    console.warn("[Supabase] getSources error:", error);
    return [];
  }

  return (data as Record<string, unknown>[]) || [];
}
