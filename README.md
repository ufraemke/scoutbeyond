# Technology Scanner

AI-assisted research tool for industrial R&D and engineering teams.

See `PROJECT.md` for product scope, `DESIGN.md` for UI guidance, and `AGENTS.md` for agent/contributor conventions.

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Vercel

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

Never commit real secrets.

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
