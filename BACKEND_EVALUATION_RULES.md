# Backend Handoff: Evaluation Rules & Research Output

## Purpose

ScoutBeyond should **not let the LLM freely decide** whether a solution is *Established*, *Adjacent* or *Exploratory*, or assign confidence purely by intuition.

The intended architecture is:

```text
Retrieval (e.g. Firecrawl)
        ↓
Gemini extracts structured evidence
        ↓
Schema validation (e.g. Zod)
        ↓
Deterministic evaluation rules
        ↓
Candidate + ResearchResult JSON
        ↓
Frontend
```

The LLM should extract evidence and structured facts. The application should apply the classification rules.

---

## 1. Keep Three Concepts Separate

### Category
Describes how the solution relates to the target problem:
- `established`
- `adjacent`
- `exploratory`

### Maturity
Describes how technically/commercially mature the technology is, e.g. TRL, pilot, industrial deployment, commercially available.

### Confidence
Describes how certain we are that an assessment is correct:
- `high`
- `medium`
- `low`

A technology can therefore be industrially mature, but only `adjacent` to the target application, with `medium` applicability confidence.

---

## 2. Category Rules

Use structured inputs such as:

```ts
type ClassificationInput = {
  physicalPrincipleRelevant: boolean
  samePurpose: "yes" | "partial" | "no"
  comparableConditions: "yes" | "partial" | "no"
  industrialUse: boolean
  independentApplications: number
  transferRequired: "low" | "medium" | "high"
}
```

### Established
Use when:
- the physical principle is relevant,
- practical industrial use is demonstrated,
- the technology serves the same or a very similar technical purpose,
- operating conditions are comparable or at least not fundamentally different.

### Adjacent
Use when:
- the physical principle is relevant,
- practical use is demonstrated,
- but the solution is proven in another application, industry or operating context,
- and meaningful transfer to the target problem is required.

### Exploratory
Use when one or more of the following applies:
- little or no demonstrated practical use,
- mainly research / laboratory / pilot evidence,
- transferability is highly speculative,
- key technical conditions remain unresolved.

Example implementation:

```ts
export function classifyCandidate(
  input: ClassificationInput
): "established" | "adjacent" | "exploratory" {
  if (
    input.physicalPrincipleRelevant &&
    input.industrialUse &&
    input.samePurpose === "yes" &&
    input.comparableConditions !== "no"
  ) {
    return "established"
  }

  if (
    input.physicalPrincipleRelevant &&
    input.industrialUse &&
    input.transferRequired !== "low"
  ) {
    return "adjacent"
  }

  return "exploratory"
}
```

The exact thresholds may evolve, but the rule should remain explicit and deterministic.

---

## 3. Confidence Rules

Confidence should be derived from evidence quality, not from model intuition.

```ts
type ConfidenceInput = {
  evidenceCount: number
  independentSourceCount: number
  hasStrongTechnicalSource: boolean
  directEvidence: boolean
  contradictoryEvidence: boolean
}
```

### High
- multiple independent sources,
- at least one strong technical / primary / credible source,
- direct evidence for the claim,
- no major contradiction.

### Medium
- relevant evidence exists,
- but it is limited, indirect, incomplete or partly assumption-based.

### Low
- sparse evidence,
- only weak or indirect sources,
- major contradictions,
- substantial missing information.

Example:

```ts
export function calculateConfidence(
  input: ConfidenceInput
): "low" | "medium" | "high" {
  if (
    input.independentSourceCount >= 2 &&
    input.hasStrongTechnicalSource &&
    input.directEvidence &&
    !input.contradictoryEvidence
  ) {
    return "high"
  }

  if (
    input.evidenceCount >= 2 &&
    !input.contradictoryEvidence
  ) {
    return "medium"
  }

  return "low"
}
```

---

## 4. Applicability and Evidence Quality

For the MVP, define only four rule sets:

```text
CATEGORY
Established / Adjacent / Exploratory

CONFIDENCE
High / Medium / Low

APPLICABILITY
High / Medium / Low / Uncertain

EVIDENCE QUALITY
Strong / Moderate / Weak
```

Do not add more rule systems unless they are needed for the demo.

Applicability answers:
> How well can this solution plausibly transfer to the user’s specific problem?

Evidence quality answers:
> How strong is the evidence supporting the relevant claim?

---

## 5. Recommended Technical Structure

Prefer one central rules module instead of scattered logic.

