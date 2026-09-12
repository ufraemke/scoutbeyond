# How Firecrawl and the LLM Work Together

> **Informational only.** This document explains the division of responsibilities. It is not a build checklist. For the normative search process, use `SEARCH_STRATEGY.md`. For evaluation rules, use `BACKEND_EVALUATION_RULES.md`.

The simplest way to think about the workflow is:

> **Firecrawl finds and extracts information.  
> Gemini interprets and structures it.  
> Our application applies the evaluation rules.**

They should not all do the same job.

## 1. Start with the engineering problem

The user enters a problem, for example:

> What alternatives to conventional spray cleaning could be used for cleaning the inside of industrial tanks?

Gemini can help turn this into a structured problem:

- goal
- constraints
- assumptions
- important unknowns
- possible search directions

It can also generate useful search queries and terminology.

```text
User problem
      ↓
Structured problem
      ↓
Search queries
```

## 2. Firecrawl retrieves information

Firecrawl is the **retrieval layer**.

Its job is to search for or extract relevant content from sources such as:

- supplier websites
- research institutions
- technical articles
- application examples
- patents or patent summaries
- other relevant web sources

For example, Firecrawl might retrieve information about:

- ultrasonic cleaning
- rotating jet systems
- acoustic cavitation
- dry-ice cleaning
- robotic cleaning systems

At this point we mainly have **raw source material**.

```text
Search query
      ↓
Firecrawl
      ↓
Web pages / extracted content
```

Firecrawl should not decide whether a technology is good for our problem.

## 3. Gemini analyses the retrieved material

Gemini receives the relevant extracted content.

Its job is to answer structured questions such as:

- What physical principle is described?
- Has it been used industrially?
- For what purpose?
- Under which operating conditions?
- In which industries?
- What benefits are reported?
- What limitations are reported?
- What evidence supports these statements?
- Are there important uncertainties?
- Would significant transfer be required for our target problem?

The important point is:

> Gemini should extract **structured facts and evidence**, not freely invent the final evaluation.

Example output:

```json
{
  "technology": "Ultrasonic cleaning",
  "physicalPrincipleRelevant": true,
  "industrialUse": true,
  "samePurpose": "partial",
  "comparableConditions": "partial",
  "transferRequired": "medium",
  "limitations": [
    "Effectiveness depends strongly on geometry and acoustic distribution"
  ]
}
```

## 4. Keep evidence linked to the source

We should never lose the connection between a finding and its source.

Instead of only storing:

```text
Source: Fraunhofer article
```

we want something like:

```text
Finding:
Ultrasonic cavitation has been demonstrated for removing
contamination from metallic surfaces.

Why it matters:
This supports the physical cleaning principle.

Source:
Fraunhofer ...
```

This is one of the core values of ScoutBeyond:

```text
Claim → Evidence → Source
```

## 5. Our application applies the rules

The LLM should not simply decide:

> "This feels Adjacent."

Instead, it provides the structured inputs.

Our code then applies the predefined rules:

```text
Structured evidence
       ↓
Classification rules
       ↓
Established / Adjacent / Exploratory
```

The same applies to:

- confidence
- applicability
- evidence quality
- scoring

Example:

```text
Industrial use demonstrated: YES
Same purpose: PARTIAL
Comparable conditions: PARTIAL
Transfer required: MEDIUM

→ Category: ADJACENT
```

This makes the result more reproducible and explainable.

## 6. A second research pass can verify promising candidates

The first search should be broad:

> What possible solution principles exist?

After promising candidates have been identified, we can run more focused searches.

For example:

```text
Broad research
      ↓
Ultrasonic cleaning identified
      ↓
Targeted follow-up search
      ↓
"ultrasonic cleaning large industrial tanks"
"ultrasonic cavitation vessel cleaning"
"limitations ultrasonic cleaning large vessels"
```

This second pass can look specifically for:

- real applications
- contradictory evidence
- limitations
- scale-up problems
- maturity
- operating conditions

This is our **counter-check / verification step**.

For the hackathon, this can be simple. We do not need a complex autonomous research agent.

## 7. Final workflow

```text
USER
  ↓
Problem description
  ↓
GEMINI
Structure problem + generate search directions
  ↓
FIRECRAWL
Search / retrieve / extract sources
  ↓
GEMINI
Extract evidence and structured facts
  ↓
VALIDATION
Check that the JSON follows our schema
  ↓
OUR RULES
Category
Confidence
Applicability
Evidence quality
Scores
  ↓
OPTIONAL SECOND SEARCH
Counter-check important candidates
  ↓
ResearchResult JSON
  ↓
FRONTEND
Established | Adjacent | Exploratory
Comparison
Evidence
Sources
Shortlist
```

## The key division of responsibilities

**Firecrawl**

> Find and retrieve information.

**Gemini**

> Understand the information and convert it into structured evidence.

**ScoutBeyond application logic**

> Apply our transparent evaluation rules.

**Frontend**

> Make the reasoning, evidence and alternatives understandable to the engineer.

This separation is important because ScoutBeyond should not be a chatbot that simply produces recommendations.

It should be a structured research workflow:

> **Retrieve → Understand → Verify → Evaluate → Compare**