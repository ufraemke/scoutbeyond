import { z } from "zod";

export const FirecrawlSearchWebResultSchema = z.object({
  url: z.string().url(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  markdown: z.string().optional().nullable(),
});

export const FirecrawlSearchResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      web: z.array(FirecrawlSearchWebResultSchema).optional().default([]),
      news: z.array(FirecrawlSearchWebResultSchema).optional().default([]),
    })
    .or(z.array(FirecrawlSearchWebResultSchema))
    .optional(),
});

export type FirecrawlSearchWebResult = z.infer<
  typeof FirecrawlSearchWebResultSchema
>;

export const FirecrawlBatchScrapeResponseSchema = z.object({
  success: z.boolean().optional(),
  id: z.string().optional(),
  jobId: z.string().optional(),
  data: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
});

export const FirecrawlWebhookPayloadSchema = z.object({
  success: z.boolean().optional(),
  type: z.string(),
  id: z.string(),
  data: z.unknown().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  error: z.string().nullable().optional(),
});

export type FirecrawlWebhookPayload = z.infer<
  typeof FirecrawlWebhookPayloadSchema
>;

export type BatchScrapeWebhookMetadata = {
  researchRunId: string;
  phase: "initial_research" | "counter_check";
  candidateId?: string;
};
