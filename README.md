# ScoutBeyond

AI-assisted research tool for industrial R&D and engineering teams.

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

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```env
GEMINI_API_KEY=
FIRECRAWL_API_KEY=
FIRECRAWL_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For local webhook delivery, point `NEXT_PUBLIC_APP_URL` at a public HTTPS tunnel to your Next.js server.

### Supabase setup

1. Create the project and copy URL + anon key + service role key into `.env.local`.
2. Enable **Anonymous sign-ins** in Authentication providers.
3. Apply `supabase/migrations/20260312220000_live_research.sql` in the SQL editor (or via Supabase CLI).
4. Confirm Realtime is enabled for `research_runs`, `research_sources`, `research_events`, and `live_candidates`.

Health check: `/api/health/supabase`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |

## Notes

- The Flask prototype under `backend/` is deprecated and no longer used by the app.
- Do not show invented progress percentages or unverified source counts in live mode.
