# Live Research Progress with Firecrawl Webhooks

## Purpose

This document defines how ScoutBeyond should communicate **real research progress** to the user while a research run is in progress.

The implementation must be based on **real backend events**, not mocked timers or fake progress messages.

Recommended architecture:

```text
User starts research
        │
        ▼
1. Firecrawl Search
   → returns candidate URLs, titles, snippets
        │
        ▼
2. Save search results to Supabase
        │
        ▼
3. Firecrawl Batch Scrape
   → async job with webhook
        │
        ├── batch_scrape.started
        ├── batch_scrape.page
        ├── batch_scrape.page
        ├── ...
        ├── batch_scrape.completed
        └── batch_scrape.failed
        │
        ▼
4. Webhook endpoint receives events
        │
        ▼
5. Persist source/progress events in Supabase
        │
        ▼
6. Trigger LLM analysis per scraped source
        │
        ▼
7. Save extracted candidates/evidence
        │
        ▼
8. Frontend receives updates via Supabase Realtime
```

The UI should update as sources are actually discovered, scraped, analysed, and counter-checked.

---

# 1. Key Design Decision

Do **not** use Firecrawl `/search` with full scraping as the only research step.

Reason:

- `/search` can return search results and optionally scrape them.
- But it does not provide granular per-result progress events suitable for a live UI.
- The user would see little or no real progress until the full response is returned.

Instead use:

```text
SEARCH
↓
URL LIST
↓
BATCH SCRAPE
↓
WEBHOOK EVENTS
↓
PER-SOURCE ANALYSIS
```

This creates observable, real progress.

---

# 2. Research Workflow

## Phase A — Search

Call Firecrawl Search to identify relevant sources.

Recommended output to retain:

```ts
type SearchResult = {
  url: string
  title?: string
  description?: string
}
```

After the search completes:

1. Save all search results.
2. Deduplicate URLs.
3. Set the research run status to `scraping`.
4. Start one or more Firecrawl Batch Scrape jobs.

Example real UI event:

```text
Found 24 potentially relevant sources.
```

This message must be based on the actual number of returned search results.

---

# 3. Batch Scrape

Use Firecrawl Batch Scrape for the selected URLs.

Conceptual request:

```json
{
  "urls": [
    "https://example.com/article-1",
    "https://example.org/article-2"
  ],
  "formats": ["markdown"],
  "webhook": {
    "url": "https://YOUR_DOMAIN/api/firecrawl/webhook",
    "metadata": {
      "researchRunId": "RUN_ID"
    },
    "events": [
      "started",
      "page",
      "completed",
      "failed"
    ]
  }
}
```

Always include an internal `researchRunId` in webhook metadata.

If required, also include:

```json
{
  "phase": "initial_research"
}
```

or:

```json
{
  "phase": "counter_check",
  "candidateId": "..."
}
```

This allows one webhook endpoint to handle multiple research phases.

---

# 4. Firecrawl Webhook Events

The implementation should support these Batch Scrape events:

```text
batch_scrape.started
batch_scrape.page
batch_scrape.completed
batch_scrape.failed
```

## `batch_scrape.started`

Use this to:

- store the Firecrawl job state
- mark scraping as started
- optionally show a high-level status update

Example:

```text
Reviewing 24 sources...
```

---

## `batch_scrape.page`

This is the most important event.

It is emitted when an individual URL has been processed.

On each `batch_scrape.page`:

1. Identify the `researchRunId`.
2. Extract:
   - URL
   - title
   - markdown/content
   - metadata
3. Upsert the source record.
4. Mark the source as `scraped`.
5. Increment real processed-source counters.
6. Trigger LLM analysis for this source.
7. Return HTTP `2xx` quickly.

Do **not** block the webhook response while waiting for a slow LLM call.

Conceptual flow:

```text
Webhook received
↓
Validate request
↓
Check idempotency
↓
Persist event/source
↓
Return 200
↓
Trigger source analysis
```

---

## `batch_scrape.completed`

Use this to:

- mark the scrape job as complete
- detect whether all sources have been processed
- move the run into the next phase

Possible next phase:

```text
analysing
↓
counter_checking
↓
synthesising
↓
completed
```

---

## `batch_scrape.failed`

Use this to:

