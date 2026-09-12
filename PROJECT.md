# ScooutBeyond

## 1. Purpose

ScooutBeyond is an AI-assisted research tool for industrial R&D and engineering teams.

It helps engineers systematically identify technical solution approaches beyond their immediate industry, compare them using transparent criteria, and trace findings back to sources.

The hackathon goal is a working prototype that demonstrates:

1. structured problem intake,
2. AI-supported technology research,
3. clustering of candidate solutions,
4. transparent scoring and reasoning,
5. traceable sources,
6. a clear technical result landscape.

The prototype should feel useful to a real engineer, not like a generic chatbot.

---

## 2. Primary User

Primary users are:

> R&D and engineering teams in mid-sized industrial companies with substantial in-house development but no dedicated technology scouting function.

Primary target industries:

- mechanical equipment and industrial machinery,
- automotive and component manufacturing,
- metalworking, machining, and surface treatment,
- industrial parts washing and precision cleaning,
- aerospace and industrial equipment manufacturing,
- electronics and semiconductor manufacturing,
- packaging, paper, plastics, and textiles,
- chemicals, coatings, and process manufacturing,
- utilities, wastewater, and water-treatment operations,
- food and beverage processing, when the challenge concerns equipment, cleaning systems, or process control.

Typical users:

- development engineers,
- R&D engineers,
- technical product managers,
- engineering leads.

Typical company context:

- industrial / manufacturing company,
- roughly 100–2,000 employees,
- strong technical expertise,
- limited dedicated technology intelligence resources,
- desktop-centric workflow,
- users comfortable with Excel but not necessarily databases, APIs, or coding.

### 2.1 Solution Scope and Exclusions

**Scope:** The system scouts physical engineering solutions and technologies for industrial operations. Relevant solutions must involve a physical system, mechanical principle, material, equipment, manufacturing process, physical sensing or measurement method, automation, robotics, or process-control mechanism.

The initial focus is industrial cleaning and water-intensive manufacturing. The system may search adjacent and cross-industry domains—such as quality inspection, machine vision, robotics, sensor systems, process automation, materials engineering, and wastewater treatment—to identify transferable physical solutions. Industry transferability is the purpose of the search; it is not a reason to include unrelated domain solutions.

**Exclude:** pharmaceutical or drug discovery; food, chemical, or material formulation; software-only solutions; generic analytics without a physical sensing or control component; business-model innovations; marketing solutions; purely organizational interventions; and other non-physical solutions.

---

## 3. User Problem

Technical research is often:

- fragmented across search engines, papers, supplier sites, patents, internal documents, and databases,
- difficult to structure consistently,
- time-consuming,
- biased toward familiar technologies and industries,
- hard to document afterwards,
- difficult to evaluate objectively,
- prone to missing solutions from adjacent industries.

Engineers need a way to explore broadly without losing technical rigor.

---

## 4. Value Proposition

ScooutBeyond provides:

- guided technical research,
- cross-industry solution discovery,
- structured comparison,
- explicit assumptions,
- transparent evaluation criteria,
- counter-checking of promising approaches,
- traceable sources,
- compact documentation.

Core promise:

> Discover relevant technical approaches faster, including solutions outside your own industry, while keeping the research structured, transparent, and traceable.

---

## 5. Demo Use Case

Primary hackathon demo:

### Tank cleaning

Research question:

> What physical alternatives or complementary technologies exist to conventional spray cleaning for cleaning the interior of industrial tanks?

The system should identify solutions from:

- established industrial practice,
- adjacent applications or industries,
- exploratory or emerging technologies.

The demo should include a sustainability perspective where relevant.

Examples of evaluation dimensions:

- cleaning effectiveness,
- implementation complexity,
- water consumption,
- energy consumption,
- chemical consumption,
- maturity / TRL,
- hygienic suitability,
- CAPEX,
- retrofit potential.

The exact candidate technologies may come from live research, prepared datasets, or a combination of both. Candidates must meet the physical-engineering scope in Section 2.1.

---

## 6. Product Flow

Target flow:

### Step 1 — Problem Input

User describes the technical problem in natural language.

Keep the initial form minimal.

Possible fields:

- technical challenge,
- current solution,
- desired improvement,
- relevant constraints.

### Step 2 — Clarification

The system asks only questions that materially improve the search.

Examples:

- What must not change?
- What performance threshold is required?
- Are there regulatory constraints?
- Is retrofitability required?

If information is missing, the system may proceed using explicitly stated assumptions.

### Step 3 — Research

The system searches for potentially relevant physical technologies.

Live research follows `FIRECRAWL_WEBHOOK_LIVE_RESEARCH.md` and the mandatory build contract in `LIVE_RESEARCH_IMPLEMENTATION.md`:

```text
Firecrawl Search → Batch Scrape + webhooks → per-source analysis → Realtime UI
```

Progress shown to the user must reflect persisted source and candidate state. Do not fake phases, counts, or completion percentages.

Research may combine:

- live web research,
- structured prepared datasets,
- company/internal knowledge,
- technical publications,
- supplier information,
- patents or patent summaries,
- research institutions.

For the hackathon, not all source classes need full implementation.

### Step 4 — Candidate Structuring

Candidate technologies are grouped into:

