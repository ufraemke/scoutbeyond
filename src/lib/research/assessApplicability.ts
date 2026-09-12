import type { ApplicabilityInput, ApplicabilityRating } from "@/types";
import { evaluationRules } from "./evaluationRules";

/**
 * How well the solution can plausibly transfer to the user's problem.
 */
export function assessApplicability(
  input: ApplicabilityInput,
): ApplicabilityRating {
  if (!input.physicalPrincipleRelevant || input.unresolvedKeyConditions) {
    return "uncertain";
  }

  if (
    input.samePurpose === "yes" &&
    input.comparableConditions === "yes" &&
    input.transferRequired === "low"
  ) {
    return "high";
  }

  if (input.samePurpose === "no" || input.transferRequired === "high") {
    return "low";
  }

  if (
    input.samePurpose === "partial" ||
    input.comparableConditions === "partial" ||
    input.comparableConditions === "no" ||
    input.transferRequired === "medium"
  ) {
    return "medium";
  }

  return "medium";
}

export function assessApplicabilityWithRationale(input: ApplicabilityInput): {
  rating: ApplicabilityRating;
  rationale: string;
} {
  const rating = assessApplicability(input);
  return { rating, rationale: evaluationRules.applicability[rating] };
}