- persist failure information
- mark affected job/source state
- continue the research run when possible
- avoid failing the entire run because a small number of URLs could not be scraped

Partial results are acceptable.

---

# 5. Webhook Endpoint

Recommended Next.js route:

```text
POST /api/firecrawl/webhook
```

Possible location:

```text
app/api/firecrawl/webhook/route.ts
```

Responsibilities:

```text
1. Validate Firecrawl signature
2. Parse event
3. Read researchRunId from metadata
4. Check whether event was already processed
5. Persist event
6. Update source/job/run state
7. Trigger downstream analysis where appropriate
8. Return 2xx quickly
```

The webhook route should stay small.

Do not place the complete research orchestration logic directly in the route.

Prefer service functions such as:

```ts
handleBatchStarted()
handleBatchPage()
handleBatchCompleted()
handleBatchFailed()
analyseSource()
updateResearchProgress()
```

---

# 6. Webhook Security

Verify Firecrawl webhook signatures.

Do not accept arbitrary unsigned requests to the production webhook endpoint.

Store the Firecrawl webhook secret in an environment variable, for example:

```text
FIRECRAWL_WEBHOOK_SECRET
```

Never expose this secret to the client.

Also keep:

```text
FIRECRAWL_API_KEY
```

server-side only.

---

# 7. Idempotency

Webhook delivery can be retried.

Therefore all handlers must be idempotent.

Store a unique webhook/event identifier where available.

Before processing:

```text
if event already processed:
    return 200
```

Database writes should preferably use `upsert`.

Never create duplicate:

- sources
- evidence records
- candidate records
- progress events

because the same webhook was delivered twice.

---

# 8. Suggested Supabase Data Model

Exact names may be adapted to the existing schema.

## research_runs

```text
id
status
phase
query
created_at
updated_at

sources_found
sources_scraped
sources_analysed
candidates_found
```

Suggested `status` values:

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

---

## research_sources

```text
id
research_run_id

url
title
description

scrape_status
analysis_status

markdown
source_metadata

created_at
updated_at
```

Suggested source states:

```text
discovered
scraping
scraped
analysing
analysed
failed
```

Add a uniqueness constraint such as:

```text
UNIQUE(research_run_id, url)
```

---

## research_events

Used for user-visible progress and debugging.

```text
id
research_run_id

event_type
message
payload

created_at
```

Example event types:

```text
search_started
search_completed

scrape_started
source_scraped

source_analysis_started
source_analysis_completed

candidate_found

counter_check_started
counter_check_completed

research_completed
research_failed
```

---

## candidates

Existing candidate model should be linked to:

```text
research_run_id
```

and preferably contain provenance:

```text
source_ids[]
```

or use a join table.

---

## evidence

Recommended:

```text
id
candidate_id
source_id

claim
evidence_text
evidence_type

created_at
```

This makes candidate cards traceable to real sources.

---

# 9. Per-Source LLM Analysis

Do not wait until all sources have been scraped before starting analysis.

Preferred flow:

```text
batch_scrape.page
↓
store source
↓
analyse source
↓
extract evidence / candidate signals
↓
store result
↓
frontend updates
```

This gives the user real progressive results.

The LLM analysis should extract structured data, for example:

```json
{
  "relevant": true,
  "relevanceScore": 0.84,
  "technologyCandidates": [
    {
      "name": "Ultrasonic cleaning",
      "summary": "...",
      "evidence": "...",
      "sourceUrl": "..."
    }
  ]
}
```

Candidate creation/merging must follow the project's separate scoring and classification rules.

The LLM should not invent progress states.

---

# 10. Supabase Realtime

The frontend should not directly listen to Firecrawl.

Recommended pattern:

```text
Firecrawl
↓
Next.js webhook
↓
Supabase
↓
Supabase Realtime
↓
Frontend
```

Subscribe to changes for the active `research_run_id`.

Useful subscriptions:

```text
research_runs
research_sources
research_events
candidates
```

For a hackathon MVP, subscribing to:

```text
research_runs
research_events
candidates
```

may be sufficient.

---

# 11. Progress Calculation

All progress numbers must be based on stored state.

Example:

```ts
scrapeProgress =
  sourcesFound > 0
    ? sourcesScraped / sourcesFound
    : 0
```

