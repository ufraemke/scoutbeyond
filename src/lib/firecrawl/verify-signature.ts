import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Firecrawl webhook HMAC-SHA256 signature against the raw body.
 * Expected header format: sha256=<hex>
 */
export function verifyFirecrawlSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const provided = signatureHeader.trim();
  const body = typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
  const expectedHex = createHmac("sha256", secret).update(body).digest("hex");
  const expected = `sha256=${expectedHex}`;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

/**
 * Build a stable delivery key for webhook idempotency.
 * Firecrawl job `id` is the batch job id, not a unique page delivery id.
 */
export function buildDeliveryKey(input: {
  jobId: string;
  eventType: string;
  scrapeId?: string | null;
  url?: string | null;
  payloadHash: string;
}): string {
  if (input.scrapeId) {
    return `${input.jobId}:${input.eventType}:scrape:${input.scrapeId}`;
  }
  if (input.url) {
    return `${input.jobId}:${input.eventType}:url:${input.url}`;
  }
  return `${input.jobId}:${input.eventType}:hash:${input.payloadHash}`;
}
