# Conventions (copy into .github/copilot-instructions.md, .clinerules, GEMINI.md)

Read ARCHITECTURE.md and PROGRESS.md before coding. Do not scan the whole repo.
- JavaScript + React function components, hooks, one component per file, PascalCase.jsx
- Tailwind utility classes only. Theme tokens: brand-black, brand-dark, brand-blood, brand-cream, brand-muted, brand-gold. No new CSS libraries.
- Fonts: Cormorant Garamond (serif) + DM Sans (sans) only. Do not add other font imports.
- Icons: lucide-react. Routing: react-router-dom v7.
- Supabase and AI calls live in src/features/<name>/*Service.js, never in components.
- Prices in PHP (₱). Store dates in UTC, display in Asia/Manila.
- Mobile-first layouts.
- Never hard-code keys. Use import.meta.env.VITE_*.
- Show only changed code (diffs or changed functions), not full-file rewrites.
- Keep answers short. Do not touch files outside the task. Ignore dist/, node_modules/, lockfiles, .pnpm-store/.
- After finishing, suggest a one-line update for PROGRESS.md.
- Appointments change only through the RPCs in appointmentService.js. Never insert/update appointments directly.
- Any new table needs: enable RLS, explicit GRANTs, policies, and a test in supabase/tests.
- Never put or ask for the Supabase secret key. Check every new JS/JSX file for syntax before delivering it.
- Dev machine is Windows PowerShell: give PowerShell commands (no rm -rf, no && chaining).
- Deploy with `npx vercel --prod` from the project folder (build command must stay `npm run build`).
