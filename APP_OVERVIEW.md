# ScoutBeyond: How the Application Works

This document explains the current ScoutBeyond implementation: the user flow,
search strategy, system architecture, data flow, evaluation rules, live
progress model, security, technology stack, and known limitations.

ScoutBeyond is a technology-scouting application for industrial R&D and
engineering teams. It turns a physical engineering challenge into a
source-backed landscape of solution principles from the user's own field,
adjacent applications, other industries, and emerging research.

The central design principle is:

> Retrieve broadly, cluster by physical principle, investigate selectively,
> counter-check, and evaluate transparently.

## 1. What the Product Does

The application helps a user:

1. describe an industrial or engineering problem in plain language;
2. clarify the desired outcome when the request is too vague;
3. review and edit a structured research brief;
4. search the web across deliberately different technical perspectives;
5. retrieve and analyse real source content;
6. extract physical technology candidates and source-backed findings;
7. classify candidates with deterministic rules;
8. see candidates appear while research is still running;
9. compare selected candidates and create a shortlist; and
10. copy a Markdown brief or print/save the final result as PDF.

The application is intentionally focused on **physical engineering
solutions**. Relevant results include equipment, mechanical principles,
materials, manufacturing processes, physical sensing, automation, robotics,
and process-control mechanisms.

Software-only products, generic analytics, business models, organizational
changes, pharmaceutical discovery, and formulations are outside the intended
scope.

## 2. User Journey

### Step 1: Problem intake

The home page at `/` accepts a natural-language engineering challenge.

The browser performs a small local clarification check. Very short or vague
requests receive one focused question about the main outcome, such as reducing
resources, reducing cycle time, or improving performance.

The client also creates an invisible anonymous Supabase session. There is no
login screen in the hackathon flow.

### Step 2: Research brief

`POST /api/research/refine` asks Gemini to turn the challenge into a structured
problem containing:

- a precise problem statement;
- the current solution, when known;
- goals;
- constraints;
- explicit assumptions;
- unknowns;
- search dimensions; and
- optional preferences for industry focus and evidence types.

This step does **not** call Firecrawl. The user can edit the brief before any
web research starts.

If Gemini is unavailable or returns invalid data, the application creates a
basic local fallback brief and labels it as a fallback.

### Step 3: Live technology discovery

After confirmation, `POST /api/research/start` creates a persisted research
run, generates diversified queries, calls Firecrawl Search, saves deduplicated
sources, and starts an asynchronous Firecrawl Batch Scrape.

The user is redirected to `/research/[runId]`. The page displays factual run
state from Supabase and receives live database updates. Candidate cards appear
as individual sources are scraped and analysed; the user does not have to wait
for the complete run.

### Step 4: Comparison and shortlist

The user selects at least two candidates and compares:

- relevance;
- applicability;
- maturity;
- potential benefits;
- limitations;
- uncertainty; and
- evidence quantity and quality.

Comparison is available while research is running, but is visibly marked as
preliminary. The shortlist selection currently lives in browser component
state and is not persisted.

### Step 5: Final brief

The selected shortlist is converted into a report containing the research
problem, goals, candidates, evidence counts, trade-offs, recommended next
investigations, and a source bibliography.

The report can be copied as Markdown or printed/saved as PDF. There is
currently no research-history screen, so users should export a result they
want to retain outside the app.

## 3. End-to-End Architecture

```text
Browser
  │
  ├─ anonymous Supabase session
  │
  ├─ POST /api/research/refine
  │      └─ Gemini structures the problem
  │
  ├─ user reviews and edits the brief
  │
  └─ POST /api/research/start
         │
         ├─ create research run in Supabase
         ├─ Gemini generates diversified queries
         ├─ Firecrawl Search returns URLs
         ├─ canonicalize and deduplicate URLs
         ├─ persist discovered sources
         └─ start Firecrawl Batch Scrape
                    │
                    └─ signed webhook events
                           │
                           ▼
                 POST /api/firecrawl/webhook
                           │
                           ├─ verify signature
                           ├─ reject duplicate delivery
                           ├─ persist page and progress
                           ├─ return HTTP 2xx quickly
                           └─ schedule Gemini analysis with after()
                                      │
                                      ├─ validate extraction with Zod
                                      ├─ run deterministic evaluation
                                      ├─ merge candidate by principle
                                      └─ save evidence and candidate
                                                 │
                                                 ▼
                                      Supabase Realtime
                                                 │
                                                 ▼
                                      /research/[runId]
```

