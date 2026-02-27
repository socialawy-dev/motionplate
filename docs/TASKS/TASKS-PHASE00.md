# Phase 0 — Scaffold & Foundation (x)

**Goal:** Clean project structure, dev environment, CI-ready.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P0-01 | Init Vite + React + TS project | `npm create vite@latest` | Running dev server | `npm run dev` serves blank page |
| P0-02 | Install core deps | package.json | Zustand, Tailwind, AJV installed | `npm run build` succeeds |
| P0-03 | Configure Tailwind with dark theme | tailwind.config.ts | MotionPlate color tokens defined | Visual check |
| P0-04 | Create directory structure | — | See Directory Layout below | All dirs exist |
| P0-05 | Setup Vitest | vitest.config.ts | `npm test` runs | Empty test passes |
| P0-06 | Setup ESLint + Prettier | .eslintrc, .prettierrc | Linting works | `npm run lint` passes |
| P0-07 | Create README.md | — | Project description + quick start | Human review |
| P0-08 | Git init + .gitignore | — | Clean repo | `git status` clean |