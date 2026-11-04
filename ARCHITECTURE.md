# PierceWise / Pierce the Veil
AI-powered piercing appointment scheduling + jewelry recommendation web app (PTF50 final project, Angeles City, PH).
Repo: cathtayer/ptf50-piercetheveil | Branches: main, backend, admin-dashboard

## Stack (all free tier)
React 18 + Vite 6, Tailwind CSS 3, React Router 7, lucide-react. Use npm (not pnpm).
Backend: Supabase (Postgres, Auth, RLS, Storage), project "piercewise". Hosting (planned): Vercel.
AI: Transformers.js 4.2.0 in the browser, model Xenova/all-MiniLM-L6-v2 (dtype q8, ~23 MB), cosine similarity.

## Folder map (src/)
- pages/client, pages/admin | layouts/AdminLayout | routes/AppRoutes, AdminRoutes, ProtectedRoute
- context/AuthContext.jsx + hooks/useAuth.js -> { user, profile, isAdmin, loading }
- services/supabase.js (client), services/api.js (toUserMessage, formatManila)
- features/authentication/authService.js
- features/jewelry/jewelryService.js (catalog, admin CRUD, placements, image upload)
- features/appointments/appointmentService.js (services, slots, booking, admin actions) + appointmentStatus.js
- features/recommendations/: recommendationService (recommend()), embeddingService (model), embeddingStore (index in DB),
  ranking (pure helpers, keyword fallback, reasons), similarity, evaluate (report harness)
- supabase/migrations/0001..0006 (run in order), supabase/tests/backend_checks.sql
- scripts/copy-ort.mjs -> copies the WASM runtime to public/ort (gitignored; runs on predev/prebuild)

## Data model (UUID PKs, UTC timestamps, display Asia/Manila)
profiles(role customer|admin) | piercing_types | services | jewelry | jewelry_compatibility(approved) |
jewelry_embeddings(model key, source_text, embedding jsonb) | availability_slots(capacity, is_blocked) |
appointments | appointment_events (audit) | recommendation_feedback

## Security model
- RLS on every table. Only the PUBLISHABLE key is in the app; the secret key is never used.
- Appointments are changed ONLY via RPCs: get_available_slots, request_appointment, cancel_my_appointment,
  admin_update_appointment. Direct insert/update is blocked.
- Admin role can only be set in the SQL editor (column grant + trigger protect_profile_role).
- PENDING and APPROVED both hold a slot. Flow: PENDING -> APPROVED/REJECTED/CANCELLED; APPROVED -> COMPLETED/CANCELLED/NO_SHOW.

## Recommender: recommend({piercingTypeId, budget, style, material, color, freeText, onProgress})
1) FILTER: active, in stock, within budget, shop-approved for the piercing. 2) RANK eligible items by cosine similarity.
3) EXPLAIN from real catalog data. Returns { mode: ai|fallback|filter|none, results[{item,score,reasons}], lowConfidence, bestScore, disclaimer }.
Thresholds (provisional, calibrate in evaluation): STRONG 0.45 "closely matches", PARTIAL 0.30 "partly matches", below = no claim.
Fallback = keyword overlap when the model cannot load. Admin saves auto-index; admin page shows "AI index x of y" + Update button.
Similarity = style relevance only, NOT piercing safety (piercer confirms at the appointment).
