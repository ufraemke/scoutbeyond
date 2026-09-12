import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  buildDeliveryKey,
  hashPayload,
  verifyFirecrawlSignature,
} from "@/lib/firecrawl/verify-signature";
import { extractPageFromWebhookData, parseFirecrawlWebhookPayload } from "@/lib/firecrawl/webhook";
import {
  buildFallbackQueries,
  buildProgressMessage,
  canTransition,
  principlesAreSame,
  rejectsFakeProgressSequence,
  structureProblemFromChallenge,
  validateQueryDiversity,
} from "@/lib/research";
import { ClassificationInputSchema } from "@/lib/research/schemas";
import { SourceExtractionSchema } from "@/lib/gemini/extraction-schema";
import { analysisIsAsyncContract } from "@/lib/research/progress";

describe("verifyFirecrawlSignature", () => {
  it("accepts a valid sha256 HMAC signature over the raw body", () => {
    const secret = "test-webhook-secret";
    const rawBody = JSON.stringify({
      type: "batch_scrape.page",
      id: "job-1",
      data: [{ url: "https://example.com", markdown: "# hi" }],
      metadata: { researchRunId: "run-1" },
    });
    const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(verifyFirecrawlSignature(rawBody, `sha256=${hex}`, secret)).toBe(true);
  });

  it("rejects missing or invalid signatures", () => {
    const rawBody = '{"type":"batch_scrape.started","id":"job-1"}';
    expect(verifyFirecrawlSignature(rawBody, null, "secret")).toBe(false);
    expect(verifyFirecrawlSignature(rawBody, "sha256=deadbeef", "secret")).toBe(false);
  });
});

describe("webhook fixtures", () => {
  it("parses a realistic batch_scrape.page payload", () => {
    const raw = JSON.stringify({
      success: true,
      type: "batch_scrape.page",
      id: "fc-job-abc",
      metadata: {
        researchRunId: "11111111-1111-1111-1111-111111111111",
        phase: "initial_research",
      },
      data: [
        {
          scrapeId: "scrape-9",
          url: "https://example.com/cleaning",
          markdown: "## Ultrasonic cleaning\nUses cavitation.",
          metadata: { title: "Ultrasonic cleaning" },
        },
      ],
    });

    const payload = parseFirecrawlWebhookPayload(raw);
    expect(payload.type).toBe("batch_scrape.page");
    expect(payload.id).toBe("fc-job-abc");
    const page = extractPageFromWebhookData(payload.data);
    expect(page.url).toBe("https://example.com/cleaning");
    expect(page.scrapeId).toBe("scrape-9");
    expect(page.markdown).toContain("cavitation");
  });

  it("builds stable delivery keys so duplicate page events collapse", () => {
    const hash = hashPayload("body");
    const a = buildDeliveryKey({
      jobId: "job-1",
      eventType: "batch_scrape.page",
      scrapeId: "scrape-1",
      payloadHash: hash,
    });
    const b = buildDeliveryKey({
      jobId: "job-1",
      eventType: "batch_scrape.page",
      scrapeId: "scrape-1",
      payloadHash: "different",
    });
    expect(a).toBe(b);
  });
});

describe("state transitions and counters", () => {
  it("allows legal transitions and rejects illegal ones", () => {
    expect(canTransition("queued", "searching")).toBe(true);
    expect(canTransition("searching", "scraping")).toBe(true);
    expect(canTransition("completed", "searching")).toBe(false);
  });

  it("builds progress from persisted counters without inventing percentages", () => {
    const message = buildProgressMessage({
      status: "scraping",
      sourcesFound: 24,
      sourcesScraped: 11,
      sourcesAnalysed: 7,
      candidatesCount: 3,
    });
    expect(message).toContain("11 / 24");
    expect(message.toLowerCase()).not.toMatch(/%/);
  });

  it("rejects timer-based fake progress sequences", () => {
    expect(
      rejectsFakeProgressSequence([
        "Searching the web · 4 / 12 sources reviewed · 1 candidates",
      ]),
    ).toBe(true);
    expect(
      rejectsFakeProgressSequence([
        "Research 67% complete",
        "Exploring adjacent industries...",
      ]),
    ).toBe(false);
  });
});

describe("search strategy diversity", () => {
  it("accepts a diversified query mix and rejects undifferentiated lists", () => {
    const problem = structureProblemFromChallenge(
      "Reduce water use in industrial tank interior cleaning",
    );
    const queries = buildFallbackQueries(problem);
    const result = validateQueryDiversity(queries);
    expect(result.ok).toBe(true);

    const undifferentiated = queries.map((q) => ({
      ...q,
      dimension: "direct" as const,
    }));
    expect(validateQueryDiversity(undifferentiated).ok).toBe(false);
  });
});

describe("candidate merging helpers", () => {
  it("treats equivalent physical principles as the same candidate key", () => {
    expect(
      principlesAreSame(
        "Ultrasonic cavitation cleaning",
        "ultrasonic cavitation cleaning!",
      ),
    ).toBe(true);
    expect(
      principlesAreSame("Ultrasonic cavitation", "Plasma surface treatment"),
    ).toBe(false);
  });
});

describe("zod rejection", () => {
  it("rejects ambiguous classification facts", () => {
    const result = ClassificationInputSchema.safeParse({
      physicalPrincipleRelevant: true,
      samePurpose: "partial",
      comparableConditions: "partial",
      industrialUse: "probably",
      independentApplications: 3,
      transferRequired: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source extraction payloads", () => {
    const result = SourceExtractionSchema.safeParse({
      inScope: true,
      candidates: [
        {
          name: "X",
          principle: "too",
          classificationFacts: {
            physicalPrincipleRelevant: true,
            samePurpose: "maybe",
            comparableConditions: "yes",
            industrialUse: true,
            independentApplications: 1,
            transferRequired: "medium",
          },
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("webhook analysis contract", () => {
  it("exposes async analysis so the webhook route can schedule without awaiting Gemini", () => {
    expect(analysisIsAsyncContract()).toBe(true);
  });
});
