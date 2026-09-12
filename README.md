# Technology Scanner

AI-assisted research tool for industrial R&D and engineering teams.

## Docs

| Document | Role |
| --- | --- |
| `PROJECT.md` | Product scope |
| `DESIGN.md` | UI guidance |
| `SEARCH_STRATEGY.md` | **Required** search process (breadth-first, diversified dimensions, two-pass, counter-check) |
| `BACKEND_EVALUATION_RULES.md` | Deterministic category / confidence / applicability rules |
| `FIRECRAWL_AND_LLM.md` | **Informational** — Firecrawl vs Gemini vs app roles |
| `AGENTS.md` | Agent / contributor conventions |

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Vercel
- Supabase
- Firecrawl (retrieval)
- Gemini (problem structuring and evidence extraction)

## Research architecture

```text
Firecrawl → retrieve
Gemini → structure + extract facts
src/lib/research → evaluate
Frontend → render
```

Search by **function and physical principle**, not only by application name. Breadth first, depth second. See `SEARCH_STRATEGY.md`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill in values as needed:

```bash
cp .env.example .env.local
```

Never commit real secrets. GitHub is the source of truth for code, not credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
FIRECRAWL_API_KEY=
GEMINI_API_KEY=
```

### Supabase

1. Create organization `ScoutBeyond` and project `scoutbeyond` in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API**.
3. Copy the project URL and `anon` `public` key into `.env.local`.
4. Add the same two variables in the Vercel project settings for production.

Check the connection at `/api/health/supabase`. A successful response looks like `{ "ok": true, "urlHost": "….supabase.co" }`.

### Firecrawl and Gemini

Add `FIRECRAWL_API_KEY` and `GEMINI_API_KEY` when wiring the research pipeline. Firecrawl retrieves sources; Gemini structures problems and extracts evidence; `src/lib/research` applies evaluation rules.

## Scripts

| Command         | Description              |
| --- | --- |
| `npm run dev`   | Start local dev server   |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
| `npm run test`  | Run unit tests           |

## Team workflow

- GitHub is the source of truth
- Prefer small feature branches (`feature/...`, `fix/...`)
- Keep commits coherent and scoped
