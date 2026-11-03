# PierceWise / Pierce the Veil
AI-powered piercing appointment scheduling + jewelry recommendation web app (PTF50 final project, Angeles City, PH).
Repo: cathtayer/ptf50-piercetheveil | Branches: main, backend, admin-dashboard

## Stack (all free tier)
React 18 + Vite 6, Tailwind CSS 3, React Router 7, lucide-react.
Backend (planned): Supabase (Postgres, Auth, RLS, Storage). Hosting: Vercel.
AI (planned): Transformers.js in the browser, MiniLM-style embeddings + cosine similarity. No server LLM.

## Two portals
- Customer: Home, Catalog, JewelryDetails, AIRecommendation, Appointment, MyAppointments, Profile, Login
- Admin (/admin/*): Dashboard, Appointments, Schedule, Services, Jewelry, Customers, Login

## Folder map (src/)
- pages/client, pages/admin: route screens
- components/client|admin|common: UI pieces
- layouts: AdminLayout (sidebar), ClientLayout
- routes: AppRoutes -> AdminRoutes / ClientRoutes, ProtectedRoute
- features/<name>/: *Service.js (Supabase calls), *Validation.js, filters
  - appointments, authentication, jewelry, recommendations (embeddingService, recommendationService, similarity)
- services/supabase.js, services/api.js: client setup
- context/AuthContext.jsx, hooks/useAuth.js, hooks/useAppointments.js
- data/studioContent.js: static services/prices (PHP), care guide, gallery items

## Data model (Supabase, UUID PKs, timestamps in UTC, display Asia/Manila)
profiles(role) | services | jewelry | jewelry_compatibility | piercing_types |
availability_slots(capacity, is_blocked) | appointments | appointment_events | recommendation_feedback

## Appointment flow
Customer requests slot -> PENDING -> admin APPROVED / REJECTED (frees slot) -> COMPLETED / CANCELLED / NO_SHOW.
Slot capacity check + approval must be atomic in a Postgres RPC, not only in JS.
MVP: one appointment per slot, one staff resource. Customers can never approve their own bookings (RLS).

## AI recommendation flow
Preference form -> text description -> embed (Transformers.js) -> cosine similarity vs cached product embeddings
-> FILTER first (in stock, within budget, shop-approved for piercing location) -> top 3 + explanations from real catalog attributes.
Similarity = style relevance only, NOT piercing safety. If model fails to load, show a clearly labelled non-AI filter.
Evaluate: Precision@3, constraint compliance, latency, model load time (10-20 test queries, shop owner judges).

## Hard rules
- No secrets in frontend; only the Supabase anon key, with RLS on every table.
- All Supabase calls go through features/*/ *Service.js, never inside components.
