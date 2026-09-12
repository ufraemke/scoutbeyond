# AGENTS.md

Instructions for AI coding agents working in this repository.

## 1. Read First

Before making substantial changes, read:

1. `PROJECT.md`
2. `DESIGN.md`
3. relevant existing code
4. relevant type definitions / interfaces
5. `BACKEND_EVALUATION_RULES.md` when working on research, scoring, candidate structuring, or LLM prompts
6. `SEARCH_STRATEGY.md` when working on research, retrieval, or query generation
7. `FIRECRAWL_WEBHOOK_LIVE_RESEARCH.md` when working on live research, progress UI, Firecrawl webhooks, or Realtime updates
8. `LIVE_RESEARCH_IMPLEMENTATION.md` when implementing live research, progress UI, Firecrawl webhooks, Realtime, or research orchestration

Do not redesign the product or architecture unless the task explicitly requires it.

`FIRECRAWL_AND_LLM.md` is informational only (Firecrawl vs Gemini vs app roles). It is not required reading.

### Search strategy (hard)

Follow `SEARCH_STRATEGY.md`: diversified search dimensions (direct, physical principle, adjacent, cross-industry, emerging). Do **not** ask the LLM for an undifferentiated list of queries. Search by function and physical principle, not only application name. Breadth first, depth second.

### Evaluation rules (hard)

The LLM extracts structured facts. Deterministic code in `src/lib/research` assigns category, confidence, applicability, and evidence quality.

Do **not** ask the model whether a candidate is Established, Adjacent, or Exploratory. Do **not** invent parallel classification logic in the UI or prompts.

### Live research progress (hard)

Follow `FIRECRAWL_WEBHOOK_LIVE_RESEARCH.md` for requirements and `LIVE_RESEARCH_IMPLEMENTATION.md` for the mandatory build contract.

Live progress must come from real backend events persisted in Supabase, not mocked timers or invented messages.

Canonical path:

```text
Firecrawl Search → Batch Scrape → signed webhook → per-source analysis → Supabase Realtime → UI
```

Do **not**:

- drive research phases with `setTimeout` or hardcoded progress sequences,
- invent source counts, candidate counts, or percentage completion,
- show fake “currently reviewing” titles that are not tied to stored sources,
- block the Firecrawl webhook response on slow LLM analysis,
- invent an alternate live-research architecture that bypasses webhooks + Realtime.

Animations are allowed. Every displayed phase, counter, source, and candidate must map to persisted run state.

If the UI can look complete without Firecrawl webhooks updating Supabase, the implementation is wrong.

---

## 2. Primary Goal

This is a hackathon prototype.

Optimize for:

1. working software,
2. clear user experience,
3. understandable code,
4. fast integration,
5. reliable demo behavior.

Do not optimize for hypothetical enterprise scale.

---

## 3. Tech Preferences

Preferred stack:

- Next.js
- React
- TypeScript
- Vercel
- Supabase where persistent data is useful
- Python where it simplifies research, data processing, or AI workflows

Do not introduce major new frameworks without a clear reason.

Prefer existing project dependencies.

---

## 4. Architecture

Keep components loosely coupled.

Where practical, separate:

- UI,
- research / retrieval,
- analysis,
- scoring,
- data persistence.

Use clear interfaces between components.

Do not bury business logic inside UI components.

---

## 5. Code Style

Prefer:

- readable code,
- descriptive names,
- small functions,
- simple components,
- explicit types,
- straightforward control flow.

Avoid:

- unnecessary abstraction,
- premature optimization,
- clever but obscure code,
- large dependency additions,
- deeply nested component hierarchies.

Hackathon code may be pragmatic, but it should remain understandable.

---

## 6. Scope Discipline

Implement the requested task only.

Do not perform large unrelated refactors.

Do not change working functionality unless necessary.

If you identify unrelated issues, mention them rather than automatically rewriting them.

---

