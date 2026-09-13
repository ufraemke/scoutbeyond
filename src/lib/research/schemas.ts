import { z } from "zod";

const shortText = z.string().trim().min(1).max(500);

export const StructuredProblemSchema = z.object({
  statement: z.string().trim().min(12).max(4000),
  currentSolution: z.string().trim().max(2000).optional(),
  goals: z.array(shortText).max(12),
  constraints: z
    .array(
      z.object({
        id: shortText,
        description: shortText,
        importance: z.enum(["must", "should"]).optional(),
      }),
    )
    .max(12),
  assumptions: z
    .array(
      z.object({
        id: shortText,
        description: shortText,
        origin: z.enum(["user", "ai"]),
        status: z.enum(["confirmed", "unconfirmed", "rejected"]),
      }),
    )
    .max(12),
  unknowns: z.array(shortText).max(12),
  searchDimensions: z
    .array(
      z.object({
        id: shortText,
        name: shortText,
        description: z.string().trim().max(1000).optional(),
      }),
    )
    .min(1)
    .max(10),
  researchPreferences: z
    .object({
      industryFocus: z.enum(["balanced", "within", "beyond"]),
      evidenceTypes: z
        .array(
          z.enum([
            "scientific_papers",
            "patents",
            "industrial_cases",
            "technical_documentation",
          ]),
        )
        .max(4),
    })
    .optional(),
});

export const ResearchChallengeSchema = z.object({
  challenge: z.string().trim().min(12).max(5000),
});

export const ResearchStartInputSchema = ResearchChallengeSchema.extend({
  structuredProblem: StructuredProblemSchema,
});

export const ClassificationInputSchema = z.object({
  physicalPrincipleRelevant: z.boolean(),
  samePurpose: z.enum(["yes", "partial", "no"]),
  comparableConditions: z.enum(["yes", "partial", "no"]),
  industrialUse: z.boolean(),
  independentApplications: z.number().int().min(0),
  transferRequired: z.enum(["low", "medium", "high"]),
});

export const ConfidenceInputSchema = z.object({
  evidenceCount: z.number().int().min(0),
  independentSourceCount: z.number().int().min(0),
  hasStrongTechnicalSource: z.boolean(),
  directEvidence: z.boolean(),
  contradictoryEvidence: z.boolean(),
});

export const ApplicabilityInputSchema = z.object({
  physicalPrincipleRelevant: z.boolean(),
  samePurpose: z.enum(["yes", "partial", "no"]),
  comparableConditions: z.enum(["yes", "partial", "no"]),
  transferRequired: z.enum(["low", "medium", "high"]),
  unresolvedKeyConditions: z.boolean(),
});

export const EvidenceQualityInputSchema = ConfidenceInputSchema;

export type ClassificationInputParsed = z.infer<
  typeof ClassificationInputSchema
>;
export type ConfidenceInputParsed = z.infer<typeof ConfidenceInputSchema>;
export type ApplicabilityInputParsed = z.infer<typeof ApplicabilityInputSchema>;
export type EvidenceQualityInputParsed = z.infer<
  typeof EvidenceQualityInputSchema
>;
