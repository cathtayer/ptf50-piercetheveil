# Progress (update after every session)

## Done and verified
- BACKEND: migrations 0001-0006 run; tests/backend_checks.sql = 18/18 PASS (0005 fixed over-broad auto-grants)
- AUTH: authService, AuthContext (waits for profile), ProtectedRoute, admin Login (email) + Sign Out
- ADMIN pages on real data: Dashboard, Appointments (approve/reject/reschedule/complete/cancel/no-show), Jewelry Management
  (CRUD, photo upload, approved placements, hide/show, AI index status)
- AI RECOMMENDER verified in the browser (mode 'ai', filter-first works, e.g. spike barbell excluded for Helix since not approved)
- README, .env.example, .gitignore (ignores .env, .pnpm-store, public/ort)

## Not done
- Admin Schedule, Services, Customers pages: still HARDCODED mock data (service fns exist; listCustomers missing)
- Customer side (teammate): Login/Register, Catalog, JewelryDetails, AIRecommendation, booking flow, MyAppointments, Profile;
  ClientRoutes/ClientLayout; AppRoutes still sends every non-admin path to Home; /reset-password route
- Evaluation for the report: add 15-20 real jewelry pieces with good descriptions, write 10-20 cases, shop owner marks relevant
  pieces, run runEvaluation(), calibrate STRONG/PARTIAL thresholds
- Deployment: Vercel + 2 VITE_ env vars + Supabase Auth URL config (Site URL, redirect URL); test on a real phone

## Known issues / cleanup
1. Tailwind: @tailwindcss/postcss v4 installed with tailwind v3; remove it. brand-gold is not in tailwind.config (pages use #d4af37)
2. Two font systems (Playfair/Inter vs Cormorant/DM Sans); @import in index.css must come before @tailwind lines
3. Both package-lock.json and pnpm-lock.yaml exist: keep npm only
4. npm audit: 4 high, all Node-only deps of the AI library (adm-zip, sharp via onnxruntime-node); not in the browser bundle.
   Revisit mid-Nov: commit first, then `npm audit fix`, re-test. Never use --force.

## Gotchas learned
- Supabase auto-grants table privileges; new tables need explicit grants AND RLS policies
- RLS silently updates/returns 0 rows instead of erroring; tests must check row counts
- Vite only reads .env at startup; hard refresh (Ctrl+Shift+R) after changes
- Model downloads from huggingface.co; WASM runtime is served from /ort (not a CDN). Repo onnx-community/... lacked model_quantized.onnx; use Xenova/...

## Next up
1. Admin Schedule, Services, Customers wired to real data
2. Real catalog + evaluation  3. Deploy + phone test  4. Cleanup list above
