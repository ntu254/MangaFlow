# Anchored Summary — Redo TuaTua AI

## Goal
Complete a Vietnamese AI fashion stylist app (Redo TuaTua AI) with real APIs, real data, PayOS payment, Google OAuth login, credit-gated AI features, production deployment.

## Constraints & Preferences
- Feature-based structure: `app/`, `shared/`, `features/[domain]/`
- Tech stack: React 18 + TypeScript, Vite, Tailwind, shadcn/ui, TanStack React Query, Framer Motion
- Supabase as backend (anon key on frontend, service role key for seed scripts)
- Admin auth with RBAC (4 roles, 10 modules, permission guards, dedicated login page)
- `VITE_USE_MOCK_API=false` — services query Supabase directly
- Single `dialog` discriminated union state pattern for all admin pages (prevents dual overlays)
- DialogContent built-in close button used exclusively (no manual X buttons)
- AI Edge Functions in Deno with `_shared/` imports

## Progress

### Done (current session)
- **Google OAuth login**: `AuthCallbackPage`, fix `auth.service.ts` to read `profiles` after OAuth redirect, route `/auth/callback` added, ProfilePage Google linking button
- **Google OAuth credentials**: set via Supabase Management API (`supabase auth config set --config-json ...`), `security_manual_linking_enabled = true` (via raw SQL)
- **Credit system**: `_shared/credits.ts` — `withCreditCheck` middleware for Edge Functions
- **AI Edge Functions credit-gated**: `converse`, `generate-outfit`, `analyze-upload`, `analyze-wardrobe`, `style-recommendations` — all deduct credits via `withCreditCheck`
- **Email invoice system**: `_shared/email.ts` — `sendInvoiceEmail()` generates PDF (pdf-lib) + HTML, sends via Resend API
- **PayOS webhook**: `payos-webhook/index.ts` — idempotency (PG advisory lock), HMAC signature verification, refund handling (`provider_event = 'refund'`), credit reversal on refund, email invoice on payment
- **PayOS webhook registration failed**: PayOS returns `code: 214` ("Cổng thanh toán không tồn tại") — merchant account needs payment gateway created in PayOS dashboard
- **Verify-payment fallback**: `verify-payment/index.ts` — Edge Function that queries PayOS API directly (`GET /v2/payment-requests/{orderCode}`) to verify payment status and update DB, bypassing need for webhook
- **PaymentResultPage updated**: now calls `supabase.functions.invoke("verify-payment")` instead of polling DB table
- **Resend API key**: set via `supabase secrets set RESEND_API_KEY=re_...`
- **All Edge Functions deployed**: `converse`, `generate-outfit`, `analyze-upload`, `analyze-wardrobe`, `style-recommendations`, `create-payment`, `payos-webhook`, `verify-payment`

### Done (previous sessions)
- **All admin pages**: double-overlay bug fixed — single `dialog` discriminated union state pattern
- **Admin CRUD pages**: duplicate X buttons removed (built-in `DialogContent` close button suffices)
- **Auth role/ban check**: `auth.service.ts` `login()` fetches profile → checks `is_banned` → calls `is_admin_user()` RPC → returns `role`
- **AuthContext (`useAuth.tsx`)**: exposes `role: 'user' | 'admin' | null` and `is_banned: boolean`
- **LoginPage**: admin users redirected to `/admin`
- **ProtectedRoute**: banned accounts show blocked message
- **ResetPasswordPage**: redirects to `/login` instead of `/profile`
- **deleteAccount service**: cleans up analytics_events, outfit_items, outfits, wardrobe_items before calling RPC
- **Phase 1 — user-facing services**: all 5 services migrated to Supabase dual-path pattern (Recommender, Wardrobe, Trends, Quiz, StyleProfile)
- **QuizPage**: saves quiz answers via `quizService.completeQuiz()` on "analyzing" phase start
- **All routes wrapped in ProtectedRoute**: `/recommender`, `/wardrobe`, `/trends`, `/style-profile`, `/quiz`
- **Phase 2 — Profile & Preferences**: ProfilePanel (style/colors/occasions/budget/body_size), NotificationsPanel, SecurityPanel all wired to Supabase
- **Phase 3 — Subscription & Credits**: SubscriptionPanel queries subscriptions + plans + user_credits + payments + invoices from Supabase
- **Build passes**: 4010+ modules, clean production build

