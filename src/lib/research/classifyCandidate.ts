import type { CandidateCategory, ClassificationInput } from "@/types";
import { categoryRationale } from "./evaluationRules";

/**
 * Deterministic category assignment from structured facts.
 * Do not ask an LLM for Established / Adjacent / Exploratory.
 */
export function classifyCandidate(
  input: ClassificationInput,
): CandidateCategory {
  if (
    input.physicalPrincipleRelevant &&
    input.industrialUse &&
    input.samePurpose === "yes" &&
    input.comparableConditions !== "no"
  ) {
    return "established";
  }

  if (
    input.physicalPrincipleRelevant &&
    input.industrialUse &&
    input.transferRequired !== "low"
  ) {
    return "adjacent";
  }

  return "exploratory";
}

export function classifyCandidateWithRationale(input: ClassificationInput): {
  category: CandidateCategory;
  rationale: string;
} {
  const category = classifyCandidate(input);
  return { category, rationale: categoryRationale(category) };
}
