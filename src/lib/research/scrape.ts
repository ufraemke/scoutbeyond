import "server-only";

import { startBatchScrape } from "@/lib/firecrawl/client";
import {
  appendResearchEvent,
  createScrapeJob,
  listSources,
  updateResearchRun,
} from "./repository";
import { assertTransition } from "./progress";
import type { ResearchRunRecord } from "@/types";

export type InitialBatchScrapeResult = {
  jobId: string;
  run: ResearchRunRecord;
};

export async function startInitialBatchScrape(
  run: ResearchRunRecord,
): Promise<InitialBatchScrapeResult | null> {
  const sources = await listSources(run.id);
  const urls = sources.map((s) => s.url);
  if (urls.length === 0) {
    return null;
  }

  assertTransition(run.status, "scraping");
  const scrapingRun = await updateResearchRun(run.id, {
    status: "scraping",
    phase: "scraping",
    sources_found: sources.length,
  });

  const jobId = await startBatchScrape({
    urls,
    metadata: {
      researchRunId: run.id,
      phase: "initial_research",
    },
  });

  await createScrapeJob({
    researchRunId: run.id,
    firecrawlJobId: jobId,
    phase: "initial_research",
    urls,
  });

  await appendResearchEvent({
    researchRunId: run.id,
    eventType: "batch_scrape_queued",
    message: `Started batch scrape for ${urls.length} sources.`,
    payload: { jobId, count: urls.length },
  });

  return { jobId, run: scrapingRun };
}
