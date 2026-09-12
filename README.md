# Technology Scanner

AI-assisted research tool for industrial R&D and engineering teams.

See `PROJECT.md` for product scope, `DESIGN.md` for UI guidance, and `AGENTS.md` for agent/contributor conventions.

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Vercel
- Supabase

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

### Supabase

1. Create organization `ScoutBeyond` and project `scoutbeyond` in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API**.
3. Copy the project URL and `anon` `public` key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Add the same two variables in the Vercel project settings for production.

Check the connection at `/api/health/supabase`. A successful response looks like `{ "ok": true, "urlHost": "….supabase.co" }`.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start local dev server   |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Team workflow

- GitHub is the source of truth
- Prefer small feature branches (`feature/...`, `fix/...`)
- Keep commits coherent and scoped
