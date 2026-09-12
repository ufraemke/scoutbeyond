# ScoutBeyond Search Strategy

## Purpose

This document defines the MVP search strategy for ScoutBeyond.

The goal is **not** to perform a generic web search. The system should systematically discover physical engineering solution principles, including approaches from adjacent industries and unfamiliar technical domains.

Core principle:

> **Breadth first, depth second.**

The first pass should identify a broad landscape of distinct physical solution principles.  
The second pass should investigate promising or uncertain candidates in more depth.

---

## 1. Scope

ScoutBeyond searches for **physical engineering solutions**.

Relevant solutions may include:

- mechanical principles,
- materials,
- equipment,
- manufacturing processes,
- physical sensing or measurement methods,
- automation,
- robotics,
- process-control mechanisms,
- transferable physical principles from other industries.

Exclude:

- software-only solutions,
- generic analytics without physical sensing or control,
- business-model innovations,
- marketing solutions,
- purely organizational interventions,
- pharmaceutical / drug discovery,
- food, chemical or material formulation,
- other non-physical solutions.

Apply this scope filter before spending time on deeper analysis.

---

## 2. Research Workflow

```text
User problem
    ↓
Problem structuring
    ↓
Search dimensions
    ↓
Diversified query generation
    ↓
Broad first-pass search
    ↓
Extract solution principles
    ↓
Deduplicate + cluster
    ↓
Select promising / uncertain candidates
    ↓
Targeted second-pass research
    ↓
Counter-check
    ↓
Structured evidence
    ↓
Evaluation + shortlist
```

---

## 3. Step 1 — Structure the Problem

Before searching, convert the user's problem into a structured research problem.

At minimum capture:

```ts
type StructuredProblem = {
  statement: string
  goals: string[]
  constraints: string[]
  assumptions: string[]
  unknowns: string[]
  searchDimensions: string[]
}
```

The system should avoid asking unnecessary clarification questions.

If relevant information is missing, proceed with explicit assumptions where possible.

---

## 4. Step 2 — Generate Search Dimensions

Do not search only for the wording used by the user.

Search dimensions should expand the problem into different technical perspectives.

For each research problem, consider:

### A. Direct application

Search for established solutions used directly for the target problem.

Example:

```text
industrial tank cleaning alternatives
tank internal cleaning technologies
```

### B. Physical principle

Search by the physical function or mechanism instead of the application name.

Examples:

```text
physical methods for deposit removal
acoustic cleaning surfaces
mechanical removal of residues from enclosed surfaces
```

### C. Adjacent applications

Search for similar technical problems in other equipment or contexts.

Examples:

```text
pipe cleaning
heat exchanger cleaning
vessel cleaning
internal surface cleaning
```

### D. Cross-industry transfer

Search industries where similar physical problems may have been solved differently.

Potential domains may include:

- aerospace,
- automotive,
- semiconductor manufacturing,
- precision cleaning,
- wastewater,
- food processing,
- chemical processing,
- surface treatment,
- robotics,
- machine vision,
- industrial automation.

Do not treat this list as fixed. Select industries based on the physical problem.

### E. Emerging / research approaches

Search for less established or unconventional physical principles.

Examples:

```text
novel cleaning technologies
emerging non-contact cleaning methods
research industrial surface cleaning
```

---

## 5. Query Generation Rules

The LLM may generate search queries, but query generation should follow explicit diversity rules.

For the MVP, aim for approximately:

```text
2–3 direct-application queries
2–3 physical-principle queries
2–3 adjacent-application or cross-industry queries
1–2 emerging / research queries
```

Do not ask the LLM simply to:

> "Generate 10 search queries."

Instead require diverse search intent.

Example output structure:

```ts
type SearchQuery = {
  query: string

  dimension:
    | "direct"
    | "physical_principle"
    | "adjacent_application"
    | "cross_industry"
    | "emerging"

  rationale?: string
}
```

---

## 6. Key Search Principle

The most important search rule is:

> **Search by function and physical principle, not only by application name.**

This is essential to the ScoutBeyond value proposition.

Searching only for:

```text
alternatives to tank spray cleaning
```

will mostly return known tank-cleaning technologies.

Searching for the underlying function:

```text
remove deposits from enclosed surfaces
non-contact removal of contamination
clean inaccessible internal surfaces
```

creates opportunities to discover technologies from other fields.

---

## 7. First Pass — Broad Discovery

The goal of the first pass is:

> Identify distinct solution principles, not collect many pages about the same solution.

Conceptually:

```text
many raw findings
      ↓
deduplicate
      ↓
cluster
      ↓
distinct physical solution principles
```

For the hackathon, a useful target could be roughly:

```text
8–12 distinct candidate solution principles
```

This is a guideline, not a hard requirement.

Do not spend the majority of retrieval effort on the first promising technology discovered.

---

## 8. Candidate Extraction

From retrieved content, Gemini should extract candidate solution principles and structured evidence.

At minimum extract:

- solution / technology name,
- physical principle,
- application context,
- industries,
- evidence of real-world use,
- operating conditions where available,
- benefits,
- limitations,
- maturity indicators,
- uncertainties,
- source references.

Candidate extraction should feed the common ScoutBeyond data model.

---

## 9. Deduplication and Clustering

Different sources may describe the same underlying principle using different terminology.

Examples:

```text
ultrasonic cleaning
ultrasonic cavitation cleaning
acoustic cavitation cleaning
```