## 7. UI Rules

Follow `DESIGN.md`.

General principles:

- minimalist,
- modern,
- technical,
- calm,
- desktop-first,
- strong visual hierarchy,
- generous whitespace,
- restrained use of color.

Do not create a generic SaaS dashboard aesthetic.

Avoid excessive:

- gradients,
- badges,
- cards,
- shadows,
- icons,
- decorative animations.

---

## 8. Technical Result UI

The primary result categories are:

- Established
- Adjacent
- Exploratory

These concepts should remain visually understandable.

Candidate information should prioritize:

1. technology name,
2. relevance,
3. technical explanation,
4. evaluation,
5. sources.

Do not make AI-generated prose visually more important than technical evidence.

---

## 9. Source Integrity

Never fabricate sources.

If a result does not have a verified source, represent that state explicitly.

Keep separate where possible:

- retrieved source information,
- model-generated interpretation,
- assumptions,
- scoring.

Source URLs should remain traceable through the processing pipeline.

---

## 10. AI Output

AI responses may be incomplete or uncertain.

Code should:

- handle missing fields,
- validate structured AI output where practical,
- avoid assuming perfectly formatted responses,
- display uncertainty clearly.

Prefer structured model output over parsing arbitrary prose.

---

## 11. Data Models

Reuse shared types.

Do not create slightly different versions of the same candidate or source structure in multiple parts of the project.

If the shared schema changes, update dependent code deliberately.

---

## 12. Secrets

Never commit secrets.

Never hard-code:

- API keys,
- access tokens,
- passwords,
- Supabase service credentials,
- private URLs containing credentials.

Use environment variables.

Ensure sensitive `.env*` files remain excluded through `.gitignore`.

Maintain `.env.example` with variable names only.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
FIRECRAWL_API_KEY=
GEMINI_API_KEY=
```

Do not put real values in `.env.example`.

---

## 13. Git

Prefer small coherent commits.

Suggested commit format:

```text
feat: add candidate landscape
fix: handle missing research sources
ui: refine candidate detail layout
refactor: extract scoring logic
docs: update research pipeline
```

Do not commit generated build artifacts.

Do not commit secrets.

Do not force-push shared branches unless explicitly instructed.

---

## 14. Branches

For team work, prefer feature branches.

Examples:

```text
feature/research-pipeline
feature/result-landscape
feature/candidate-detail
feature/avatar
fix/source-links
```

Keep shared interfaces stable where possible.

---

## 15. Testing

Before considering a task complete:

- check TypeScript errors,
- run relevant linting,
- run relevant tests,
- verify the application builds where practical,
- manually verify the changed user flow.

For UI tasks, verify that the actual page renders.

For data tasks, inspect representative output.

Do not claim something works only because code was generated successfully.

---

## 16. Error Handling

Prefer visible, understandable failure states.

Examples:

- research temporarily unavailable,
- no credible candidates found,
- source unavailable,
- malformed AI response.

Do not silently swallow errors.

Avoid exposing raw technical stack traces to end users.

---

## 17. Mock Data

Mock data is acceptable for unfinished functionality if:

- it is clearly separated from production logic,
- replacing it later is straightforward,
- it enables a coherent demo.

Do not present mock data as live research.

---

## 18. Performance

Avoid unnecessary complexity.

Do not optimize prematurely.

However:

- avoid obvious repeated API calls,
- avoid blocking the entire interface unnecessarily,
- use progressive loading where useful,
- cache expensive research results if implementation is simple.

---

## 19. Accessibility

Use semantic HTML.

Maintain usable contrast.

Support keyboard interaction for primary controls where practical.

Do not rely on color alone to convey critical information.

---

## 20. When Uncertain

If multiple implementations are reasonable, prefer the option that is:

1. simpler,
2. faster to integrate,
3. easier for another team member to understand,
4. less likely to break the demo.

When assumptions are necessary, state them in the task result.