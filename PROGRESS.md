# Progress (update after every session)

## Done
- BACKEND COMPLETE + TESTED (Supabase project 'piercewise'): migrations 0001-0005 run, tests/backend_checks.sql = 18/18 PASS
  - RPCs: get_available_slots, request_appointment, cancel_my_appointment, admin_update_appointment
  - Admin role can only be set from the SQL editor (trigger + column grants)
- Frontend service layer written (not yet wired into pages): supabase.js, api.js, authService, jewelryService,
  appointmentService (incl. slots + services admin), AuthContext, useAuth, ProtectedRoute
- Vite + React + Tailwind scaffold, folder structure
- Client Home page with CareGuide, ServicesGuide, Gallery, Instagram, Footer, Navbar
- Admin layout (sidebar) + admin pages UI, using HARDCODED mock data
- Static studio content in data/studioContent.js

## Not started (files exist but are empty, 0 bytes)
Client pages: Catalog, JewelryDetails, AIRecommendation, Appointment, MyAppointments, Profile, Login
Auth: AuthContext, useAuth, authService, authValidation, ProtectedRoute
Features: appointmentService/Validation, jewelryService/Filters, embeddingService, recommendationService, similarity
Services: supabase.js, api.js | Components: ProductCard, common/* (Button, Input, Modal, Loading), admin/* (Navbar, Sidebar, StatsCard)
ClientRoutes, ClientLayout, .env.example, README

## Known issues to fix
1. package.json is missing @supabase/supabase-js and @huggingface/transformers
2. Tailwind mismatch: @tailwindcss/postcss v4 is installed but tailwindcss is v3 and postcss.config uses the v3 plugin. Remove @tailwindcss/postcss.
3. admin pages use class brand-gold, but tailwind.config.js has no brand.gold color
4. Two font systems: Playfair/Inter (tailwind + index.html) vs Cormorant/DM Sans (index.css). Pick one.
5. In index.css, @import url(...) comes after @tailwind lines (must be first)
6. Both package-lock.json and pnpm-lock.yaml exist: keep one package manager
7. Add .pnpm-store to .gitignore (and .env)
8. AppRoutes sends every non-admin path to Home; client routes are not wired up

## Next up (suggested order)
1. Fix issues 1-3, create Supabase project, write schema + RLS, fill supabase.js and .env.example
2. Auth + ProtectedRoute (customer/admin roles)
3. Jewelry catalog (admin CRUD + client Catalog)
4. Slots + booking + approval RPC
5. AI recommendation (embeddings, filtering, fallback, evaluation)