Possible UI:

```text
Reviewing sources
11 / 24 processed
```

Do not show fake percentage completion if the total number of steps is not known.

Prefer factual counters over arbitrary percentages.

Good:

```text
11 / 24 sources reviewed
```

Avoid:

```text
Research 67% complete
```

unless the percentage has a defined calculation.

---

# 12. Recommended User-Facing Progress States

Keep the UI concise.

Example:

```text
Searching the web...
```

Then:

```text
24 potentially relevant sources found.
```

Then:

```text
Reviewing sources
11 / 24
```

Then:

```text
7 potential solutions identified so far
```

Optional:

```text
Currently reviewing:
Fraunhofer IWS — Laser cleaning systems
```

Later:

```text
Counter-checking 5 promising solutions...
```

Finally:

```text
Research complete
18 sources analysed
6 solutions retained
```

These values must come from actual database state.

---

# 13. Candidate Cards Can Appear During Research

A key ScoutBeyond UX feature should be that candidate cards appear as soon as supporting evidence exists.

Example:

```text
Research in progress...

Potential solutions found

✓ Ultrasonic cleaning
✓ Cavitation cleaning
✓ Laser cleaning

Reviewing source 12 / 24
```

The results page does not need to wait for the entire run.

Candidate state may include:

```text
provisional
verified
rejected
```

Example:

```text
Ultrasonic cleaning
Status: provisional
Evidence: 2 sources
```

After counter-checking:

```text
Ultrasonic cleaning
Status: verified
Evidence: 4 sources
```

---

# 14. Counter-Checking Workflow

Promising candidates should trigger targeted secondary searches.

Example candidate:

```text
Ultrasonic cleaning
```

Possible generated queries:

```text
ultrasonic industrial tank cleaning limitations
ultrasonic cleaning large vessel scale up
ultrasonic cleaning food process equipment
```

Workflow:

```text
candidate selected
↓
generate counter-check queries
↓
Firecrawl Search
↓
Batch Scrape
↓
Webhooks
↓
per-source analysis
↓
update confidence / evidence / limitations
```

Use webhook metadata:

```json
{
  "researchRunId": "...",
  "phase": "counter_check",
  "candidateId": "..."
}
```

The same infrastructure therefore supports:

```text
initial research
adjacent search
counter-checking
verification
```

---

# 15. Error Handling

Research must be resilient.

A failed URL must not fail the whole research run.

Examples:

```text
24 URLs found
21 scraped successfully
3 failed
```

The research can still complete.

Store source-level failures.

Only mark the entire run as `failed` when the core workflow cannot continue.

Otherwise complete with partial results.

Possible final metadata:

```json
{
  "sourcesFound": 24,
  "sourcesScraped": 21,
  "sourcesFailed": 3,
  "sourcesAnalysed": 21
}
```

---

# 16. Do Not Use Fake Progress

Forbidden implementation patterns:

```ts
setTimeout(() => setMessage("Searching scientific papers..."), 2000)
setTimeout(() => setMessage("Exploring adjacent industries..."), 5000)
```

unless those messages correspond to a real backend state transition.

Do not fake:

- source counts
- research phases
- technologies being evaluated
- candidate discoveries
- percentage completion

Animations are fine.

The underlying state must be real.

---

# 17. Suggested Backend Modules

Possible structure:

```text
/lib/research/
    search.ts
    scrape.ts
    analyse-source.ts
    candidate-merging.ts
    counter-check.ts
    progress.ts

/lib/firecrawl/
    client.ts
    webhook.ts
    verify-signature.ts

/app/api/firecrawl/webhook/
    route.ts

/app/api/research/start/
    route.ts
```

Example responsibilities:

```text
search.ts
→ executes Firecrawl search

scrape.ts
→ starts batch scrape jobs

webhook.ts
→ parses Firecrawl webhook events

analyse-source.ts
→ performs per-source LLM extraction

progress.ts
→ updates real counters and research state

counter-check.ts
→ launches targeted validation research
```

---

# 18. Suggested Start-Research Flow

Conceptual pseudocode:

```ts
async function startResearch(input) {
  const run = await createResearchRun(input)

  await setRunStatus(run.id, "searching")

  const searchResults = await firecrawlSearch(input)

  const urls = deduplicate(searchResults)

  await saveSources(run.id, urls)

  await updateRun(run.id, {
    status: "scraping",
    sourcesFound: urls.length
  })

  await startBatchScrape({
    urls,
    metadata: {
      researchRunId: run.id,
      phase: "initial_research"
    }
  })

  return run
}
```

---

# 19. Suggested Webhook Flow

Conceptual pseudocode:

```ts
export async function POST(request: Request) {
  const rawBody = await request.text()

  verifyFirecrawlSignature(request.headers, rawBody)

  const event = JSON.parse(rawBody)

  if (await isDuplicateEvent(event)) {
    return new Response("OK", { status: 200 })
  }

  await saveWebhookEvent(event)

  switch (event.type) {
    case "batch_scrape.started":
      await handleBatchStarted(event)
      break

    case "batch_scrape.page":
      await handleBatchPage(event)
      break

    case "batch_scrape.completed":
      await handleBatchCompleted(event)
      break

    case "batch_scrape.failed":
      await handleBatchFailed(event)
      break
  }

  return new Response("OK", { status: 200 })
}
```

The exact event payload fields must be taken from the current Firecrawl SDK/API response types.

Do not hard-code assumptions that conflict with the installed Firecrawl version.

---

# 20. Suggested `handleBatchPage`

Conceptual flow:

```ts
async function handleBatchPage(event) {
  const runId = event.metadata.researchRunId

  const source = await upsertSource({
    researchRunId: runId,
    url: event.data.url,
    title: event.data.metadata?.title,
    markdown: event.data.markdown,
    scrapeStatus: "scraped"
  })

  await incrementScrapedCount(runId)

  await createResearchEvent({
    researchRunId: runId,
    eventType: "source_scraped",
    message: `Reviewed ${source.title ?? source.url}`
  })

  triggerSourceAnalysis(source.id)
}
```

Important:

`triggerSourceAnalysis()` must not make the webhook response unnecessarily slow.

Depending on the architecture, use:

- an internal async job mechanism
- background function support available in the deployment environment
- database-driven worker pattern
- another API endpoint invoked asynchronously

For the hackathon MVP, choose the simplest reliable option already supported by the current stack.

---

# 21. Acceptance Criteria

The implementation is complete when all of the following work:

### Search

- User starts a research run.
- A real Firecrawl Search request runs.
- Actual search-result count is stored.

### Batch Scrape

- Search-result URLs are passed to Firecrawl Batch Scrape.
- A webhook URL is configured.
- `researchRunId` is included in metadata.

### Webhook

- Endpoint receives real Firecrawl events.
- Signature is verified.
- Duplicate deliveries do not create duplicate data.
- Endpoint responds quickly.

### Source Progress

- `batch_scrape.page` creates or updates a source.
- Real processed-source count increases.
- Frontend receives the update.

### LLM Analysis

- Every successfully scraped source can be analysed independently.
- Relevant candidates/evidence can appear before the run completes.

### Realtime UI

The user can see real updates such as:

```text
Found 24 sources

8 / 24 reviewed

3 potential solutions found
```

without refreshing the page.

### Completion

- Research run reaches a final state.
- Partial scrape failures do not automatically invalidate the complete run.
- Final results remain traceable to source URLs.

---

# 22. Priority for Hackathon Implementation

## Must Have

1. Firecrawl Search
2. Batch Scrape
3. Firecrawl webhook endpoint
4. `batch_scrape.page` handling
5. Supabase persistence
6. Supabase Realtime updates
7. real source counter in UI
8. per-source LLM analysis
9. live candidate discovery

## Should Have

1. webhook signature verification
2. retry/idempotency protection
3. failed-source handling
4. candidate provisional/verified state
5. counter-check searches

## Nice to Have

1. visible current source title
2. research activity timeline
3. domain/source diversity indicators
4. multiple parallel search strategies
5. detailed research audit log

---

# 23. Core Product Principle

The research UI should expose **observable evidence of the actual research process**.

The implementation should make it possible to truthfully say:

> Everything shown during the research run reflects real sources being found, processed, analysed, and verified.

This is an important ScoutBeyond differentiator.

The product should feel transparent and traceable rather than like a black-box LLM answer.