The important separation of responsibilities is:

- **Firecrawl retrieves** search results and page content.
- **Gemini structures and extracts** facts from text.
- **Zod validates** untrusted structured model and provider data.
- **Application rules evaluate** category, confidence, applicability, and
  evidence quality.
- **Supabase persists and broadcasts** run state.
- **React presents** progress, evidence, comparison, and export.

## 4. How Search Is Spread

ScoutBeyond does not ask Gemini for one undifferentiated list of similar
queries. Search is deliberately spread across five dimensions.

### Direct application

Target: 2–3 queries.

These look for known equipment and established solutions used directly for
the stated problem.

### Physical principle

Target: 2–3 queries.

These search for the underlying function or mechanism instead of repeating
the application name. Examples include mechanical, acoustic, thermal, or
other physical methods for achieving the required function.

This is the most important mechanism for finding non-obvious solutions.

### Adjacent application

Target: 1–2 queries.

These look for the same physical problem in related equipment, processes, or
operating contexts.

### Cross-industry transfer

Target: 1–2 queries.

These search industries that may solve a similar physical problem differently,
for example aerospace, semiconductor manufacturing, wastewater treatment,
robotics, precision cleaning, or other problem-dependent domains.

### Emerging research

Target: 1–2 queries.

These look for experimental, less mature, or unconventional physical
approaches.

The generated set must contain 6–14 queries and pass a diversity validator.
If Gemini fails or produces an invalid mix, the local fallback creates eight
queries:

- 2 direct;
- 2 physical-principle;
- 1 adjacent-application;
- 2 cross-industry; and
- 1 emerging query.

User research preferences can emphasize same-industry or beyond-industry
search and can add terms for papers, patents, industrial cases, or technical
documentation. Preferences do not remove any required search dimension.

### First-pass retrieval

The current implementation runs each diversified query through Firecrawl
Search with a limit of four results per query. It then:

1. canonicalizes each URL;
2. removes duplicate URLs across all queries;
3. retains the first query and dimension that discovered a URL;
4. stores the resulting source rows; and
5. submits all unique URLs to Batch Scrape.

Individual failed queries do not stop the run if at least one query succeeds.
If every query fails, the run fails with the most useful provider error
available, including explicit messages for authentication, credits, and rate
limits.

The search is breadth-first: the goal is distinct solution principles, not
many pages repeating one familiar solution.

## 5. Retrieval and Live Progress

### Why Search and Batch Scrape are separate

Firecrawl Search provides candidate URLs, titles, and descriptions. Batch
Scrape then retrieves page Markdown asynchronously and emits granular events:

- `batch_scrape.started`
- `batch_scrape.page`
- `batch_scrape.completed`
- `batch_scrape.failed`

This separation makes real per-source progress observable.

### Webhook processing

`POST /api/firecrawl/webhook`:

1. reads the raw request body;
2. verifies `X-Firecrawl-Signature` with HMAC-SHA256;
3. validates and parses the payload;
4. creates a stable delivery key;
5. claims the delivery in `webhook_deliveries`;
6. updates the relevant job, source, event, and counters;
7. schedules source analysis with Next.js `after()`; and
8. responds without waiting for Gemini.

Page-delivery identity uses the Firecrawl job ID, event type, page scrape ID
or canonical URL, and a payload-hash fallback. This prevents webhook retries
from duplicating progress.

### Real progress only

Displayed phases correspond to persisted run states:

```text
queued
→ searching
→ scraping
→ analysing
→ counter_checking
→ synthesising
→ completed
```

`failed` is a terminal alternative.

The UI shows stored values such as sources found, retrieved, analysed, failed,
and candidates found. The progress element uses completed or failed source
analysis as its numerator and the stored source count as its denominator.

There are no timer-driven research phases, invented source titles, fabricated
candidate counts, or arbitrary completion percentages. UI debounce timers are
used only to combine rapid database notifications before fetching a fresh
snapshot; they do not create research progress.

### Realtime client behavior

The live page:

1. fetches a complete snapshot from `GET /api/research/[runId]`;
2. subscribes to filtered Postgres changes for the active run;
3. watches runs, sources, events, candidates, and evidence;
4. fetches a new complete snapshot after a change; and
5. refetches after reconnect because Postgres Changes does not replay missed
   events.

## 6. Per-Source Analysis

Each successfully scraped page is analysed independently.

