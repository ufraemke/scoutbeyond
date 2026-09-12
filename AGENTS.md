# AGENTS.md

Instructions for AI coding agents working in this repository.

## 1. Read First

Before making substantial changes, read:

1. `PROJECT.md`
2. `DESIGN.md`
3. relevant existing code
4. relevant type definitions / interfaces

Do not redesign the product or architecture unless the task explicitly requires it.

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
OPENAI_API_KEY=
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