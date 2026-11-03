# Pierce the Veil / PierceWise

AI-powered piercing appointment scheduling and jewelry recommendation web app (PTF50 final project).
Stack: React 18 + Vite + Tailwind 3 + React Router 7, Supabase (Postgres, Auth, RLS, Storage), Transformers.js (planned).

Read `ai-context/ARCHITECTURE.md` and `ai-context/PROGRESS.md` first. They are short and up to date.

## Setup
1. `npm install` (use npm, not pnpm)
2. Copy `.env.example` to `.env` and fill in the two values (ask the team lead; never commit `.env`)
3. `npm run dev`, then open http://localhost:5173

## Database (Supabase)
Only needed if you create your own Supabase project. Otherwise use the shared one.
Run these in the SQL Editor, in order:
1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_security.sql`
3. `supabase/migrations/0003_functions.sql`
4. `supabase/migrations/0004_seed.sql`
5. `supabase/migrations/0005_fix_grants.sql`  (must run; it tightens permissions)

Verify with `supabase/tests/backend_checks.sql` (create test1/2/3@example.com users first; expect all PASS).

Admin accounts: create the user in Dashboard > Authentication > Users (Create new user, Auto confirm),
then in the SQL Editor: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
Roles cannot be changed from the app, on purpose.

## How the frontend talks to the backend
Never call Supabase directly from components. Use the service files:
- `src/features/authentication/authService.js`: sign up/in/out, profile
- `src/features/jewelry/jewelryService.js`: catalog, admin CRUD, image upload
- `src/features/appointments/appointmentService.js`: services, open slots, booking, cancel, admin actions
- `src/services/api.js`: `toUserMessage(error)` for friendly errors, `formatManila(iso)` for Philippine time
- `useAuth()` gives `user`, `profile`, `isAdmin`, `loading`; wrap protected pages in `<ProtectedRoute>`

Appointments are changed ONLY through the RPC functions (request_appointment, cancel_my_appointment,
admin_update_appointment). Direct inserts/updates are blocked by design.

## Rules
- Never commit `.env`. Never use or share the Supabase **secret** key. Only the publishable key is used in the app.
- Show times in Asia/Manila; the database stores UTC.
- Work on your own branch, open a pull request into `main`.