1. **Established**
2. **Adjacent**
3. **Exploratory**

### Step 5 — Evaluation

Candidates are evaluated using transparent criteria.

Each result should show:

- technology / concept,
- short explanation,
- why it is relevant,
- category,
- strengths,
- limitations,
- maturity,
- score,
- supporting sources.

### Step 6 — Counter-Check

Promising results should be challenged.

Possible checks:

- contradictory evidence,
- maturity mismatch,
- exaggerated supplier claims,
- missing evidence,
- application limitations.

### Step 7 — Result Landscape

The user receives a structured landscape of candidate solutions.

The primary visual format is a simple three-column landscape:

| Established | Adjacent | Exploratory |
| --- | --- | --- |
| proven industrial approaches | technologies proven elsewhere | emerging / unconventional approaches |

Users can inspect individual candidates in more detail.

---

## 7. MVP Scope

### Must Have

- working web application,
- technical problem input,
- research workflow,
- candidate generation constrained to physical engineering solutions,
- Established / Adjacent / Exploratory clustering,
- structured candidate cards,
- scoring or prioritization,
- source links,
- understandable explanation of reasoning,
- result landscape,
- convincing tank-cleaning demo.

### Should Have

- clarifying questions,
- editable assumptions,
- counter-checking,
- sustainability criteria,
- combination of structured data + live research,
- detailed candidate view,
- loading / progress state,
- exportable or shareable result.

### Nice to Have

- realtime speaking avatar,
- voice interaction,
- animated research progress,
- interactive criteria weighting,
- company-specific knowledge upload,
- PDF export,
- saved research projects,
- user accounts.

---

## 8. Kill List

Do not spend hackathon time building:

- complex authentication,
- enterprise permission systems,
- billing,
- production-grade multi-tenancy,
- elaborate admin interfaces,
- full document management,
- large custom databases,
- custom search infrastructure,
- unnecessary abstractions,
- premature scalability,
- perfect mobile support.

The prototype should optimize for:

> convincing product experience + credible technical implementation.

---

## 9. Technical Architecture

Preferred baseline:

### Frontend

- Next.js
- TypeScript
- React
- responsive web interface
- desktop first

### Backend

Use the simplest architecture that supports the prototype.

Possible components:

- Next.js API routes / server actions,
- Python service for research or analysis where useful,
- external AI APIs,
- search / scraping APIs.

Python is explicitly allowed and encouraged where it makes implementation faster for research or analysis.

### Data

Preferred:

- Supabase for persistent structured data if persistence is needed.

For the hackathon, local JSON / mock data is acceptable where persistence provides no demo value.

### Deployment

- GitHub repository
- Vercel deployment for the web application

---

## 10. AI / Research Architecture

The prototype should separate:

### Retrieval

Finding potentially relevant information.

### Analysis

Understanding relevance to the user's technical problem and validating physical-engineering scope.

### Structuring

Converting findings into a consistent schema.

### Evaluation

Comparing candidates against criteria.

Category, confidence, applicability, and evidence quality are **deterministic**, not model judgement. The LLM extracts structured facts; application code in `src/lib/research` applies the rules. See `BACKEND_EVALUATION_RULES.md`.

### Verification

Checking important claims and identifying uncertainty.

Do not hide uncertainty.

The UI should distinguish between:

- sourced facts,
- AI interpretation,
- assumptions,
- calculated or assigned scores.

---

## 11. Candidate Data Model

Canonical TypeScript types live in `src/types/research.ts`.

Import them from `@/types`. Do not create parallel Candidate, Source, or ResearchResult shapes.

The shared model covers:

- research request and structured problem definition
- evaluation criteria
- candidates (principle, applicability, evidence, scoring, verification)
- shortlist
- research metadata

Source-backed findings (`EvidenceItem`) stay separate from AI interpretation (`relevance`, assessments, scores).

---

## 12. Product Principles

### Technical credibility over AI spectacle

The product should appear useful to engineers.

### Structured results over chat history

Chat can support the workflow, but the final output must be structured.

### Transparency over false certainty

Explain assumptions and uncertainty.

### Breadth first, depth second

The system should first create a broad technology landscape, then allow deeper investigation.

### Cross-industry discovery

Finding transferable physical technologies outside the user's immediate sector is a core differentiator.

### Low interaction cost

Do not force users through long forms before research begins.

---

## 13. Team Development Principles

GitHub is the source of truth.

Team members may use:

- Cursor,
- Codex,
- Claude Code,
- VS Code,
- Python IDEs,
- other tools.

Tool choice is individual.

Code must integrate through the repository, not through proprietary editor state.

Prefer:

- small feature branches,
- clear commits,
- explicit interfaces,
- minimal dependencies,
- incremental integration.

Avoid large parallel rewrites of shared files.

---

## 14. Definition of Done for Hackathon

The prototype is successful if a user can:

1. enter the tank-cleaning challenge,
2. start the research,
3. see credible physical-engineering candidate technologies,
4. understand why they were selected,
5. distinguish Established / Adjacent / Exploratory solutions,
6. compare candidates,
7. open supporting sources,
8. understand important limitations and uncertainty.

The demo should tell a coherent story from problem to actionable technology landscape.
