import "server-only";

import {
  FirecrawlBatchScrapeResponseSchema,
  FirecrawlSearchResponseSchema,
  type BatchScrapeWebhookMetadata,
  type FirecrawlSearchWebResult,
} from "./types";

const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v2";

export class FirecrawlApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    const message =
      status === 402
        ? "Firecrawl has insufficient credits for this research run."
        : status === 429
          ? "Firecrawl's request limit has been reached. Please try again later."
          : status === 401
            ? "Firecrawl credentials were not accepted."
            : `The source search service failed with status ${status}.`;
    super(message);
    this.name = "FirecrawlApiError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }
  return key;
}

function getWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required to build the Firecrawl webhook callback.",
    );
  }
  return `${appUrl}/api/firecrawl/webhook`;
}

async function firecrawlFetch(path: string, body: unknown) {
  const response = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Firecrawl returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    console.error(
      `[firecrawl] ${path} failed (${response.status}): ${text.slice(0, 400)}`,
    );
    throw new FirecrawlApiError(response.status);
  }

  return json;
}

function extractWebResults(raw: unknown): FirecrawlSearchWebResult[] {
  const parsed = FirecrawlSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    // Tolerate loose shapes: data as array, or nested web
    if (Array.isArray(raw)) {
      return raw.filter(
        (item): item is FirecrawlSearchWebResult =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { url?: unknown }).url === "string",
      );
    }
    const data = (raw as { data?: unknown } | null)?.data;
    if (Array.isArray(data)) {
      return data.filter(
        (item): item is FirecrawlSearchWebResult =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { url?: unknown }).url === "string",
      );
    }
    if (data && typeof data === "object" && Array.isArray((data as { web?: unknown }).web)) {
      return ((data as { web: FirecrawlSearchWebResult[] }).web);
    }
    throw new Error(`Unexpected Firecrawl search response: ${parsed.error.message}`);
  }

  const data = parsed.data.data;
  if (Array.isArray(data)) {
    return data;
  }
  return [...(data?.web ?? []), ...(data?.news ?? [])];
}

export async function searchWeb(
  query: string,
  limit = 5,
): Promise<FirecrawlSearchWebResult[]> {
  const json = await firecrawlFetch("/search", {
    query,
    limit,
  });
  return extractWebResults(json);
}

export async function startBatchScrape(input: {
  urls: string[];
  metadata: BatchScrapeWebhookMetadata;
}): Promise<string> {
  if (input.urls.length === 0) {
    throw new Error("Cannot start batch scrape with zero URLs.");
  }

  const json = await firecrawlFetch("/batch/scrape", {
    urls: input.urls,
    formats: ["markdown"],
    webhook: {
      url: getWebhookUrl(),
      metadata: input.metadata,
      events: ["started", "page", "completed", "failed"],
    },
  });

  const parsed = FirecrawlBatchScrapeResponseSchema.safeParse(json);
  const jobId =
    parsed.success
      ? parsed.data.id || parsed.data.jobId || parsed.data.data?.id
      : undefined;

  if (!jobId || typeof jobId !== "string") {
    throw new Error(
      `Firecrawl batch scrape did not return a job id: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }

  return jobId;
}
