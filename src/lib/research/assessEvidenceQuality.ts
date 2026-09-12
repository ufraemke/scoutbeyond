import type { EvidenceQuality, EvidenceQualityInput } from "@/types";
import { evaluationRules } from "./evaluationRules";

/**
 * Strength of evidence supporting the relevant claim.
 */
export function assessEvidenceQuality(
  input: EvidenceQualityInput,
): EvidenceQuality {
  if (input.contradictoryEvidence) {
    return "weak";
  }

  if (
    input.independentSourceCount >= 2 &&
    input.hasStrongTechnicalSource &&
    input.directEvidence
  ) {
    return "strong";
  }

  if (
    input.evidenceCount >= 2 ||
    (input.hasStrongTechnicalSource && input.directEvidence)
  ) {
    return "moderate";
  }

  return "weak";
}

export function assessEvidenceQualityWithRationale(
  input: EvidenceQualityInput,
): {
  quality: EvidenceQuality;
  rationale: string;
} {
  const quality = assessEvidenceQuality(input);
  return { quality, rationale: evaluationRules.evidenceQuality[quality] };
}
