import "server-only";

import type {
  DiversifiedSearchQuery,
  LiveCandidateRecord,
  LiveEvidenceRecord,
  ResearchEventRecord,
  ResearchRunRecord,
  ResearchRunSnapshot,
  ResearchRunStatus,
  ResearchSourceRecord,
  SourceAnalysisStatus,
  StructuredProblem,
} from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";

type DbRun = {
  id: string;
  owner_id: string;
  challenge: string;
  structured_problem: StructuredProblem;
  status: ResearchRunStatus;
  phase: string;
  error_message: string | null;
  sources_found: number;
  sources_scraped: number;
  sources_analysed: number;
  sources_failed: number;
  candidates_count: number;
  search_queries: DiversifiedSearchQuery[];
  warnings: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type DbSource = {
  id: string;
  research_run_id: string;
  url: string;
  canonical_url: string;
  title: string | null;
  description: string | null;
  search_dimension: string | null;
  search_query: string | null;
  status: ResearchSourceRecord["status"];
  analysis_status: SourceAnalysisStatus;
  scrape_id: string | null;
  markdown: string | null;
  metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  scraped_at: string | null;
  analysed_at: string | null;
};

type DbEvent = {
  id: string;
  research_run_id: string;
  event_type: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type DbCandidate = {
  id: string;
  research_run_id: string;
  name: string;
  principle: string;
  normalized_principle: string;
  category: LiveCandidateRecord["category"];
  summary: string;
  relevance: string;
  classification_evidence: LiveCandidateRecord["classificationEvidence"];
  applicability: LiveCandidateRecord["applicability"];
  confidence: LiveCandidateRecord["confidence"];
  evidence_quality: LiveCandidateRecord["evidenceQuality"];
  benefits: string[];
  limitations: string[];
  uncertainties: LiveCandidateRecord["uncertainties"];
  maturity: LiveCandidateRecord["maturity"];
  industries: string[];
  physical_mechanisms: string[];
  verification_state: LiveCandidateRecord["verificationState"];
  created_at: string;
  updated_at: string;
};

type DbEvidence = {
  id: string;
  research_run_id: string;
  candidate_id: string;
  source_id: string;
  finding: string;
  relevance: string;
  stance: LiveEvidenceRecord["stance"];
  confidence: LiveEvidenceRecord["confidence"];
  exact_excerpt: string | null;
  created_at: string;
};

export function mapRun(row: DbRun): ResearchRunRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    challenge: row.challenge,
    structuredProblem: row.structured_problem,
    status: row.status,
    phase: row.phase,
    errorMessage: row.error_message,
    sourcesFound: row.sources_found,
    sourcesScraped: row.sources_scraped,
    sourcesAnalysed: row.sources_analysed,
    sourcesFailed: row.sources_failed,
    candidatesCount: row.candidates_count,
    searchQueries: row.search_queries ?? [],
    warnings: row.warnings ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function mapSource(row: DbSource): ResearchSourceRecord {
  return {
    id: row.id,
    researchRunId: row.research_run_id,
    url: row.url,
    canonicalUrl: row.canonical_url,
    title: row.title,
    description: row.description,
    searchDimension: row.search_dimension,
    searchQuery: row.search_query,
    status: row.status,
    analysisStatus: row.analysis_status,
    scrapeId: row.scrape_id,
    markdown: row.markdown,
    metadata: row.metadata ?? {},
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scrapedAt: row.scraped_at,
    analysedAt: row.analysed_at,
  };
}

export function mapEvent(row: DbEvent): ResearchEventRecord {
  return {
    id: row.id,
    researchRunId: row.research_run_id,
    eventType: row.event_type,
    message: row.message,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

export function mapCandidate(row: DbCandidate): LiveCandidateRecord {
  return {
    id: row.id,
    researchRunId: row.research_run_id,
    name: row.name,
    principle: row.principle,
    normalizedPrinciple: row.normalized_principle,
    category: row.category,
    summary: row.summary,
    relevance: row.relevance,
    classificationEvidence: row.classification_evidence,
    applicability: row.applicability,
    confidence: row.confidence,
    evidenceQuality: row.evidence_quality,
    benefits: row.benefits ?? [],
    limitations: row.limitations ?? [],
    uncertainties: row.uncertainties ?? [],
    maturity: row.maturity,
    industries: row.industries ?? [],
    physicalMechanisms: row.physical_mechanisms ?? [],
    verificationState: row.verification_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEvidence(row: DbEvidence): LiveEvidenceRecord {
  return {
    id: row.id,
    researchRunId: row.research_run_id,
    candidateId: row.candidate_id,
    sourceId: row.source_id,
    finding: row.finding,
    relevance: row.relevance,
    stance: row.stance,
    confidence: row.confidence,
    exactExcerpt: row.exact_excerpt,
    createdAt: row.created_at,
  };
}

export async function createResearchRun(input: {
  ownerId: string;
  challenge: string;
  structuredProblem: StructuredProblem;
}): Promise<ResearchRunRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_runs")
    .insert({
      owner_id: input.ownerId,
      challenge: input.challenge,
      structured_problem: input.structuredProblem,
      status: "queued",
      phase: "queued",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create research run.");
  }

  return mapRun(data as DbRun);
}

export async function getResearchRun(runId: string): Promise<ResearchRunRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? mapRun(data as DbRun) : null;
}

export async function updateResearchRun(
  runId: string,
  patch: Record<string, unknown>,
): Promise<ResearchRunRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_runs")
    .update(patch)
    .eq("id", runId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update research run.");
  }
  return mapRun(data as DbRun);
}

export async function appendResearchEvent(input: {
  researchRunId: string;
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("research_events").insert({
    research_run_id: input.researchRunId,
    event_type: input.eventType,
    message: input.message,
    payload: input.payload ?? {},
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertDiscoveredSources(
  researchRunId: string,
  sources: Array<{
    url: string;
    canonicalUrl: string;
    title?: string | null;
    description?: string | null;
    searchDimension?: string | null;
    searchQuery?: string | null;
  }>,
): Promise<ResearchSourceRecord[]> {
  if (sources.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const rows = sources.map((s) => ({
    research_run_id: researchRunId,
    url: s.url,
    canonical_url: s.canonicalUrl,
    title: s.title ?? null,
    description: s.description ?? null,
    search_dimension: s.searchDimension ?? null,
    search_query: s.searchQuery ?? null,
    status: "discovered",
    analysis_status: "pending",
  }));

  const { data, error } = await supabase
    .from("research_sources")
    .upsert(rows, { onConflict: "research_run_id,canonical_url" })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbSource[]).map(mapSource);
}

export async function listSources(researchRunId: string): Promise<ResearchSourceRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_sources")
    .select("*")
    .eq("research_run_id", researchRunId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data as DbSource[]).map(mapSource);
}

export async function getSource(sourceId: string): Promise<ResearchSourceRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_sources")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapSource(data as DbSource) : null;
}

export async function updateSource(
  sourceId: string,
  patch: Record<string, unknown>,
): Promise<ResearchSourceRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_sources")
    .update(patch)
    .eq("id", sourceId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message || "Failed to update source.");
  }
  return mapSource(data as DbSource);
}

export async function findSourceByCanonicalUrl(
  researchRunId: string,
  canonicalUrl: string,
): Promise<ResearchSourceRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_sources")
    .select("*")
    .eq("research_run_id", researchRunId)
    .eq("canonical_url", canonicalUrl)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapSource(data as DbSource) : null;
}

export async function createScrapeJob(input: {
  researchRunId: string;
  firecrawlJobId: string;
  phase: "initial_research" | "counter_check";
  candidateId?: string | null;
  urls: string[];
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("scrape_jobs").insert({
    research_run_id: input.researchRunId,
    firecrawl_job_id: input.firecrawlJobId,
    phase: input.phase,
    candidate_id: input.candidateId ?? null,
    status: "queued",
    urls: input.urls,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateScrapeJobByFirecrawlId(
  firecrawlJobId: string,
  patch: Record<string, unknown>,
): Promise<{ research_run_id: string; phase: string; candidate_id: string | null } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scrape_jobs")
    .update(patch)
    .eq("firecrawl_job_id", firecrawlJobId)
    .select("research_run_id, phase, candidate_id")
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function claimWebhookDelivery(input: {
  deliveryKey: string;
  researchRunId?: string | null;
  eventType: string;
  firecrawlJobId?: string | null;
  payloadHash: string;
}): Promise<"claimed" | "duplicate"> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("webhook_deliveries").insert({
    delivery_key: input.deliveryKey,
    research_run_id: input.researchRunId ?? null,
    event_type: input.eventType,
    firecrawl_job_id: input.firecrawlJobId ?? null,
    payload_hash: input.payloadHash,
  });

  if (error) {
    if (error.code === "23505") {
      return "duplicate";
    }
    throw new Error(error.message);
  }
  return "claimed";
}

export async function markWebhookProcessed(deliveryKey: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("webhook_deliveries")
    .update({ processed_at: new Date().toISOString() })
    .eq("delivery_key", deliveryKey);
}

export async function refreshRunCounters(researchRunId: string): Promise<ResearchRunRecord> {
  const sources = await listSources(researchRunId);
  const scraped = sources.filter((s) =>
    ["scraped", "analysing", "analysed"].includes(s.status),
  ).length;
  const analysed = sources.filter((s) => s.status === "analysed").length;
  const failed = sources.filter((s) => s.status === "failed").length;

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("live_candidates")
    .select("id", { count: "exact", head: true })
    .eq("research_run_id", researchRunId);

  return updateResearchRun(researchRunId, {
    sources_found: sources.length,
    sources_scraped: scraped,
    sources_analysed: analysed,
    sources_failed: failed,
    candidates_count: count ?? 0,
  });
}

export async function getRunSnapshot(researchRunId: string): Promise<ResearchRunSnapshot | null> {
  const run = await getResearchRun(researchRunId);
  if (!run) {
    return null;
  }

  const supabase = createAdminClient();
  const [sources, events, candidates, evidence] = await Promise.all([
    listSources(researchRunId),
    supabase
      .from("research_events")
      .select("*")
      .eq("research_run_id", researchRunId)
      .order("created_at", { ascending: true }),
    supabase
      .from("live_candidates")
      .select("*")
      .eq("research_run_id", researchRunId)
      .order("created_at", { ascending: true }),
    supabase
      .from("live_evidence")
      .select("*")
      .eq("research_run_id", researchRunId)
      .order("created_at", { ascending: true }),
  ]);

  if (events.error) throw new Error(events.error.message);
  if (candidates.error) throw new Error(candidates.error.message);
  if (evidence.error) throw new Error(evidence.error.message);

  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const mappedEvidence = (evidence.data as DbEvidence[]).map((row) => {
    const mapped = mapEvidence(row);
    const source = sourceMap.get(row.source_id);
    if (source) {
      mapped.source = {
        id: source.id,
        url: source.url,
        canonicalUrl: source.canonicalUrl,
        title: source.title,
      };
    }
    return mapped;
  });

  return {
    run,
    sources,
    events: (events.data as DbEvent[]).map(mapEvent),
    candidates: (candidates.data as DbCandidate[]).map(mapCandidate),
    evidence: mappedEvidence,
  };
}

export async function listStaleAnalysisSources(
  researchRunId: string,
  olderThanMs = 60_000,
): Promise<ResearchSourceRecord[]> {
  const sources = await listSources(researchRunId);
  const cutoff = Date.now() - olderThanMs;
  return sources.filter((s) => {
    if (!["queued", "running", "pending"].includes(s.analysisStatus)) {
      return false;
    }
    if (!s.markdown) {
      return false;
    }
    return new Date(s.updatedAt).getTime() < cutoff || s.analysisStatus === "queued";
  });
}

export { type DbCandidate, type DbEvidence };
