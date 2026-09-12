import { createClient as createBrowserClient } from "./client";
import { readSupabasePublicEnv } from "./env";
import type { Candidate, ResearchResult, StructuredProblem, Source } from "@/types/research";

export interface ProblemRecord {
  id: string;
  raw_input?: string;
  statement?: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a research session from Supabase by ID.
 */
export async function getProblemSession(sessionId: string): Promise<any | null> {
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

  return data.data || data;
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
 * Fetch all candidate technologies for a given session.
 */
export async function getCandidates(sessionId: string): Promise<any[]> {
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

  return data || [];
}

/**
 * Fetch all verified empirical sources for a session.
 */
export async function getSources(sessionId: string): Promise<any[]> {
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

  return data || [];
}
