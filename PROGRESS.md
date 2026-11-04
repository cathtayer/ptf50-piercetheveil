# Progress (update after every session)

## Done and verified
- BACKEND: migrations 0001-0006 run; tests/backend_checks.sql = 18/18 PASS (0005 fixed over-broad auto-grants)
- AUTH: authService, AuthContext (waits for profile), ProtectedRoute, admin Login (email) + Sign Out
- ADMIN pages, all on real data: Dashboard, Appointments (approve/reject/reschedule/complete/cancel/no-show),
  Jewelry Management (CRUD, photo upload, approved placements, hide/show, AI index status),
  Schedule (hours derived from slots, add slots, block/unblock a date), Services (list, create, activate/deactivate),
  Customers (profiles + visit stats, search)
- AI RECOMMENDER verified in the browser (mode 'ai', filter-first works, e.g. spike barbell excluded for Helix since not approved)
- CLEANUP: @tailwindcss/postcss removed, brand-gold token added, @import order fixed, npm only (pnpm-lock removed),
  fonts standardized on Cormorant Garamond + DM Sans
- DEPLOYED: https://ptf50-piercetheveil.vercel.app (Vercel Hobby, account walt1210s-projects, via CLI). Opens and works on a phone.
- README, .env.example, .gitignore (ignores .env, .pnpm-store, public/ort, .vercel)
- Evaluation kit drafted: PierceWise_Evaluation_Kit.xlsx (18 cases C01-C18 incl. 2 Taglish, marking sheet template)

## Not done
- Customer side (teammate): Login/Register, Catalog, JewelryDetails, AIRecommendation, booking flow, MyAppointments, Profile;
  ClientRoutes/ClientLayout; AppRoutes still sends every non-admin path to Home; /reset-password route
- Real catalog: 15-20 real pieces with good descriptions + approved placements (waiting on shop owner)
- Evaluation: owner marks Y/N per case/piece (sheet is generated from the catalog export), run runEvaluation(),
  calibrate STRONG/PARTIAL thresholds, write up results (include the Taglish cases)
- Deployment follow-ups: record AI mode + first model load time on mobile data; confirm Supabase Auth URL config
  (Site URL + redirect URLs for the vercel.app URL and localhost); decide if final deploy moves to the repo owner's account

## Known issues / cleanup
1. Customers page shows no email: profiles has no email column. Fix = add profiles.email filled by the signup trigger (+ test).
2. Customer names/phones are NULL for accounts made directly in Supabase Auth; they appear as "Unnamed client" until the Register form exists.
3. Blocking a date only sets is_blocked; it does NOT cancel appointments already booked on those slots.
4. Operating hours are derived from availability_slots (no hours table); a real hours table would need migration + RLS + test.
5. npm audit: 4 high, all Node-only deps of the AI library (adm-zip, sharp via onnxruntime-node); not in the browser bundle.
   Revisit mid-Nov: commit first, then `npm audit fix`, re-test. Never use --force.

## Gotchas learned
- Supabase auto-grants table privileges; new tables need explicit grants AND RLS policies
- RLS silently updates/returns 0 rows instead of erroring; tests must check row counts
- Vite only reads .env at startup; hard refresh (Ctrl+Shift+R) after changes. On Vercel, VITE_ vars are baked in at build time: redeploy after changing them.
- Model downloads from huggingface.co; WASM runtime is served from /ort (not a CDN). Repo onnx-community/... lacked model_quantized.onnx; use Xenova/...
- Vercel build command must be `npm run build` (not `vite build`) so the prebuild step copies the WASM runtime to public/ort.
- Vercel Hobby: a collaborator cannot import or auto-deploy the repo (owner is cathtayer). Deploy from the local folder: `npx vercel --prod`.
- vercel.json rewrites everything to /index.html so deep links like /admin/schedule do not 404.
- Dev machine is Windows PowerShell: no `rm -rf` (use Remove-Item -Recurse -Force), no `&&` in Windows PowerShell 5.1.
- Supabase free projects pause after about a week idle; wake the project before demos.

## Next up
1. Send catalog request to the shop owner; enter the real catalog; run the SQL export so the marking sheet can be generated
2. Evaluation: owner marking, runEvaluation(), calibrate thresholds
3. Check customer-side status with teammates; help with routes/booking/AIRecommendation if behind
4. Mid-Nov: npm audit fix (commit first, re-test)