```text
src/
  lib/
    research/
      schemas.ts
      evaluationRules.ts
      classifyCandidate.ts
      calculateConfidence.ts
      assessApplicability.ts
      assessEvidenceQuality.ts
```

Optional central definitions:

```ts
export const evaluationRules = {
  category: {
    established:
      "Demonstrated industrial use for the same or closely comparable purpose and conditions.",
    adjacent:
      "Demonstrated practical use, but meaningful transfer to the target application is required.",
    exploratory:
      "Limited practical evidence or substantial uncertainty regarding application and transfer."
  },

  confidence: {
    high:
      "Multiple independent sources, including strong technical evidence, with direct support and no major contradiction.",
    medium:
      "Relevant evidence exists but is limited, indirect or dependent on assumptions.",
    low:
      "Evidence is sparse, indirect, contradictory or highly uncertain."
  }
}
```

This creates one source of truth for backend logic, prompts, UI labels/tooltips, documentation and pitch explanations.

---

## 6. LLM Responsibility

Gemini should **not** be asked:
> “Is this Established, Adjacent or Exploratory?”

Instead, ask it to extract structured facts such as:

```json
{
  "physicalPrincipleRelevant": true,
  "samePurpose": "partial",
  "comparableConditions": "partial",
  "industrialUse": true,
  "independentApplications": 3,
  "transferRequired": "medium"
}
```

Also extract:
- real-world application evidence,
- application context,
- physical mechanism,
- operating conditions,
- maturity indicators,
- limitations,
- contradictions,
- transfer gaps.

The deterministic rule layer then computes the category.

---

## 7. Validate LLM Output

Use schema validation before applying rules.

Example with Zod:

```ts
import { z } from "zod"

export const ClassificationInputSchema = z.object({
  physicalPrincipleRelevant: z.boolean(),
  samePurpose: z.enum(["yes", "partial", "no"]),
  comparableConditions: z.enum(["yes", "partial", "no"]),
  industrialUse: z.boolean(),
  independentApplications: z.number().int().min(0),
  transferRequired: z.enum(["low", "medium", "high"])
})
```

Then:

```ts
const validated = ClassificationInputSchema.parse(geminiOutput)
const category = classifyCandidate(validated)
```

This prevents ambiguous outputs such as `industrialUse = "probably"`.

---

## 8. Keep Raw Assessment Inputs

Do not store only:

```json
{
  "category": "adjacent"
}
```

Also retain the inputs behind that classification:

```json
{
  "category": "adjacent",
  "classificationEvidence": {
    "samePurpose": "partial",
    "comparableConditions": "partial",
    "industrialUse": true,
    "independentApplications": 3,
    "transferRequired": "medium"
  }
}
```

This supports transparency and debugging, and lets the UI explain:

> **Adjacent** — Industrial use is demonstrated, but transfer to the target application is required.

---

## 9. Evidence Must Be Separate from Sources

A source is only the origin of information. Evidence should capture the relevant claim supported by that source.

```ts
type EvidenceItem = {
  id: string
  finding: string
  relevance: string
  stance: "supports" | "contradicts" | "neutral"
  source: Source
  confidence?: "low" | "medium" | "high"
}
```

This matters because ScoutBeyond is not only finding sources; it should show **what those sources mean for the technical decision**.

---

## 10. Candidate Output

The backend should ultimately return a normalized `Candidate` that includes at minimum:

```ts
type Candidate = {
  id: string
  name: string
  principle: string

  category: "established" | "adjacent" | "exploratory"

  summary: string
  relevance: string

  evidence: EvidenceItem[]
  applicability: ApplicabilityAssessment

  benefits: string[]
  limitations: string[]
  uncertainties: Uncertainty[]

  maturity?: MaturityAssessment
  evaluations: CriterionAssessment[]
  overallScore?: Score
  verification?: VerificationResult
}
```

The final frontend contract should remain `ResearchResult`.

---

## 11. MVP Principle

For the hackathon:

- keep the schema broad enough to avoid immediate redesign,
- keep rule logic simple,
- keep thresholds explicit,
- retain the evidence behind every assessment,
- prefer deterministic rules over LLM judgement,
- do not build a generic rule engine,
- do not over-engineer TRL, sustainability, CAPEX or scoring unless required for the demo.

Core principle:

> **Evidence in → structured facts → deterministic assessment → transparent result.**

This gives the prototype technical credibility while remaining fast enough to implement during the hackathon.
