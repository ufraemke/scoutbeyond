import "server-only";

import type { DiversifiedSearchQuery, StructuredProblem } from "@/types";
import { generateJson } from "@/lib/gemini/client";
import {
  DiversifiedQuerySetSchema,
  buildFallbackQueries,
  structureProblemFromChallenge,
  validateQueryDiversity,
} from "./search";
import { StructuredProblemSchema } from "./schemas";

export type ProblemReflection = {
  problem: StructuredProblem;
  generationMode: "gemini" | "fallback";
  warning?: string;
};

export async function reflectProblem(
  challenge: string,
): Promise<ProblemReflection> {
  try {
    const prompt = `You are structuring an industrial physical-technology research problem.
Challenge: ${challenge}

Return JSON only with:
{
  "statement": "one clear engineering problem statement",
  "currentSolution": "current approach if the user stated one; otherwise omit this field",
  "goals": ["..."],
  "constraints": [{"id":"c1","description":"...","importance":"must"}],
  "assumptions": [{"id":"a1","description":"...","origin":"ai","status":"unconfirmed"}],
  "unknowns": ["..."],
  "searchDimensions": [
    {"id":"direct","name":"Direct application"},
    {"id":"physical_principle","name":"Physical principle"},
    {"id":"adjacent_application","name":"Adjacent applications"},
    {"id":"cross_industry","name":"Cross-industry transfer"},
    {"id":"emerging","name":"Emerging research"}
  ]
}

Scope: physical engineering only. Exclude software-only and business-model solutions.`;

    const raw = await generateJson(prompt);
    return {
      problem: StructuredProblemSchema.parse(raw),
      generationMode: "gemini",
    };
  } catch (error) {
    console.error("[research reflection] Gemini unavailable, using fallback", error);
    return {
      problem: structureProblemFromChallenge(challenge),
      generationMode: "fallback",
      warning:
        "Gemini could not generate the reflection. A basic structured brief was created locally for review.",
    };
  }
}

export async function generateDiversifiedQueries(
  problem: StructuredProblem,
): Promise<DiversifiedSearchQuery[]> {
  try {
    const prompt = `Generate diversified search queries for this engineering problem.
Problem: ${problem.statement}
Goals: ${JSON.stringify(problem.goals)}
Constraints: ${JSON.stringify(problem.constraints)}
Confirmed or unconfirmed assumptions: ${JSON.stringify(
      problem.assumptions.filter((assumption) => assumption.status !== "rejected"),
    )}
Known unknowns: ${JSON.stringify(problem.unknowns)}
User-reviewed search dimensions: ${JSON.stringify(problem.searchDimensions)}

Hard rules:
- Do NOT return an undifferentiated list of similar queries.
- Produce queries across these dimensions with counts:
  - direct: 2-3
  - physical_principle: 2-3
  - adjacent_application: 1-2
  - cross_industry: 1-2
  - emerging: 1-2
- Search by function and physical principle, not only application name.
- Prefer physical / equipment / process / sensing technologies.

Return JSON:
{
  "queries": [
    {"query":"...","dimension":"direct","rationale":"..."}
  ]
}`;

    const raw = await generateJson(prompt);
    const parsed = DiversifiedQuerySetSchema.parse(raw);
    const diversity = validateQueryDiversity(parsed.queries);
    if (!diversity.ok) {
      return buildFallbackQueries(problem);
    }
    return parsed.queries;
  } catch {
    return buildFallbackQueries(problem);
  }
}