The extractor sends at most the first 12,000 characters of page Markdown to
Gemini with the research problem and source metadata. Gemini is instructed to:

- reject out-of-scope content;
- identify physical solution principles;
- extract names, mechanisms, summaries, relevance, industries, benefits,
  limitations, uncertainties, and maturity wording;
- extract source-backed findings and optional exact excerpts;
- state whether findings support, contradict, or are neutral; and
- return structured inputs for deterministic evaluation.

Gemini is explicitly told **not** to choose Established, Adjacent, or
Exploratory and not to invent URLs.

The returned JSON is parsed with Zod. Invalid structured output causes that
source analysis to fail visibly instead of silently accepting malformed data.

Sources without usable Markdown are marked failed/skipped and do not stop
partial results from remaining available.

## 7. Candidate Deduplication

Candidates are stored as physical solution principles rather than supplier
products.

The principle text is normalized and used with the run ID as a unique key.
When multiple sources identify the same normalized principle, the application:

- keeps one candidate row;
- combines unique benefits, limitations, uncertainties, industries, and
  physical mechanisms;
- adds each source-backed finding as evidence; and
- resolves concurrent insert races by retrying against the row that won the
  unique-key race.

When category observations differ, the current merge preference is:

```text
Established > Adjacent > Exploratory
```

The latest incoming applicability, confidence, evidence quality, maturity,
and classification-input objects replace the existing corresponding values.
This behavior is important when interpreting current results; see the
limitations section.

## 8. How Evaluation Works

The application keeps four concepts separate:

- **Category:** relationship to the target problem.
- **Confidence:** certainty supported by evidence.
- **Applicability:** plausible transfer to this specific problem.
- **Evidence quality:** strength of the supporting material.

The LLM extracts the structured facts. TypeScript functions in
`src/lib/research` apply the rules.

### Category

Inputs:

```text
physical principle relevant
same purpose: yes / partial / no
comparable conditions: yes / partial / no
industrial use demonstrated
number of independent applications
transfer required: low / medium / high
```

Rules:

- **Established** when the physical principle is relevant, industrial use is
  demonstrated, the purpose is the same, and conditions are not explicitly
  non-comparable.
- **Adjacent** when the principle is relevant, industrial use is demonstrated,
  and meaningful transfer is required.
- **Exploratory** for every other case, including missing practical evidence
  or substantial unresolved transfer.

Category describes fit to the target problem, not general technical maturity.
A commercially mature technology can still be Adjacent.

### Confidence

- **High:** at least two independent sources, at least one strong technical
  source, direct evidence, and no contradictory evidence.
- **Medium:** at least two evidence items and no contradiction.
- **Low:** all other cases.

### Applicability

- **Uncertain:** the physical principle is irrelevant/unclear, or key
  conditions remain unresolved.
- **High:** same purpose, comparable conditions, and low transfer requirement.
- **Low:** different purpose or high transfer requirement.
- **Medium:** partial or non-comparable conditions, moderate transfer, or any
  remaining plausible middle case.

### Evidence quality

- **Weak:** contradictory evidence exists.
- **Strong:** at least two independent sources, strong technical evidence, and
  direct support.
- **Moderate:** at least two findings, or one strong technical source with
  direct support.
- **Weak:** all other cases.

### Evidence remains separate from sources

A source is the document origin. An evidence item records what the source
supports:

```text
candidate
  └─ evidence item
       ├─ finding
       ├─ relevance to the candidate
       ├─ supports / contradicts / neutral
       ├─ confidence
       ├─ optional exact excerpt
       └─ source URL and title
```

This separation makes candidate reasoning traceable.

### Numeric scoring

The shared domain model contains types for criterion assessments and an
optional 0–100 overall score, but the current live pipeline does **not**
calculate or display a weighted numeric overall score. The implemented live
comparison is evidence-based and uses category, applicability, maturity,
benefits, limitations, uncertainty, confidence, and evidence quality.

## 9. Counter-Checking and Completion

After all initial sources have reached a terminal analysis state, the system
selects up to three provisional candidates for counter-checking.

For each candidate, Gemini generates 2–3 queries looking for:

- limitations;
- failure modes;
- scale-up issues; and
- contradictory evidence.

If Gemini fails, deterministic fallback queries are used. Firecrawl Search
returns up to three results per query, unique URLs are added to the same run,
and another Batch Scrape starts with:

```json
{
  "researchRunId": "...",
  "phase": "counter_check",
  "candidateId": "..."
}
```

A database uniqueness constraint prevents duplicate counter-check jobs for
the same run and candidate.

When no work remains, the run enters `synthesising`, remaining provisional
candidates are changed to `verified`, and the run becomes `completed`.

In the current implementation, `verified` is primarily a workflow state
meaning the candidate survived the completed run. It should not be interpreted
as independent certification of every claim.

## 10. Persistence Model

Supabase PostgreSQL stores the live workflow in these tables:

- `research_runs`: owner, structured problem, status, phase, counters, queries,
  warnings, and timestamps.
- `research_sources`: canonical URL, discovery context, scrape content,
  scrape state, analysis state, and source-level errors.
- `scrape_jobs`: Firecrawl batch job ID, phase, candidate link, URLs, and job
  status.
- `research_events`: user-visible progress and audit messages.
- `webhook_deliveries`: webhook idempotency claims and processing timestamps.
- `live_candidates`: normalized candidate principles and assessments.
- `live_evidence`: findings that connect a candidate to a source.

Important uniqueness constraints include:

- one canonical source URL per research run;
- one normalized principle per research run;
- one Firecrawl job row per provider job ID; and
- one counter-check job per run and candidate.

Run counters are derived from stored source and candidate rows rather than
blindly incremented on every webhook delivery.

## 11. Authentication and Security

The browser signs in through Supabase Anonymous Auth. Each run stores the
anonymous user's ID as `owner_id`.

Row Level Security restricts authenticated visitors to selecting their own
runs and associated sources, jobs, events, candidates, and evidence. API
routes also compare the requested run owner with the current user before
returning snapshots or scheduling recovery.

Normal browser/server session clients use the public Supabase key. Trusted
backend repository and webhook operations use the server-only Supabase service
role. The service-role key, Firecrawl API key, webhook secret, and Gemini key
must never reach the client.

Firecrawl webhook requests are accepted only after signature verification on
the raw body. Duplicate deliveries are safe to acknowledge without processing
again.

## 12. Failure and Recovery Behavior

The system is designed to preserve partial research:

- One failed search query does not fail other dimensions.
- One failed or empty source does not fail the complete run.
- Source failures are persisted and shown to the user.
- Duplicate webhooks do not inflate counters.
- Invalid model output fails only the affected source analysis.
- Realtime disconnects cause a snapshot refetch.
- `POST /api/research/[runId]/resume` finds stale queued/running analyses and
  schedules a recovery batch.

The recovery endpoint currently processes at most two sources per request.
By default, an analysis is considered stale after 60 seconds.

The complete run is marked failed only when the core startup workflow cannot
continue, such as total retrieval failure or inability to start Batch Scrape.

## 13. Live Mode and Prepared Demo Mode

Live mode uses real Gemini, Firecrawl, Supabase, webhooks, and Realtime data.

The home page also offers a clearly labeled tank-cleaning prepared dataset for
UI walkthroughs. It does not call the live research pipeline and its references
are explicitly described as illustrative rather than verified live research.

The current `/research/demo` route redirects to `/`; prepared mode is entered
through the “Load Tank Cleaning Demo Challenge” action on the home page.

Prepared data must never be presented as live progress.

## 14. Technology Stack

### Application

- Next.js 16.3.5 with the App Router
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4

### Data and authentication

- Supabase PostgreSQL
- Supabase Anonymous Auth
- Supabase Row Level Security
- Supabase Realtime Postgres Changes
- `@supabase/ssr` and `@supabase/supabase-js`

### Research and AI

- Firecrawl v2 REST API for search and Batch Scrape
- Firecrawl signed webhooks for per-page progress
- Gemini REST API for problem reflection, query generation, source extraction,
  and counter-check query generation
- Zod 4 for runtime schema validation
- deterministic TypeScript evaluation functions

### Quality and deployment

- Vitest for tests
- ESLint with the Next.js configuration
- Vercel-compatible route handlers and `after()` background work

The old Flask code under `backend/` is deprecated and is not part of the
runtime architecture.

## 15. Important Routes and Modules

Routes:

- `/`: challenge input, brief review, and prepared-demo flow.
- `/research/[runId]`: live progress, landscape, comparison, and final brief.
- `POST /api/research/refine`: structure a challenge without web retrieval.
- `POST /api/research/start`: start the persisted live research workflow.
- `GET /api/research/[runId]`: return an owner-checked full run snapshot.
- `POST /api/research/[runId]/resume`: recover stale source analysis.
- `POST /api/firecrawl/webhook`: receive signed Batch Scrape events.
- `GET /api/health/supabase`: Supabase configuration health check.

