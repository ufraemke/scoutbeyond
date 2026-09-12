# Live Research Implementation Contract

## Purpose

This document is the **mandatory build contract** for ScoutBeyond live research progress.

It turns the agreed architecture into enforceable rules for agents and developers.

Read together with:

1. `FIRECRAWL_WEBHOOK_LIVE_RESEARCH.md` — product and technical requirements for real progress
2. `SEARCH_STRATEGY.md` — diversified query generation
3. `BACKEND_EVALUATION_RULES.md` — deterministic category / confidence / applicability / evidence quality
4. `DESIGN.md` — UI constraints for progress and landscape
5. `PROJECT.md` — product scope and definition of done

Do **not** invent an alternate live-research architecture.

---

## Non-goals for this document

This file does **not** implement:

- database migrations,
- API routes,
- Firecrawl or Gemini clients,
- UI components.

It defines **how** those must be built when implemented.

---

## Canonical architecture

```text
User starts research
        │
        ▼
1. Firecrawl Search
   → candidate URLs, titles, snippets
        │
        ▼
2. Persist search results in Supabase
        │
        ▼
3. Firecrawl Batch Scrape
   → async job with webhook
        │
        ├── batch_scrape.started
        ├── batch_scrape.page
        ├── batch_scrape.completed
        └── batch_scrape.failed
        │
        ▼
4. Signed webhook endpoint receives events
        │
        ▼
5. Persist source / progress events in Supabase
        │
        ▼
6. Trigger per-source LLM analysis asynchronously
        │
        ▼
7. Save extracted candidates / evidence
        │
        ▼
8. Frontend receives updates via Supabase Realtime
```

Do **not** use Firecrawl `/search` with full scraping as the only research step. That path does not provide granular per-result progress.

---

## Hard rules

### Progress must be real

Forbidden:

- `setTimeout`-driven phase messages
- hardcoded progress sequences
- invented source counts
- invented candidate counts
- arbitrary “Research 67% complete” percentages without a defined numerator and denominator
- fake “currently reviewing” titles not tied to stored sources

Allowed:

- subtle animation / spinner
- factual counters derived from database state
- phase labels that map 1:1 to `research_runs.status`

### Evaluation remains deterministic

Gemini extracts structured facts only.

Application code in `src/lib/research` assigns:

- category (Established / Adjacent / Exploratory),
- confidence,
- applicability,
- evidence quality.

Do **not** ask the model to classify candidates.

### Webhook must stay fast

`POST /api/firecrawl/webhook` must:

1. verify signature on the **raw body**,
2. check idempotency,
3. persist event / source / job state,
4. schedule analysis without awaiting the LLM,
5. return HTTP `2xx` quickly.

### Partial failure is normal

A failed URL must not fail the whole research run.

Only mark the run `failed` when the core workflow cannot continue.

### Access model

Use invisible Supabase anonymous sign-in.

Store `owner_id` on each research run.

RLS must ensure each visitor can read only their own runs.

No login screen for the hackathon demo.

---

## Required implementation slices

When building live research, implement in this order.

### 1. Durable live-run storage and private access

Add Supabase schema for at least:

| Table | Purpose |
| --- | --- |
| `research_runs` | run status, phase, counters, owner |
| `research_sources` | discovered / scraped / analysed URLs |
| `scrape_jobs` | Firecrawl batch-job linkage and phase metadata |
| `research_events` | user-visible progress timeline |
| `webhook_deliveries` | idempotency keys for webhook retries |
| candidates / evidence / source links | traceable results |

Hard constraints:

