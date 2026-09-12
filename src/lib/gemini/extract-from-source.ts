import "server-only";

import { generateJson } from "./client";
import {
  SourceExtractionSchema,
  type SourceExtraction,
} from "./extraction-schema";

export type { SourceExtraction } from "./extraction-schema";
export { SourceExtractionSchema } from "./extraction-schema";

export async function extractFromSource(input: {
  problemStatement: string;
  title?: string | null;
  url: string;
  markdown: string;
}): Promise<SourceExtraction> {
  const content = input.markdown.slice(0, 12000);
  const prompt = `Extract structured physical-technology facts from this source for ScoutBeyond.
Do NOT classify Established/Adjacent/Exploratory. Provide classificationFacts only.
Do NOT invent URLs. Only use evidence present in the source text.
If the source is out of scope (software-only, business model, pharma formulation), set inScope=false.

Problem: ${input.problemStatement}
Source title: ${input.title ?? "Unknown"}
Source URL: ${input.url}
Source markdown:
${content}

Return JSON matching:
{
  "inScope": true,
  "candidates": [
    {
      "name": "...",
      "principle": "physical mechanism...",
      "summary": "...",
      "relevance": "...",
      "industries": [],
      "physicalMechanisms": [],
      "benefits": [],
      "limitations": [],
      "uncertainties": [],
      "maturityLabel": "...",
      "findings": [
        {"finding":"...","relevance":"...","stance":"supports","exactExcerpt":"..."}
      ],
      "classificationFacts": {
        "physicalPrincipleRelevant": true,
        "samePurpose": "partial",
        "comparableConditions": "partial",
        "industrialUse": true,
        "independentApplications": 1,
        "transferRequired": "medium"
      },
      "applicabilityFacts": {
        "physicalPrincipleRelevant": true,
        "samePurpose": "partial",
        "comparableConditions": "partial",
        "transferRequired": "medium",
        "unresolvedKeyConditions": false
      },
      "evidenceFacts": {
        "evidenceCount": 1,
        "independentSourceCount": 1,
        "hasStrongTechnicalSource": true,
        "directEvidence": true,
        "contradictoryEvidence": false
      }
    }
  ]
}`;

  const raw = await generateJson(prompt);
  return SourceExtractionSchema.parse(raw);
}
