import { z } from "zod";

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
