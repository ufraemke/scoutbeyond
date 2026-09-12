import type { CandidateCategory, ConfidenceLevel } from "@/types";

/**
 * Human-readable definitions for category and confidence.
 * Single source of truth for prompts, UI tooltips, and pitch copy.
 */
export const evaluationRules = {
  category: {
    established:
      "Demonstrated industrial use for the same or closely comparable purpose and conditions.",
    adjacent:
      "Demonstrated practical use, but meaningful transfer to the target application is required.",
    exploratory:
      "Limited practical evidence or substantial uncertainty regarding application and transfer.",
  } satisfies Record<CandidateCategory, string>,

  confidence: {
    high: "Multiple independent sources, including strong technical evidence, with direct support and no major contradiction.",
    medium:
      "Relevant evidence exists but is limited, indirect or dependent on assumptions.",
    low: "Evidence is sparse, indirect, contradictory or highly uncertain.",
  } satisfies Record<ConfidenceLevel, string>,

  applicability: {
    high: "Physical principle fits; purpose and conditions align with low transfer burden.",
    medium:
      "Plausible transfer with partial purpose or condition match and moderate adaptation needed.",
    low: "Significant mismatch in purpose, conditions, or high transfer burden.",
    uncertain:
      "Principle relevance unclear or key technical conditions remain unresolved.",
  },

  evidenceQuality: {
    strong:
      "Multiple independent sources including strong technical evidence with direct support and no major contradiction.",
    moderate:
      "Relevant evidence exists but is limited, partly indirect, or from fewer independent sources.",
    weak: "Sparse, indirect, contradictory, or weakly sourced evidence.",
  },
} as const;

export function categoryRationale(category: CandidateCategory): string {
  return evaluationRules.category[category];
}
