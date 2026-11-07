# Pierce the Veil / PierceWise

AI-powered piercing appointment scheduling and jewelry recommendation web app (PTF50 final project).
Stack: React 18 + Vite + Tailwind 3 + React Router 7, Supabase (Postgres, Auth, RLS, Storage), Transformers.js (planned).

Read `ARCHITECTURE.md` and `PROGRESS.md` first. They are short and up to date.

**No customer accounts.** Customers browse and book as guests (name + mobile number, email optional) and get a reference
code. Only the shop admin signs in.

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
6. `supabase/migrations/0006_embeddings_policy.sql`
7. `supabase/migrations/0007_guest_booking.sql`  (guest booking: replaces customer accounts; safe to re-run)

Verify by running `supabase/tests/backend_checks.sql` and `supabase/tests/guest_booking_checks.sql` (create the admin first;
no test users needed). Each ends with an intentional "error" that carries the report; expect `FAIL count: 0`.

In Dashboard > Authentication > Sign In / Providers, turn **off** "Allow new users to sign up": nobody but the admin needs an account.

Admin accounts: create the user in Dashboard > Authentication > Users (Create new user, Auto confirm),
then in the SQL Editor: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
Roles cannot be changed from the app, on purpose.

## How the frontend talks to the backend
Never call Supabase directly from components. Use the service files:
- `src/features/authentication/authService.js`: admin sign in/out, profile (role)
- `src/features/jewelry/jewelryService.js`: catalog, admin CRUD, image upload
- `src/features/appointments/appointmentService.js`: services, open slots, guest booking, look up/cancel by reference code, admin actions
- `src/services/api.js`: `toUserMessage(error)` for friendly errors, `formatManila(iso)` for Philippine time
- `useAuth()` gives `user`, `profile`, `isAdmin`, `loading` (admin only); admin pages are wrapped in `<ProtectedRoute>`

Appointments are changed ONLY through the RPC functions (request_appointment, get_booking, cancel_booking,
admin_update_appointment). Direct inserts/updates are blocked by design, and visitors cannot read the appointments table.

## Rules
- Never commit `.env`. Never use or share the Supabase **secret** key. Only the publishable key is used in the app.
- Show times in Asia/Manila; the database stores UTC.
- Work on your own branch, open a pull request into `main`.
