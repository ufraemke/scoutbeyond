# ScoutBeyond

AI-assisted technology scouting for industrial R&D and engineering teams.

ScoutBeyond turns a physical engineering challenge into a structured,
source-backed technology landscape. Users can inspect evidence, compare
solutions from established and adjacent applications, create a shortlist, and
export a final scouting brief.

## Current status

The main live journey is implemented:

1. Enter an engineering challenge. Short, vague requests receive a focused
   clarification prompt.
2. Review and edit the generated brief, assumptions, constraints, search
   dimensions, and optional research priorities.
3. Follow real Firecrawl/Supabase research progress while candidates appear.
4. Select candidates during research and inspect all linked evidence.
5. Compare selected candidates and choose which ones to investigate further.
6. Review the final brief, copy it as Markdown, or print/save it as PDF.

Comparison remains available while research is running and is clearly marked
as preliminary. Failed individual sources are shown as partial-result warnings
and do not have to block the entire run.

## Docs

| Document | Role |
| --- | --- |
| `PROJECT.md` | Product scope |
| `DESIGN.md` | UI guidance |
| `SEARCH_STRATEGY.md` | Required search process |
| `BACKEND_EVALUATION_RULES.md` | Deterministic evaluation rules |
| `FIRECRAWL_WEBHOOK_LIVE_RESEARCH.md` | Live progress requirements |
| `LIVE_RESEARCH_IMPLEMENTATION.md` | Mandatory live-research build contract |
| `AGENTS.md` | Agent / contributor conventions |

## Stack

- Next.js (App Router)
- React + TypeScript
- Supabase (persistence + Realtime)
- Firecrawl (search + batch scrape webhooks)
- Gemini (problem structuring + evidence extraction)
- Deterministic rules in `src/lib/research`

## Live research architecture

```text
User challenge
  → POST /api/research/refine (Gemini reflection only)
  → user reviews and edits the structured brief
  → POST /api/research/start with the confirmed brief
  → Firecrawl Search (diversified queries)
  → Persist sources in Supabase
  → Firecrawl Batch Scrape + signed webhook
  → Per-source Gemini extraction
  → Deterministic category / confidence / applicability
  → Supabase Realtime → /research/[runId]
```

Prepared tank-cleaning demo data is available explicitly at `/research/demo` and is labeled as a prepared dataset.

The live result page continues from the landscape through comparison,
shortlisting, and export:

```text
/research/[runId]
  → live progress + candidate landscape
  → evidence detail
  → comparison
  → shortlist
  → final brief / PDF
```

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```env
# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=30000

# Firecrawl
FIRECRAWL_API_KEY=
FIRECRAWL_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For local webhook delivery, point `NEXT_PUBLIC_APP_URL` at a public HTTPS tunnel to your Next.js server.

In production, `NEXT_PUBLIC_APP_URL` must be the deployed HTTPS origin, for
example `https://scoutbeyond.vercel.app`, without a trailing slash.

### Supabase setup

1. Create a Supabase project.
2. Enable **Anonymous sign-ins** under Authentication settings.
3. Copy the project URL, public anon/publishable key, and server-only service
   role/secret key into `.env.local` and the corresponding deployment
   environment variables.
4. Run the migrations in timestamp order:
   - `supabase/migrations/20260312220000_live_research.sql`
   - `supabase/migrations/20260913014000_live_evidence_realtime.sql`
5. Confirm the `supabase_realtime` publication contains:
   - `research_runs`
   - `research_sources`
   - `research_events`
   - `live_candidates`
   - `live_evidence`
6. Keep Row Level Security enabled. The migration policies restrict each
   anonymous visitor to their own research runs.

Health check: `/api/health/supabase`.

The second migration also prevents duplicate counter-check jobs for the same
candidate. It is required when updating an existing database, not only for a
new installation.

### Production checklist

- Apply both Supabase migrations before deploying the new frontend.
- Set every environment variable in the production deployment.
- Set `NEXT_PUBLIC_APP_URL` to the production origin.
- Configure Firecrawl to use the same webhook secret as
  `FIRECRAWL_WEBHOOK_SECRET`.
- Confirm `POST /api/firecrawl/webhook` returns `2xx`.
- Run one live test and confirm candidates/evidence update without refreshing.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |

## Notes

- The Flask prototype under `backend/` is deprecated and no longer used by the app.
- `prototype.html` is a design reference, not application runtime code.
- Do not show invented progress percentages or unverified source counts in live mode.
- Candidate cards show two compact evidence previews. The detail view shows all
  distinct sources and their findings.
- `POST /api/research/[runId]/resume` schedules a small recovery batch without
  holding the browser request open for long-running Gemini work.