- `UNIQUE(research_run_id, url)` on sources
- stable webhook `delivery_key`
- Firecrawl payload `id` is the **batch job id**, not a unique page-delivery id
- page-delivery identity = job id + event type + page `scrapeId` / canonical URL, with payload-hash fallback
- Realtime enabled for run / event / candidate tables
- extend `src/types/research.ts` with live-run types; keep `ResearchResult` as the final artifact
- server-only admin Supabase client
- env placeholders: `SUPABASE_SERVICE_ROLE_KEY`, `FIRECRAWL_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

Suggested run statuses:

```text
queued
searching
scraping
analysing
counter_checking
synthesising
completed
failed
```

Suggested source statuses:

```text
discovered
scraping
scraped
analysing
analysed
failed
```

### 2. Start / search / scrape path

Add thin `POST /api/research/start` plus services under `src/lib/research`.

Required behavior:

1. structure the problem
2. generate diversified search dimensions from `SEARCH_STRATEGY.md`
3. run real Firecrawl Search
4. deduplicate URLs
5. persist discovered sources
6. set `sources_found` from stored rows
7. start Batch Scrape with webhook metadata:

```json
{
  "researchRunId": "...",
  "phase": "initial_research"
}
```

Validate current Firecrawl response shapes at runtime. Do not hard-code stale payload assumptions.

### 3. Signed idempotent webhooks

Add `src/app/api/firecrawl/webhook/route.ts` as a thin dispatcher.

Responsibilities:

1. read raw body
2. verify `X-Firecrawl-Signature` as HMAC-SHA256 with timing-safe comparison
3. parse and validate payload
4. claim delivery key
5. dispatch to focused handlers
6. schedule analysis with `after()` or equivalent
7. return `2xx`

Handlers:

- `handleBatchStarted`
- `handleBatchPage`
- `handleBatchCompleted`
- `handleBatchFailed`

Counter rules:

- derive counters from source / candidate rows or guarded state transitions
- never blind-increment on every webhook delivery
- duplicate page events must not inflate progress

### 4. Per-source analysis and candidates

Required behavior:

1. persist `analysis_status` before scheduling work
2. extract structured facts with Gemini
3. validate with Zod
4. apply deterministic evaluation rules
5. merge candidates by normalized physical principle
6. attach every claim to evidence and a source URL
7. expose candidates as `provisional` while research continues

Because `after()` is bounded by route duration, also provide a resumable retry path for stale / incomplete analysis.

Counter-check reuse:

```json
{
  "researchRunId": "...",
  "phase": "counter_check",
  "candidateId": "..."
}
```

After counter-check, move retained candidates to `verified` or `rejected` before final synthesis.

### 5. Realtime progress UI

Required UI:

- challenge input on `/`
- run view at `/research/[runId]`
- Realtime hook that:
  1. fetches a full snapshot first,
  2. subscribes to filtered run / event / candidate changes,
  3. refetches on reconnect (Postgres Changes does not replay missed events)

Required display:

- factual phase text
- `reviewed / found` counters when total is known
- connection / error state
- three-column Established / Adjacent / Exploratory landscape
- candidates appearing during research

Accessibility:

- `aria-live="polite"`
- visible text labels for category and status
- real progress element only when source total is known
- keep partial results visible when individual sources fail

### 6. Verification contract

Before calling live research “done”, all of the following must hold:

#### Automated

- signature verification tests
- webhook fixture tests using realistic Firecrawl payloads
- delivery-key idempotency tests
- legal state-transition tests
- counter derivation tests
- candidate merging tests
- Zod rejection tests
- deterministic evaluation regression tests
- guard test rejecting timer-based status sequencing and hard-coded progress counts / percentages
- route tests proving duplicate page events create one source and the webhook does not await Gemini

#### Manual / staging

With a publicly reachable HTTPS webhook:

- Firecrawl signatures accepted
- database counters match UI
- candidates appear before run completion
- partial scrape failures do not wipe the run
- refresh restores state
- reconnect refetches missed updates
- every retained candidate remains traceable to source URLs
- counter-checking updates limitations / evidence
- run reaches a terminal completed state with partial results allowed

---

## Suggested module layout

```text
/supabase/migrations/
    ...live_research.sql

/src/lib/firecrawl/
    client.ts
    types.ts
    webhook.ts
    verify-signature.ts

/src/lib/research/
    start-research.ts
    search.ts
    scrape.ts
    webhook-handlers.ts
    analyse-source.ts
    candidate-merging.ts
    progress.ts
    counter-check.ts
    repository.ts

/src/lib/gemini/
    client.ts
    extract-from-source.ts

/src/lib/supabase/
    admin.ts

/src/app/api/research/start/
    route.ts

/src/app/api/firecrawl/webhook/
    route.ts

/src/app/research/[runId]/
    page.tsx

/src/components/research/
    ...
```

Exact names may vary. Responsibilities must not.

---

## Acceptance summary

Live research is correctly implemented only when an engineer can truthfully say:

> Everything shown during the research run reflects real sources being found, processed, analysed, and verified.

If the UI can look complete without Firecrawl webhooks updating Supabase, the implementation is wrong.
