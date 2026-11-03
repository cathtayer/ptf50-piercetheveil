# Conventions (copy into .github/copilot-instructions.md, .clinerules, GEMINI.md)

Read ARCHITECTURE.md and PROGRESS.md before coding. Do not scan the whole repo.
- JavaScript + React function components, hooks, one component per file, PascalCase.jsx
- Tailwind utility classes only. Theme tokens: brand-black, brand-dark, brand-blood, brand-cream, brand-muted. No new CSS libraries.
- Icons: lucide-react. Routing: react-router-dom v7.
- Supabase and AI calls live in src/features/<name>/*Service.js, never in components.
- Prices in PHP (₱). Store dates in UTC, display in Asia/Manila.
- Mobile-first layouts.
- Never hard-code keys. Use import.meta.env.VITE_*.
- Show only changed code (diffs or changed functions), not full-file rewrites.
- Keep answers short. Do not touch files outside the task. Ignore dist/, node_modules/, lockfiles, .pnpm-store/.
- After finishing, suggest a one-line update for PROGRESS.md.
