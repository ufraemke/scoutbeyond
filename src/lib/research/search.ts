import { z } from "zod";
import type { DiversifiedSearchQuery, StructuredProblem } from "@/types";

export const DiversifiedSearchQuerySchema = z.object({
  query: z.string().min(3),
  dimension: z.enum([
    "direct",
    "physical_principle",
    "adjacent_application",
    "cross_industry",
    "emerging",
  ]),
  rationale: z.string().optional(),
});

export const DiversifiedQuerySetSchema = z.object({
  queries: z.array(DiversifiedSearchQuerySchema).min(6).max(14),
});

/**
 * Enforce SEARCH_STRATEGY.md mix without asking for an undifferentiated list.
 */
export function validateQueryDiversity(queries: DiversifiedSearchQuery[]): {
  ok: boolean;
  errors: string[];
} {
  const counts: Record<string, number> = {};
  for (const q of queries) {
    counts[q.dimension] = (counts[q.dimension] ?? 0) + 1;
  }

  const errors: string[] = [];
  const required: Array<[string, number, number]> = [
    ["direct", 2, 3],
    ["physical_principle", 2, 3],
    ["adjacent_application", 1, 3],
    ["cross_industry", 1, 3],
    ["emerging", 1, 2],
  ];

  for (const [dim, min, max] of required) {
    const n = counts[dim] ?? 0;
    if (n < min || n > max) {
      errors.push(`${dim}: expected ${min}-${max}, got ${n}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function buildFallbackQueries(
  problem: StructuredProblem,
): DiversifiedSearchQuery[] {
  const statement = problem.statement;
  const priorities = problem.researchPreferences;
  const evidenceTerms = (priorities?.evidenceTypes ?? [])
    .map((type) => {
      switch (type) {
        case "scientific_papers":
          return "research paper";
        case "patents":
          return "patent";
        case "industrial_cases":
          return "industrial case study";
        case "technical_documentation":
          return "technical documentation";
      }
    })
    .join(" ");
  const queries: DiversifiedSearchQuery[] = [
    {
      query: `${statement} industrial technologies`,
      dimension: "direct",
      rationale: "Direct application search",
    },
    {
      query: `established equipment solutions for ${statement}`,
      dimension: "direct",
      rationale: "Established practice",
    },
    {
      query: `physical methods ${statement}`,
      dimension: "physical_principle",
      rationale: "Search by physical principle",
    },
    {
      query: `mechanical acoustic thermal mechanisms ${statement}`,
      dimension: "physical_principle",
      rationale: "Mechanism-first discovery",
    },
    {
      query: `adjacent process equipment solutions similar to ${statement}`,
      dimension: "adjacent_application",
      rationale: "Adjacent applications",
    },
    {
      query: `cross-industry transferable technologies for ${statement}`,
      dimension: "cross_industry",
      rationale: "Cross-industry transfer",
    },
    {
      query: `semiconductor aerospace wastewater robotics solutions ${statement}`,
      dimension: "cross_industry",
      rationale: "Selected transfer domains",
    },
    {
      query: `emerging research experimental physical technologies ${statement}`,
      dimension: "emerging",
      rationale: "Emerging approaches",
    },
  ];

  return queries.map((query) => ({
    ...query,
    query: [
      query.query,
      priorities?.industryFocus === "within" && query.dimension === "direct"
        ? "same-industry"
        : "",
      priorities?.industryFocus === "beyond" &&
      ["adjacent_application", "cross_industry", "emerging"].includes(
        query.dimension,
      )
        ? "cross-industry"
        : "",
      evidenceTerms,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

export function structureProblemFromChallenge(challenge: string): StructuredProblem {
  return {
    statement: challenge.trim(),
    goals: ["Identify transferable physical solution principles"],
    constraints: [],
    assumptions: [
      {
        id: "assume-physical",
        description: "Only physical engineering solutions are in scope.",
        origin: "ai",
        status: "unconfirmed",
      },
    ],
    unknowns: ["Exact operating conditions may be incomplete"],
    searchDimensions: [
      { id: "direct", name: "Direct application" },
      { id: "physical_principle", name: "Physical principle" },
      { id: "adjacent_application", name: "Adjacent applications" },
      { id: "cross_industry", name: "Cross-industry transfer" },
      { id: "emerging", name: "Emerging research" },
    ],
  };
}