## Blocked
- **PayOS webhook not registered**: merchant account needs payment gateway created at https://my.payos.vn (error 214 — "Cổng thanh toán không tồn tại"). All payments stuck at `status: "pending"` because PayOS never sends webhook callback.
- **Direct DB connection**: `db.<ref>.supabase.co` only resolves to IPv6, Node.js can't connect — must use SQL Editor for DDL
- **Admin CRUD write 403**: paste `supabase/migrations/00004_foundation_auth_profile_rls.sql` into Supabase SQL Editor to fix RLS policies (safe — drop-if-exists pattern)

## Key Decisions
- **verify-payment fallback**: Instead of waiting for PayOS webhook (which can't be registered), `PaymentResultPage` calls `verify-payment` Edge Function that queries PayOS API directly — this unblocks the payment flow
- **Credit gating in middleware**: `withCreditCheck` in `_shared/credits.ts` wraps each AI Edge Function — checks balance before, deducts after successful response
- **Idempotent webhook**: PostgreSQL advisory lock prevents duplicate webhook processing
- **Refund support**: PayOS webhook with `provider_event = 'refund'` reverses credits and marks payment `refunded`
- **Invoice as PDF attachment**: generated via pdf-lib, sent via Resend
- Admin pages use single `dialog` discriminated union state
- Auth login checks banned status before returning session
- All Edge Functions deployed (no local Docker needed)

## Critical Context
- Build passes (Vite production) — 4010+ modules
- Admin login WORKS (RPC fix) but CRUD writes fail with 403 if RLS policies not applied
- Google OAuth WORKS (credentials + manual linking enabled)
- Resend emails WORK (API key set)
- PayOS payments: `create-payment` works (generates link + inserts pending payment), but webhook never fires — use `verify-payment` fallback
- All payments in DB: `status: "pending"`, `paid_at: null` — webhook never called
- `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_MOCK_API=false`
- `VITE_USE_MOCK_API` defaults `true`, `.env` overrides to `false`

## Edge Functions
| Function | Purpose | Status |
|---|---|---|
| `converse` | AI chat with credits | Deployed |
| `generate-outfit` | AI outfit generation with credits | Deployed |
| `analyze-upload` | Image analysis with credits | Deployed |
| `analyze-wardrobe` | Wardrobe analysis with credits | Deployed |
| `style-recommendations` | Style recommendations with credits | Deployed |
| `create-payment` | PayOS payment link creation | Deployed |
| `payos-webhook` | PayOS webhook handler (idempotent, HMAC, refund, invoice) | Deployed |
| `verify-payment` | Fallback PayOS verification via API | Deployed |

## Relevant Files
- `supabase/functions/_shared/credits.ts` — `withCreditCheck` middleware, `getUserCredits`, `deductCredits`
- `supabase/functions/_shared/email.ts` — PDF invoice generation + Resend email
- `supabase/functions/payos-webhook/index.ts` — idempotent, HMAC-signed webhook handler
- `supabase/functions/verify-payment/index.ts` — PayOS API verification fallback
- `supabase/functions/create-payment/index.ts` — creates PayOS payment link
- `supabase/functions/converse/index.ts` — AI chat with credit check
- `supabase/functions/generate-outfit/index.ts` — AI outfit generation with credit check
- `supabase/functions/analyze-upload/index.ts` — image analysis with credit check
- `supabase/functions/analyze-wardrobe/index.ts` — wardrobe analysis with credit check
- `supabase/functions/style-recommendations/index.ts` — style recommendations with credit check
- `src/features/auth/pages/AuthCallbackPage.tsx` — Google OAuth redirect handler
- `src/features/auth/services/auth.service.ts` — login with profile fetch for OAuth
- `src/app/routes.tsx` — `/auth/callback` route added
- `src/features/subscription/pages/PaymentResultPage.tsx` — calls `verify-payment` function
- `src/features/auth/services/auth.service.ts`: `login()` checks `is_banned` + `is_admin_user()` RPC
- `src/features/auth/hooks/useAuth.tsx`: exposes `role`, `is_banned`
- `src/features/auth/components/ProtectedRoute.tsx`: banned account UI
- `src/features/auth/pages/LoginPage.tsx`: admin redirect to `/admin`
- `src/features/quiz/pages/QuizPage.tsx`: wired `quizService.completeQuiz()`
- `src/app/routes.tsx`: 5 routes wrapped in `ProtectedRoute`
- `supabase/migrations/00004_foundation_auth_profile_rls.sql`: RLS policies with drop-before-create pattern