These should not automatically become three separate candidates.

Cluster findings primarily by:

1. physical mechanism,
2. function,
3. application principle.

Product names should not define candidate boundaries.

Prefer a technology / solution principle over a specific supplier product as the main candidate.

---

## 10. Source Diversity

Do not treat several pages repeating the same claim as independent evidence.

Where possible, use different source types, for example:

- research paper,
- university or research institute,
- patent or patent summary,
- industry / technical publication,
- supplier or manufacturer,
- documented application / case study.

A candidate does **not** need every source type.

However:

> Three supplier pages making the same claim are not equivalent to three independent sources.

Track source independence when estimating confidence.

---

## 11. Second Pass — Targeted Research

After the broad discovery pass, select candidates for deeper investigation.

Prioritize candidates that are:

- promising,
- highly relevant,
- unusual but plausible,
- insufficiently supported,
- difficult to classify,
- likely shortlist candidates.

The second pass should answer questions such as:

- Has this been used in a comparable real-world application?
- At what scale?
- Under which operating conditions?
- What are the main limitations?
- What transfer gaps exist?
- Is there contradictory evidence?
- Is the technology commercially available or still experimental?

---

## 12. Counter-Search / Verification

For shortlisted or high-interest candidates, deliberately search for evidence **against** the initial hypothesis.

Do not search only for benefits.

Example:

```text
ultrasonic cleaning limitations large tanks
ultrasonic cleaning scale-up problems
ultrasonic cavitation vessel limitations
```

Rule:

> For shortlisted candidates, run at least one targeted search for limitations, failure conditions, scale-up issues or contradictory evidence.

This supports the ScoutBeyond counter-check principle.

---

## 13. Evidence Handling

Keep claims connected to evidence and sources.

Preferred structure:

```text
Claim
  ↓
Evidence finding
  ↓
Source
```

Example:

```json
{
  "finding": "Ultrasonic cavitation has been demonstrated for removing deposits from metallic surfaces.",
  "relevance": "Supports the physical cleaning principle for contamination removal.",
  "source": {
    "title": "...",
    "url": "...",
    "sourceType": "research_institution"
  }
}
```

The source alone is not enough.  
The system should record **what the source actually supports**.

---

## 14. Firecrawl Responsibility

Firecrawl is the retrieval layer.

Its job is to:

- search,
- retrieve pages,
- extract relevant page content,
- provide structured source material.

Firecrawl should **not** make the final technical evaluation.

Conceptually:

```text
Search queries
      ↓
Firecrawl
      ↓
Source content
      ↓
Gemini analysis
```

---

## 15. Gemini Responsibility

Gemini should:

- structure the problem,
- generate diversified search queries,
- interpret retrieved content,
- extract candidate technologies,
- extract structured evidence,
- identify operating conditions,
- identify limitations and uncertainties,
- identify potential transfer gaps.

Gemini should **not freely assign final classifications or confidence levels** where deterministic rules exist.

Instead it should produce the structured inputs needed by the evaluation rules.

---

## 16. Application Rule Layer

After evidence extraction:

```text
Structured facts
      ↓
Validation
      ↓
Deterministic rules
      ↓
Category
Confidence
Applicability
Evidence quality
Score
```

This logic should use the evaluation rules defined separately in:

```text
BACKEND_EVALUATION_RULES.md
```

---

## 17. Stopping Rules

The search does not need to be exhaustive.

Stop broad discovery when one or more of the following are true:

- the main solution families are represented,
- repeated searches mostly produce already-known candidates,
- new results add little technical diversity,
- the target number of distinct candidate principles has been reached.

Stop deeper research on a candidate when:

- there is enough evidence to assess applicability,
- important limitations are known,
- the maturity can be reasonably described,
- confidence can be assigned using the defined rules,
- further searches mostly repeat existing evidence.

For the hackathon, prefer:

> **Good coverage + transparent uncertainty**

over:

> **Pretending the search is complete.**

---

## 18. MVP Search Strategy Summary

```text
1. Structure the engineering problem.

2. Generate multiple search dimensions:
   - direct application
   - physical principle
   - adjacent application
   - cross-industry
   - emerging / research

3. Generate diversified search queries.

4. Run a broad first-pass search with Firecrawl.

5. Use Gemini to extract physical solution principles and evidence.

6. Filter out non-physical / out-of-scope results.

7. Deduplicate and cluster similar principles.

8. Build an initial candidate landscape.

9. Select promising or uncertain candidates.

10. Run targeted second-pass research.

11. Counter-search for limitations and contradictory evidence.

12. Convert findings into structured evidence.

13. Apply deterministic evaluation rules.

14. Return candidates, comparison and shortlist.
```

---

## 19. What We Should NOT Build During the Hackathon

Do not spend hackathon time on:

- a generic autonomous research agent,
- complex search-ranking infrastructure,
- custom web crawling infrastructure,
- sophisticated domain authority scoring,
- perfect patent analysis,
- large-scale website crawling,
- complex source-reputation databases,
- exhaustive literature reviews.

The MVP should demonstrate a **credible research process**, not solve web search completely.

---

## Core Principle

ScoutBeyond research should be:

> **Broad enough to discover the non-obvious, structured enough to remain useful, and evidence-driven enough to remain credible.**

Operationally:

> **Retrieve broadly → cluster principles → investigate selectively → counter-check → evaluate transparently.**
