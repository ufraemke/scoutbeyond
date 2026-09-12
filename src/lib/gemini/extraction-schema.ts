import { z } from "zod";
import { ClassificationInputSchema } from "@/lib/research/schemas";

export const SourceExtractionSchema = z.object({
  inScope: z.boolean(),
  outOfScopeReason: z.string().optional(),
  candidates: z
    .array(
      z.object({
        name: z.string().min(2),
        principle: z.string().min(8),
        summary: z.string().default(""),
        relevance: z.string().default(""),
        industries: z.array(z.string()).default([]),
        physicalMechanisms: z.array(z.string()).default([]),
        benefits: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
        uncertainties: z.array(z.string()).default([]),
        maturityLabel: z.string().optional(),
        findings: z
          .array(
            z.object({
              finding: z.string().min(8),
              relevance: z.string().default(""),
              stance: z
                .enum(["supports", "contradicts", "neutral"])
                .default("supports"),
              exactExcerpt: z.string().optional(),
            }),
          )
          .default([]),
        classificationFacts: ClassificationInputSchema,
        applicabilityFacts: z.object({
          physicalPrincipleRelevant: z.boolean(),
          samePurpose: z.enum(["yes", "partial", "no"]),
          comparableConditions: z.enum(["yes", "partial", "no"]),
          transferRequired: z.enum(["low", "medium", "high"]),
          unresolvedKeyConditions: z.boolean(),
        }),
        evidenceFacts: z.object({
          evidenceCount: z.number().int().min(0),
          independentSourceCount: z.number().int().min(0),
          hasStrongTechnicalSource: z.boolean(),
          directEvidence: z.boolean(),
          contradictoryEvidence: z.boolean(),
        }),
      }),
    )
    .default([]),
});

export type SourceExtraction = z.infer<typeof SourceExtractionSchema>;
