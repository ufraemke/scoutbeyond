import type { ConfidenceInput, ConfidenceLevel } from "@/types";

/**
 * Confidence from evidence quality signals — not model intuition.
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceLevel {
  if (
    input.independentSourceCount >= 2 &&
    input.hasStrongTechnicalSource &&
    input.directEvidence &&
    !input.contradictoryEvidence
  ) {
    return "high";
  }

  if (input.evidenceCount >= 2 && !input.contradictoryEvidence) {
    return "medium";
  }

  return "low";
}
