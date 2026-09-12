import {
  FirecrawlWebhookPayloadSchema,
  type FirecrawlWebhookPayload,
} from "./types";

export function parseFirecrawlWebhookPayload(
  rawBody: string,
): FirecrawlWebhookPayload {
  const json = JSON.parse(rawBody) as unknown;
  return FirecrawlWebhookPayloadSchema.parse(json);
}

export function extractPageFromWebhookData(data: unknown): {
  url?: string;
  title?: string;
  markdown?: string;
  scrapeId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
} {
  if (!data) {
    return {};
  }

  const first = Array.isArray(data) ? data[0] : data;
  if (!first || typeof first !== "object") {
    return {};
  }

  const record = first as Record<string, unknown>;
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined;

  const url =
    (typeof record.url === "string" && record.url) ||
    (typeof metadata?.sourceURL === "string" && metadata.sourceURL) ||
    (typeof metadata?.url === "string" && metadata.url) ||
    undefined;

  const title =
    (typeof record.title === "string" && record.title) ||
    (typeof metadata?.title === "string" && metadata.title) ||
    undefined;

  const markdown =
    typeof record.markdown === "string" ? record.markdown : undefined;

  const scrapeId =
    (typeof record.scrapeId === "string" && record.scrapeId) ||
    (typeof record.id === "string" && record.id) ||
    (typeof metadata?.scrapeId === "string" && metadata.scrapeId) ||
    undefined;

  const error = typeof record.error === "string" ? record.error : undefined;

  return { url, title, markdown, scrapeId, metadata, error };
}
