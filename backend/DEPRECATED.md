# Deprecated Flask prototype

This directory contains the earlier demo-first Flask backend.

ScoutBeyond live research now runs entirely in Next.js:

- `POST /api/research/start`
- `POST /api/firecrawl/webhook`
- Supabase `research_runs` / Realtime UI at `/research/[runId]`

Do not wire new product features through Flask. The `/pyapi` rewrite has been removed from `next.config.ts`.
