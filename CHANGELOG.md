# Changelog

## Pipeline Activity — 2026-03-22 to 2026-03-25

### Dependencies (Autonomous: Dependabot + Gemini)
- **PR #2** globals 17.3.0 → 17.4.0 — merged 2026-03-22
- **PR #3** eslint 9.39.3 → 10.0.3 — merged 2026-03-22
- **PR #4** undici 7.22.0 → 7.24.1 (security) — merged 2026-03-22
- **PR #5** @vitest/ui 4.0.18 → 4.1.0 — merged 2026-03-22
- **PR #6** @typescript-eslint/parser 8.56.1 → 8.57.0 — merged 2026-03-22
- **PR #7** zustand 5.0.11 → 5.0.12 — merged 2026-03-22
- **PR #8** jsdom 28.1.0 → 29.0.0 — merged 2026-03-22
- **PR #9** @typescript-eslint/eslint-plugin 8.56.1 → 8.57.0 — merged 2026-03-22
- **PR #10** vite 7.3.1 → 8.0.0 — merged 2026-03-22
- **PR #11** @vitejs/plugin-react 5.1.4 → 6.0.1 — merged 2026-03-22
- **PR #19** actions/checkout 4 → 6 — merged 2026-03-25
- **PRs #20-22** (tailwindcss, postcss, eslint-plugin bumps) — Gemini review retriggered after transient 403, processing

### Features (Autonomous: Jules + Gemini)
- **PR #23** Manual save + auto-save before export (closes #12) — Gemini APPROVED, merged 2026-03-24

### Pipeline Health
- 12 PRs merged autonomously (11 deps + 1 feature)
- Gemini correctly auto-approved deps, correctly escalated major bumps (Vite 8, ESLint 10, jsdom 29)
- Transient Gemini API 403 on 2026-03-23 batch (4 dependabot PRs) — resolved by close/reopen retrigger
- `delete_branch_on_merge`: needs admin on socialawy-dev org
- Open issues: #13 (recent projects list), #14-18 (Phase 5-6 tasks)