Core modules:

- `src/types/research.ts`: shared domain and live-run contracts.
- `src/lib/research/query-generation.ts`: reflection and query generation.
- `src/lib/research/search.ts`: query diversity validation and fallback.
- `src/lib/research/start-research.ts`: startup orchestration.
- `src/lib/firecrawl/client.ts`: Firecrawl Search and Batch Scrape requests.
- `src/lib/research/webhook-handlers.ts`: idempotent webhook processing.
- `src/lib/gemini/extract-from-source.ts`: per-source extraction prompt.
- `src/lib/research/analyse-source.ts`: extraction-to-evaluation pipeline.
- `src/lib/research/candidate-merging.ts`: principle-based candidate merge.
- `src/lib/research/counter-check.ts`: targeted secondary research.
- `src/lib/research/repository.ts`: Supabase persistence and snapshots.
- `src/lib/research/progress.ts`: state transitions and factual progress.
- `src/components/research/use-research-run.ts`: snapshot and Realtime client.

## 16. Environment and Local Setup

Required environment variable names are documented in `.env.example`:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=30000

FIRECRAWL_API_KEY=
FIRECRAWL_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For local live research, `NEXT_PUBLIC_APP_URL` must be a publicly reachable
HTTPS tunnel URL so Firecrawl can call the webhook. In production it must be
the deployed HTTPS origin without a trailing slash.

Supabase Anonymous Sign-ins must be enabled, and both migrations in
`supabase/migrations/` must be applied in timestamp order.

Common commands:

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## 17. Current Limitations

The following are important properties of the current prototype:

1. **No persisted shortlist or history.** Candidate selection, shortlist, and
   final-report composition are client-side state.
2. **No live weighted overall score.** Score types exist, but the live pipeline
   has not implemented criterion weighting or a 0–100 result.
3. **Candidate aggregate assessments are last-write based.** Evidence is
   accumulated, but confidence, applicability, evidence quality, maturity, and
   classification facts are not recomputed across all merged evidence.
4. **Category merging favors the strongest category.** A later Established
   observation can promote a candidate; later weaker observations do not
   demote it.
5. **Counter-check results use the general source extractor.** The scrape job
   carries a candidate ID, but extracted findings are still merged through the
   general normalized-principle path.
6. **Final verification is coarse.** Completion changes remaining provisional
   candidates to verified; the code does not currently set candidates to
   rejected based on a dedicated final synthesis decision.
7. **Background work is bounded.** Next.js `after()` is suitable for the
   prototype but not a durable job queue. The resume endpoint is the recovery
   path for interrupted analysis.
8. **Source authority is not independently verified.** The prototype does not
   maintain a comprehensive external source-reputation database or
   independently verify every publication claim.
9. **Search is intentionally not exhaustive.** The product prioritizes useful
   coverage and transparent uncertainty over claiming complete literature or
   patent coverage.

These limitations are why source links, uncertainty, workflow state, and
partial-result warnings remain visible throughout the interface.

## 18. Testing and Verification

The repository includes Vitest coverage for important live-research behavior,
including:

- query diversity and fallback generation;
- deterministic evaluation rules;
- legal run-state transitions;
- Firecrawl error handling;
- webhook signature verification and realistic payload handling;
- stable webhook delivery-key generation;
- progress derived from persisted counters;
- candidate-principle normalization;
- Zod rejection of invalid extraction;
- the asynchronous webhook analysis contract;
- startup orchestration and refine/resume routes; and
- guards against fake progress sequences.

Before deployment, run:

```bash
npm run test
npm run lint
npm run build
```

A real end-to-end verification also requires a public HTTPS webhook and should
confirm that signatures are accepted, source counters match the database,
candidates appear before completion, refresh/reconnect restores state, partial
failures remain visible, and every retained finding links to a real source URL.

## 19. Core Trust Boundary

The most important architectural rule is:

> The model may extract and interpret facts, but it does not get final control
> over classification or progress.

Research progress comes from persisted backend events. Candidate assessments
come from explicit TypeScript rules applied to validated structured facts.
Evidence remains linked to retrieved source URLs. This is what makes
ScoutBeyond a traceable engineering research workflow instead of a generic
chat response.
