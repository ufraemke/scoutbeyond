import "server-only";

import { searchWeb, startBatchScrape } from "@/lib/firecrawl/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  appendResearchEvent,
  createScrapeJob,
  getResearchRun,
  listSourceProgress,
  refreshRunCounters,
  updateResearchRun,
  upsertDiscoveredSources,
} from "./repository";
import { canonicalizeUrl } from "./url";
import { assertTransition, isSourceAnalysisTerminal } from "./progress";
import { generateJson } from "@/lib/gemini/client";
import { z } from "zod";

const CounterQuerySchema = z.object({
  queries: z.array(z.string().min(5)).min(1).max(4),
});

export async function maybeStartCounterCheck(researchRunId: string): Promise<void> {
  const run = await getResearchRun(researchRunId);
  if (!run) {
    return;
  }

  const sources = await listSourceProgress(researchRunId);
  const pending = sources.filter(
    (source) => !isSourceAnalysisTerminal(source),
  );

  // Wait until every source is analysed or failed before counter-check.
  if (pending.length > 0) {
    return;
  }

  if (run.status === "synthesising" || run.status === "completed") {
    return;
  }

  const supabase = createAdminClient();
  const { data: candidates, error } = await supabase
    .from("live_candidates")
    .select("*")
    .eq("research_run_id", researchRunId)
    .eq("verification_state", "provisional")
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  if (!candidates || candidates.length === 0) {
    await finalizeRun(researchRunId);
    return;
  }

  if (run.status !== "counter_checking") {
    assertTransition(
      run.status === "analysing" || run.status === "scraping"
        ? "analysing"
        : run.status,
      "counter_checking",
    );

    if (run.status === "scraping") {
      await updateResearchRun(researchRunId, {
        status: "analysing",
        phase: "analysing",
      });
    }

    await updateResearchRun(researchRunId, {
      status: "counter_checking",
      phase: "counter_checking",
    });

    await appendResearchEvent({
      researchRunId,
      eventType: "counter_check_started",
      message: `Counter-checking ${candidates.length} provisional candidates.`,
    });
  }

  const { data: existingJobs, error: jobsError } = await supabase
    .from("scrape_jobs")
    .select("candidate_id,status")
    .eq("research_run_id", researchRunId)
    .eq("phase", "counter_check");
  if (jobsError) {
    throw new Error(jobsError.message);
  }
  const candidatesWithJobs = new Set(
    (existingJobs ?? [])
      .map((job) => job.candidate_id)
      .filter((candidateId): candidateId is string => Boolean(candidateId)),
  );
  const candidatesToStart = candidates.filter(
    (candidate) => !candidatesWithJobs.has(candidate.id),
  );

  const results = await Promise.all(
    candidatesToStart.map(async (candidate) => {
    const queries = await buildCounterQueries(candidate.name, candidate.principle);
    const searches = await Promise.allSettled(
      queries.map((query) => searchWeb(query, 3)),
    );
    const urls = searches.flatMap((result) => {
      if (result.status === "fulfilled") {
        return result.value.map((item) => item.url);
      }
      console.error("[counter-check] search failed", result.reason);
      return [];
    });

    const unique = [...new Map(urls.map((u) => [canonicalizeUrl(u), u])).entries()].map(
      ([canonicalUrl, url]) => ({
        url,
        canonicalUrl,
        title: null,
        description: null,
        searchDimension: "emerging",
        searchQuery: `counter-check:${candidate.name}`,
      }),
    );

    if (unique.length === 0) {
      await supabase
        .from("live_candidates")
        .update({ verification_state: "verified" })
        .eq("id", candidate.id);
      return false;
    }

    await upsertDiscoveredSources(researchRunId, unique);
    const jobId = await startBatchScrape({
      urls: unique.map((u) => u.url),
      metadata: {
        researchRunId,
        phase: "counter_check",
        candidateId: candidate.id,
      },
    });

    await createScrapeJob({
      researchRunId,
      firecrawlJobId: jobId,
      phase: "counter_check",
      candidateId: candidate.id,
      urls: unique.map((u) => u.url),
    });
    return true;
    }),
  );

  await refreshRunCounters(researchRunId);

  const allExistingJobsFinished =
    (existingJobs?.length ?? 0) > 0 &&
    (existingJobs ?? []).every((job) =>
      ["completed", "failed"].includes(job.status),
    );

  if (candidatesToStart.length === 0 && allExistingJobsFinished) {
    await finalizeRun(researchRunId);
    return;
  }

  if (
    candidatesToStart.length > 0 &&
    results.every((jobCreated) => !jobCreated) &&
    candidatesWithJobs.size === 0
  ) {
    await finalizeRun(researchRunId);
  }
}

export async function finalizeRun(researchRunId: string): Promise<void> {
  const run = await getResearchRun(researchRunId);
  if (!run) {
    return;
  }
  if (run.status === "completed" || run.status === "failed") {
    return;
  }

  assertTransition(
    run.status === "counter_checking" || run.status === "analysing" || run.status === "synthesising"
      ? run.status
      : "synthesising",
    "synthesising",
  );

  await updateResearchRun(researchRunId, {
    status: "synthesising",
    phase: "synthesising",
  });

  const supabase = createAdminClient();
  await supabase
    .from("live_candidates")
    .update({ verification_state: "verified" })
    .eq("research_run_id", researchRunId)
    .eq("verification_state", "provisional");

  await updateResearchRun(researchRunId, {
    status: "completed",
    phase: "completed",
    completed_at: new Date().toISOString(),
  });

  await appendResearchEvent({
    researchRunId,
    eventType: "run_completed",
    message: "Research complete.",
  });

  await refreshRunCounters(researchRunId);
}

async function buildCounterQueries(name: string, principle: string): Promise<string[]> {
  try {
    const raw = await generateJson(
      `Generate 2-3 search queries to find limitations, scale-up issues, failure modes, or contradictory evidence for this technology.
Name: ${name}
Principle: ${principle}
Return JSON: {"queries":["..."]}`,
    );
    return CounterQuerySchema.parse(raw).queries;
  } catch {
    return [
      `${name} limitations scale-up problems`,
      `${name} failure modes industrial application`,
      `${principle} contradictory evidence limitations`,
    ];
  }
}
