import "server-only";

import { searchWeb, startBatchScrape } from "@/lib/firecrawl/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  appendResearchEvent,
  createScrapeJob,
  getResearchRun,
  listSources,
  refreshRunCounters,
  updateResearchRun,
  upsertDiscoveredSources,
} from "./repository";
import { canonicalizeUrl } from "./url";
import { assertTransition } from "./progress";
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

  const sources = await listSources(researchRunId);
  const pending = sources.filter(
    (s) =>
      s.analysisStatus === "pending" ||
      s.analysisStatus === "queued" ||
      s.analysisStatus === "running" ||
      s.status === "discovered" ||
      s.status === "scraping" ||
      s.status === "scraped" ||
      s.status === "analysing",
  );

  // Wait until every source is analysed or failed before counter-check.
  if (pending.length > 0) {
    return;
  }

  if (run.status === "counter_checking" || run.status === "synthesising" || run.status === "completed") {
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

  for (const candidate of candidates) {
    const queries = await buildCounterQueries(candidate.name, candidate.principle);
    const urls: string[] = [];
    for (const query of queries) {
      try {
        const results = await searchWeb(query, 3);
        for (const result of results) {
          urls.push(result.url);
        }
      } catch (error) {
        console.error("[counter-check] search failed", error);
      }
    }

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
      continue;
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
  }

  await refreshRunCounters(researchRunId);
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
