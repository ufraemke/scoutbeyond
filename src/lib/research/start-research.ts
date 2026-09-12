import "server-only";

import { FirecrawlApiError, searchWeb } from "@/lib/firecrawl/client";
import type {
  DiversifiedSearchQuery,
  ResearchRunRecord,
  StructuredProblem,
} from "@/types";
import { generateDiversifiedQueries } from "./query-generation";
import {
  appendResearchEvent,
  createResearchRun,
  updateResearchRun,
  upsertDiscoveredSources,
} from "./repository";
import { startInitialBatchScrape } from "./scrape";
import { canonicalizeUrl } from "./url";
import { assertTransition } from "./progress";

export async function startResearch(input: {
  ownerId: string;
  challenge: string;
  structuredProblem: StructuredProblem;
}): Promise<ResearchRunRecord> {
  const challenge = input.challenge.trim();
  if (challenge.length < 12) {
    throw new Error("Please describe the technical challenge in more detail.");
  }

  const structuredProblem = input.structuredProblem;
  let run = await createResearchRun({
    ownerId: input.ownerId,
    challenge,
    structuredProblem,
  });

  await appendResearchEvent({
    researchRunId: run.id,
    eventType: "run_created",
    message: "Research run created.",
  });

  try {
    assertTransition(run.status, "searching");
    run = await updateResearchRun(run.id, {
      status: "searching",
      phase: "searching",
    });

    const queries = await generateDiversifiedQueries(structuredProblem);
    run = await updateResearchRun(run.id, {
      search_queries: queries,
    });

    await appendResearchEvent({
      researchRunId: run.id,
      eventType: "search_started",
      message: `Running ${queries.length} diversified searches.`,
      payload: { queryCount: queries.length },
    });

    const search = await collectSearchResults(queries);
    const discovered = search.sources;

    await upsertDiscoveredSources(run.id, discovered);
    run = await updateResearchRun(run.id, {
      sources_found: discovered.length,
      warnings:
        search.failedQueries > 0
          ? [
              ...run.warnings,
              `${search.failedQueries} of ${queries.length} search queries failed; research continued with the available results.`,
            ]
          : run.warnings,
    });

    await appendResearchEvent({
      researchRunId: run.id,
      eventType: "sources_found",
      message: `Found ${discovered.length} potentially relevant sources.`,
      payload: { sourcesFound: discovered.length },
    });

    if (discovered.length === 0) {
      run = await updateResearchRun(run.id, {
        status: "completed",
        phase: "completed",
        completed_at: new Date().toISOString(),
        warnings: ["No sources found for the generated queries."],
      });
      await appendResearchEvent({
        researchRunId: run.id,
        eventType: "run_completed_empty",
        message: "Research completed with no sources found.",
      });
      return run;
    }

    const scrape = await startInitialBatchScrape(run);
    if (!scrape) {
      throw new Error("Batch scrape could not be started for discovered sources.");
    }
    return scrape.run;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    run = await updateResearchRun(run.id, {
      status: "failed",
      phase: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    });
    await appendResearchEvent({
      researchRunId: run.id,
      eventType: "run_failed",
      message,
    });
    throw error;
  }
}

async function collectSearchResults(queries: DiversifiedSearchQuery[]) {
  const byCanonical = new Map<
    string,
    {
      url: string;
      canonicalUrl: string;
      title?: string | null;
      description?: string | null;
      searchDimension?: string | null;
      searchQuery?: string | null;
    }
  >();
  const failures: unknown[] = [];
  let successfulQueries = 0;

  for (const query of queries) {
    try {
      const results = await searchWeb(query.query, 4);
      successfulQueries += 1;
      for (const result of results) {
        const canonicalUrl = canonicalizeUrl(result.url);
        if (byCanonical.has(canonicalUrl)) {
          continue;
        }
        byCanonical.set(canonicalUrl, {
          url: result.url,
          canonicalUrl,
          title: result.title,
          description: result.description,
          searchDimension: query.dimension,
          searchQuery: query.query,
        });
      }
    } catch (error) {
      // Continue other dimensions; breadth first.
      console.error("[search] query failed", query.query, error);
      failures.push(error);
    }
  }

  if (successfulQueries === 0 && failures.length > 0) {
    const providerError =
      failures.find(
        (error) => error instanceof FirecrawlApiError && error.status === 402,
      ) ??
      failures.find(
        (error) => error instanceof FirecrawlApiError && error.status === 429,
      ) ??
      failures[0];
    throw providerError instanceof Error
      ? providerError
      : new Error("The source search service did not respond.");
  }

  return {
    sources: [...byCanonical.values()],
    failedQueries: failures.length,
  };
}
