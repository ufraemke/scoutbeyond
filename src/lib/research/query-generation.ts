import "server-only";

import { z } from "zod";
import type { DiversifiedSearchQuery, StructuredProblem } from "@/types";
import { generateJson } from "@/lib/gemini/client";
import {
  DiversifiedQuerySetSchema,
  buildFallbackQueries,
  structureProblemFromChallenge,
  validateQueryDiversity,
} from "./search";

const StructuredProblemSchema = z.object({
  statement: z.string().min(8),
  goals: z.array(z.string()).default([]),
  constraints: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        importance: z.enum(["must", "should"]).optional(),
      }),
    )
    .default([]),
  assumptions: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        origin: z.enum(["user", "ai"]),
        status: z.enum(["confirmed", "unconfirmed", "rejected"]),
      }),
    )
    .default([]),
  unknowns: z.array(z.string()).default([]),
  searchDimensions: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .default([]),
});

export async function structureProblem(challenge: string): Promise<StructuredProblem> {
  try {
    const prompt = `You are structuring an industrial physical-technology research problem.
Challenge: ${challenge}

Return JSON only with:
{
  "statement": "one clear engineering problem statement",
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
    const parsed = StructuredProblemSchema.parse(raw);
    return parsed;
  } catch {
    return structureProblemFromChallenge(challenge);
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
