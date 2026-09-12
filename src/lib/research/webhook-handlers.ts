import "server-only";

import {
  extractPageFromWebhookData,
  parseFirecrawlWebhookPayload,
} from "@/lib/firecrawl/webhook";
import {
  buildDeliveryKey,
  hashPayload,
  verifyFirecrawlSignature,
} from "@/lib/firecrawl/verify-signature";
import {
  appendResearchEvent,
  claimWebhookDelivery,
  findSourceByCanonicalUrl,
  markWebhookProcessed,
  refreshRunCounters,
  updateScrapeJobByFirecrawlId,
  updateSource,
  upsertDiscoveredSources,
} from "./repository";
import { canonicalizeUrl } from "./url";
import { analyseSource } from "./analyse-source";
import { finalizeRun, maybeStartCounterCheck } from "./counter-check";

export type WebhookHandleResult = {
  status: "ok" | "duplicate" | "unauthorized" | "ignored";
  scheduleAnalysisSourceIds: string[];
  researchRunId?: string;
};

export function verifyAndParseWebhook(input: {
  rawBody: string;
  signatureHeader: string | null;
}): { ok: true; payload: ReturnType<typeof parseFirecrawlWebhookPayload> } | { ok: false; reason: "unauthorized" | "invalid" } {
  const secret = process.env.FIRECRAWL_WEBHOOK_SECRET?.trim();
  const valid = verifyFirecrawlSignature(input.rawBody, input.signatureHeader, secret);
  if (!valid) {
    return { ok: false, reason: "unauthorized" };
  }

  try {
    return { ok: true, payload: parseFirecrawlWebhookPayload(input.rawBody) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function handleFirecrawlWebhook(input: {
  rawBody: string;
  signatureHeader: string | null;
}): Promise<WebhookHandleResult> {
  const verified = verifyAndParseWebhook(input);
  if (!verified.ok) {
    return {
      status: verified.reason === "unauthorized" ? "unauthorized" : "ignored",
      scheduleAnalysisSourceIds: [],
    };
  }

  const payload = verified.payload;
  const metadata = payload.metadata ?? {};
  const researchRunId =
    typeof metadata.researchRunId === "string" ? metadata.researchRunId : null;
  const page = extractPageFromWebhookData(payload.data);
  const payloadHash = hashPayload(input.rawBody);
  const deliveryKey = buildDeliveryKey({
    jobId: payload.id,
    eventType: payload.type,
    scrapeId: page.scrapeId,
    url: page.url ? canonicalizeUrl(page.url) : null,
    payloadHash,
  });

  const claim = await claimWebhookDelivery({
    deliveryKey,
    researchRunId,
    eventType: payload.type,
    firecrawlJobId: payload.id,
    payloadHash,
  });

  if (claim === "duplicate") {
    return { status: "duplicate", scheduleAnalysisSourceIds: [], researchRunId: researchRunId ?? undefined };
  }

  const scheduleAnalysisSourceIds: string[] = [];

  try {
    switch (payload.type) {
      case "batch_scrape.started":
        await handleBatchStarted(payload.id, researchRunId);
        break;
      case "batch_scrape.page":
        {
          const sourceId = await handleBatchPage({
            jobId: payload.id,
            researchRunId,
            page,
            error: payload.error,
          });
          if (sourceId) {
            scheduleAnalysisSourceIds.push(sourceId);
          }
        }
        break;
      case "batch_scrape.completed":
        await handleBatchCompleted(payload.id, researchRunId);
        break;
      case "batch_scrape.failed":
        await handleBatchFailed(payload.id, researchRunId, payload.error);
        break;
      default:
        break;
    }

    await markWebhookProcessed(deliveryKey);
    return {
      status: "ok",
      scheduleAnalysisSourceIds,
      researchRunId: researchRunId ?? undefined,
    };
  } catch (error) {
    console.error("[webhook] handler error", error);
    throw error;
  }
}

async function handleBatchStarted(
  jobId: string,
  researchRunId: string | null,
): Promise<void> {
  const job = await updateScrapeJobByFirecrawlId(jobId, { status: "started" });
  const runId = researchRunId ?? job?.research_run_id;
  if (!runId) {
    return;
  }
  await appendResearchEvent({
    researchRunId: runId,
    eventType: "batch_scrape_started",
    message: "Batch scrape started.",
    payload: { jobId },
  });
}

async function handleBatchPage(input: {
  jobId: string;
  researchRunId: string | null;
  page: ReturnType<typeof extractPageFromWebhookData>;
  error?: string | null;
}): Promise<string | null> {
  const job = await updateScrapeJobByFirecrawlId(input.jobId, {});
  const runId = input.researchRunId ?? job?.research_run_id;
  if (!runId || !input.page.url) {
    return null;
  }

  const canonicalUrl = canonicalizeUrl(input.page.url);
  let source = await findSourceByCanonicalUrl(runId, canonicalUrl);

  if (!source) {
    const created = await upsertDiscoveredSources(runId, [
      {
        url: input.page.url,
        canonicalUrl,
        title: input.page.title,
        description: null,
        searchDimension: null,
        searchQuery: null,
      },
    ]);
    source = created[0] ?? null;
  }

  if (!source) {
    return null;
  }

  if (input.page.error || input.error) {
    await updateSource(source.id, {
      status: "failed",
      analysis_status: "skipped",
      scrape_id: input.page.scrapeId ?? source.scrapeId,
      error_message: input.page.error || input.error,
      metadata: input.page.metadata ?? {},
    });
    await appendResearchEvent({
      researchRunId: runId,
      eventType: "source_failed",
      message: `Source failed: ${input.page.title || input.page.url}`,
      payload: { sourceId: source.id },
    });
    await refreshRunCounters(runId);
    return null;
  }

  // Guarded transition: do not inflate counters on duplicate delivery (already claimed).
  const alreadyScraped =
    source.status === "scraped" ||
    source.status === "analysing" ||
    source.status === "analysed";

  const updated = await updateSource(source.id, {
    status: alreadyScraped && source.markdown ? source.status : "scraped",
    title: input.page.title ?? source.title,
    markdown: input.page.markdown ?? source.markdown,
    scrape_id: input.page.scrapeId ?? source.scrapeId,
    metadata: input.page.metadata ?? source.metadata ?? {},
    scraped_at: source.scrapedAt ?? new Date().toISOString(),
    analysis_status:
      source.analysisStatus === "completed" || source.analysisStatus === "running"
        ? source.analysisStatus
        : "queued",
  });

  if (!alreadyScraped) {
    await appendResearchEvent({
      researchRunId: runId,
      eventType: "source_scraped",
      message: `Scraped ${updated.title || updated.url}`,
      payload: { sourceId: updated.id },
    });
  }

  await refreshRunCounters(runId);

  if (updated.analysisStatus === "queued" && updated.markdown) {
    return updated.id;
  }
  return null;
}

async function handleBatchCompleted(
  jobId: string,
  researchRunId: string | null,
): Promise<void> {
  const job = await updateScrapeJobByFirecrawlId(jobId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
  const runId = researchRunId ?? job?.research_run_id;
  if (!runId) {
    return;
  }

  await appendResearchEvent({
    researchRunId: runId,
    eventType: "batch_scrape_completed",
    message: "Batch scrape completed.",
    payload: { jobId, phase: job?.phase },
  });

  const { getResearchRun, updateResearchRun } = await import("./repository");
  const run = await getResearchRun(runId);
  if (run && (run.status === "scraping" || run.status === "searching")) {
    await updateResearchRun(runId, {
      status: "analysing",
      phase: "analysing",
    });
  }

  await refreshRunCounters(runId);

  if (job?.phase === "counter_check") {
    await maybeStartCounterCheck(runId);
    await finalizeIfReady(runId);
  } else {
    await maybeStartCounterCheck(runId);
  }
}

async function handleBatchFailed(
  jobId: string,
  researchRunId: string | null,
  error?: string | null,
): Promise<void> {
  const job = await updateScrapeJobByFirecrawlId(jobId, {
    status: "failed",
    error_message: error ?? "Batch scrape failed",
    completed_at: new Date().toISOString(),
  });
  const runId = researchRunId ?? job?.research_run_id;
  if (!runId) {
    return;
  }

  await appendResearchEvent({
    researchRunId: runId,
    eventType: "batch_scrape_failed",
    message: "Batch scrape reported failure. Continuing with partial results.",
    payload: { jobId, error },
  });

  // Partial failure is normal — do not fail the whole run.
  await refreshRunCounters(runId);
  await maybeStartCounterCheck(runId);
  await finalizeIfReady(runId);
}

async function finalizeIfReady(researchRunId: string): Promise<void> {
  const { listSources, getResearchRun } = await import("./repository");
  const run = await getResearchRun(researchRunId);
  if (!run) return;
  if (run.status === "completed" || run.status === "failed") return;

  const sources = await listSources(researchRunId);
  const unfinished = sources.some(
    (s) =>
      s.analysisStatus === "pending" ||
      s.analysisStatus === "queued" ||
      s.analysisStatus === "running" ||
      s.status === "discovered" ||
      s.status === "scraping",
  );
  if (unfinished) {
    return;
  }

  if (run.status === "counter_checking" || run.status === "analysing") {
    await finalizeRun(researchRunId);
  }
}

/** Exported for tests: analysis scheduling happens outside the webhook handler await path. */
export async function runScheduledAnalyses(sourceIds: string[]): Promise<void> {
  for (const sourceId of sourceIds) {
    await analyseSource(sourceId);
  }
}
