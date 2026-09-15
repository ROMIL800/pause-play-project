# GD BOSS777 — Technical Handover Document

Last updated: 8 Aug 2026
Status: production candidate (Phase 0–2 recovery complete)

---

## 1. Architecture Overview

| Layer         | Technology                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | TanStack Start v1 (React 19, SSR + server functions)                    |
| Build tool    | Vite 8                                                                  |
| Routing       | TanStack Router (file-based, `src/routes`)                              |
| Data fetching | TanStack Query v5 + `createServerFn` RPC                                |
| Styling       | Tailwind CSS v4 (`src/styles.css`, `@theme` tokens) + shadcn/ui (Radix) |
| Backend       | Lovable Cloud (Supabase: Postgres, Auth, RLS)                           |
| Phone auth    | Firebase Phone Authentication (project `matka777-2d113`)                |
| Charts        | chart.js / react-chartjs-2 (+ recharts, legacy)                         |
| Mobile shell  | Capacitor 8 (Android), package `com.matka777.app`                       |
| Deploy target | Edge/Worker runtime (Cloudflare workerd)                                |

Request flow:

```
Browser / Android WebView
   → TanStack Router route
   → createServerFn (server-side, bearer token attached by src/start.ts)
      → requireSupabaseAuth middleware (RLS as the signed-in user)
      → supabaseAdmin (service role) only for privileged money operations
   → Postgres (RLS + SECURITY DEFINER RPCs)
```

Firebase is used **only** to prove phone ownership. The verified Firebase ID
token is exchanged server-side for a Lovable Cloud (Supabase) session, which is
the app's real identity for all data access.

---

## 2. Folder Structure

```
/
├── android/
│   └── app/google-services.json      # Firebase Android config (pkg com.matka777.app)
├── docs/
│   └── TECHNICAL_HANDOVER.md         # this file
├── public/robots.txt
├── supabase/
│   ├── config.toml                   # project ref (auto-generated)
│   └── migrations/*.sql              # 7 migrations, chronological
├── src/
│   ├── components/
│   │   ├── AppHeader.tsx  BottomNav.tsx  SideMenu.tsx
│   │   ├── BrandLogo.tsx  BetIcon.tsx  Marquee.tsx  WhatsAppLogo.tsx
│   │   └── ui/                       # shadcn primitives
│   ├── hooks/  use-auth.ts, use-mobile.tsx
│   ├── integrations/supabase/        # AUTO-GENERATED — do not edit
│   │   ├── client.ts        (browser, publishable key)
│   │   ├── client.server.ts (service role, server only)
│   │   ├── auth-middleware.ts (requireSupabaseAuth)
│   │   ├── auth-attacher.ts (client bearer middleware)
│   │   └── types.ts         (generated DB types)
│   ├── lib/
│   │   ├── account.functions.ts      # user: profile, bets, funds
│   │   ├── admin.functions.ts        # admin: requests, review, UPI
│   │   ├── markets.functions.ts      # live market data
│   │   ├── satta.functions.ts        # satta market data
│   │   ├── firebase.ts               # web SDK config + OTP helpers
│   │   ├── firebase-auth.functions.ts# token exchange RPC (public)
│   │   ├── firebase-auth.server.ts   # token verification + session mint
│   │   ├── bet-store.ts / wallet-store.ts / bet-types.ts
│   │   ├── market-status.ts / market-filter.ts / mock-data.ts
│   │   └── contact.ts, utils.ts, error-*.ts
│   ├── routes/                       # see §3
│   ├── routeTree.gen.ts              # GENERATED — never edit
│   ├── router.tsx  server.ts  start.ts  styles.css
├── capacitor.config.ts
├── vite.config.ts  tsconfig.json  components.json  eslint.config.js
└── .env                              # generated Supabase vars only
```

---

## 3. Routes

All routes are public files under `src/routes` (no `_authenticated/` layout);
auth-sensitive pages redirect via `use-auth`/server-fn errors.

| Path                | File                   | Purpose                                         |
| ------------------- | ---------------------- | ----------------------------------------------- |
| `/`                 | `index.tsx`            | Home: markets list, marquee, quick actions      |
| `/auth`             | `auth.tsx`             | Phone + OTP login (Firebase)                    |
| `/wallet`           | `wallet.tsx`           | Balance, wallet actions                         |
| `/add-fund`         | `add-fund.tsx`         | Deposit request (UPI + 12-digit UTR)            |
| `/withdraw`         | `withdraw.tsx`         | Withdrawal request                              |
| `/payment-history`  | `payment-history.tsx`  | Deposit/withdraw history                        |
| `/my-bets`          | `my-bets.tsx`          | User bet history                                |
| `/market/$id`       | `market.$id.tsx`       | Bet-type selection for a market                 |
| `/market/$id/$type` | `market.$id.$type.tsx` | Bid entry screen per game type                  |
| `/game-rates`       | `game-rates.tsx`       | Payout rate table                               |
| `/chart/$id`        | `chart.$id.tsx`        | Per-market result chart                         |
| `/live-chart`       | `live-chart.tsx`       | Live results chart                              |
| `/satta`            | `satta.tsx`            | Satta markets                                   |
| `/bank-details`     | `bank-details.tsx`     | Bank account for payouts                        |
| `/upi-details`      | `upi-details.tsx`      | UPI details                                     |
| `/gift`             | `gift.tsx`             | Gift / promo screen                             |
| `/notice`           | `notice.tsx`           | Notices / announcements                         |
| `/support`          | `support.tsx`          | WhatsApp / contact support                      |
| `/settings`         | `settings.tsx`         | App settings                                    |
| `/admin`            | `admin.tsx`            | Admin panel (requests, approvals, UPI)          |
| root layout         | `__root.tsx`           | Shell, providers, Sonner toaster, auth listener |

---

## 4. Database

### Tables (schema `public`)

**profiles** — `id` (uuid, PK, = `auth.users.id`), `phone`, `full_name`, `created_at`, `updated_at`
Created automatically by the `handle_new_user` trigger on `auth.users` insert.

**wallets** — `user_id` (uuid, PK → `auth.users`), `balance` numeric(12,2) default 0, timestamps.
One wallet per user, created by the same trigger.

**transactions** — `id`, `user_id` → `auth.users`, `kind` ∈ (`deposit`,`withdraw`,`bet`,`win`,`refund`),
`amount` numeric(12,2) > 0, `status` ∈ (`pending`,`approved`,`rejected`,`processing_approved`,`processing_rejected`),
`method`, `reference`, `utr`, `note`, timestamps.

**bets** — `id`, `user_id`, `market_id`, `market_name`, `bet_type`, `bet_type_name`,
`rate`, `bids` (jsonb array of `{digit, points, type}`), `total_bids`, `total_points`,
`status` ∈ (`Pending`,`Win`,`Loss`), timestamps.

**user_roles** — `id`, `user_id` → `auth.users`, `role` enum `app_role` (`admin`|`user`), unique(user_id, role).
Roles are deliberately **never** stored on `profiles`.

**app_settings** — `key` (PK), `value`, timestamps. Holds `deposit_upi_id`.

**phone_otps** — `id`, `phone`, `code_hash`, `expires_at`, `attempts`, `consumed_at`.
Legacy OTP store from the pre-Firebase flow; service-role only, currently unused.

### Relationships

```
auth.users 1─1 profiles
auth.users 1─1 wallets
auth.users 1─* transactions
auth.users 1─* bets
auth.users 1─* user_roles
app_settings / phone_otps — standalone
```

### RLS summary

- profiles: owner select/update; admins can select all.
- wallets: owner select only; all writes via SECURITY DEFINER RPCs / service role.
- transactions: owner select; owner insert restricted to `kind IN (deposit, withdraw)` **and** `status = 'pending'`; admins select all; status changes only via service role.
- bets: owner select; inserts via service role after wallet debit.
- user_roles: owner select; writes service role only.
- app_settings: readable by `anon` + `authenticated`; writes service role only (admin RPC).
- phone_otps: service role only.

### Database functions (RPC)

| Function                             | Security         | Purpose                                                 |
| ------------------------------------ | ---------------- | ------------------------------------------------------- |
| `handle_new_user()`                  | DEFINER, trigger | Creates profile + wallet on signup                      |
| `grant_owner_admin()`                | DEFINER, trigger | Grants `admin` to the owner phone ending `7597886713`   |
| `has_role(_user_id, _role)`          | DEFINER, stable  | Non-recursive role check used by RLS                    |
| `place_bet_debit(_user_id, _amount)` | DEFINER          | Atomic conditional debit; raises `INSUFFICIENT_BALANCE` |
| `wallet_credit(_user_id, _amount)`   | DEFINER          | Atomic credit (upserts wallet)                          |
| `update_updated_at_column()`         | trigger          | Maintains `updated_at`                                  |

Triggers: `on_auth_user_created` (auth.users), `profiles_owner_admin`,
and `*_updated_at` on app_settings, bets, profiles, transactions, wallets.

### Server functions (`createServerFn`)

`src/lib/account.functions.ts`

- `getAccount` (GET, auth) — phone, full name, balance
- `listBets` (GET, auth) — last 200 bets
- `placeBet` (POST, auth) — validates bids, debits wallet via RPC, inserts bet + `bet` transaction
- `listTransactions` (GET, auth) — last 200 transactions
- `createFundRequest` (POST, auth) — deposit/withdraw request with all business rules

`src/lib/admin.functions.ts`

- `getIsAdmin` (GET, auth)
- `getDepositUpi` (GET, public) — reads `app_settings.deposit_upi_id`
- `updateDepositUpi` (POST, admin)
- `listAllRequests` (GET, admin) — requests joined with requester phone
- `reviewRequest` (POST, admin) — atomic claim + approve/reject

`src/lib/firebase-auth.functions.ts`

- `exchangeFirebaseToken` (POST, public) — verifies Firebase ID token, mints Cloud session

`src/lib/markets.functions.ts` → `getLiveMarkets`; `src/lib/satta.functions.ts` → `getSattaMarkets`.

---

## 5. Firebase Configuration

| Item            | Value                                       |
| --------------- | ------------------------------------------- |
| Project ID      | `matka777-2d113`                            |
| Auth domain     | `matka777-2d113.firebaseapp.com`            |
| Sender ID       | `183862274737`                              |
| Web App ID      | `1:183862274737:web:d5dcd8d975d333add3d090` |
| Storage bucket  | `matka777-2d113.firebasestorage.app`        |
| Android package | `com.matka777.app`                          |
| Android config  | `android/app/google-services.json`          |
| Sign-in method  | Phone (SMS OTP), invisible reCAPTCHA        |

Config lives in `src/lib/firebase.ts` with `VITE_FIREBASE_*` env overrides and
hardcoded fallbacks (these are publishable client identifiers).

Helpers: `getFirebaseAuth()` (sets `browserLocalPersistence`),
`getRecaptcha()` / `resetRecaptcha()` (verifier is recreated on every send —
required, since a solved invisible reCAPTCHA token is single-use),
`sendFirebaseOtp()`, `firebaseErrorMessage()` (maps error codes to player-facing text).

---

## 6. Authentication Flow

1. User enters mobile number on `/auth`.
2. `sendFirebaseOtp("+91…")` resets the reCAPTCHA verifier and calls `signInWithPhoneNumber`.
3. Firebase sends the SMS; user enters the 6-digit code; `confirmationResult.confirm(code)`.
4. Client obtains the Firebase **ID token** and calls `exchangeFirebaseToken({ idToken })`.
5. Server (`firebase-auth.server.ts`) validates the token: `aud` = project id,
   `iss` = `https://securetoken.google.com/matka777-2d113`, `exp` not passed,
   `sign_in_provider = phone`, then verifies with Google's public keys.
6. Server mints/looks up a Cloud user for that phone (`mintSessionForPhone`)
   and returns a Supabase session.
7. Client stores the session; `on_auth_user_created` has already created the
   profile + wallet; the owner phone gets the `admin` role automatically.
8. Every subsequent server-fn call carries the bearer token via the
   `functionMiddleware` registered in `src/start.ts`; `requireSupabaseAuth`
   validates it and runs queries under the user's RLS.

---

## 7. Wallet / Deposit / Withdraw Flow

**Balance** — single source of truth is `wallets.balance`; only
`wallet_credit` and `place_bet_debit` mutate it, both SECURITY DEFINER and atomic.

**Deposit**

1. `/add-fund`: app shows the payable UPI ID from `getDepositUpi`.
2. User pays externally, then submits amount + 12-digit UTR.
3. `createFundRequest` enforces: minimum ₹300, UTR required and globally unique
   (a UTR maps to exactly one real bank transfer), and blocks duplicate
   same-amount pending requests within 60 s.
4. Row inserted as `kind='deposit', status='pending'`.
5. Admin approves → `reviewRequest` claims the row (`pending → processing_approved`),
   calls `wallet_credit`, then sets `approved`. On RPC failure the claim is released back to `pending`.

**Withdraw**

1. `/withdraw`: minimum ₹1000.
2. `createFundRequest` computes available balance = `wallets.balance` − sum of
   pending withdrawals, so money already reserved cannot be requested twice.
3. Row inserted as `kind='withdraw', status='pending'`.
4. Admin approves → claim → `place_bet_debit` (debit) → `approved`;
   insufficient balance surfaces "User has insufficient balance" and the row returns to `pending`.
5. Reject → `pending → processing_rejected → rejected`, balance untouched.

**Bet placement** — `placeBet` sums bid points, debits atomically via
`place_bet_debit` (raises `INSUFFICIENT_BALANCE`), inserts the bet, then records
a `bet` transaction referencing the bet id.

The transient `processing_*` statuses are the concurrency guard: only one
caller can flip a row away from `pending`, so double-clicks or two admins can
never credit twice. (Phase 1 added them to the status CHECK constraint.)

---

## 8. Admin System

- Access: `user_roles.role = 'admin'`, checked server-side via `has_role`.
  The owner phone ending `7597886713` is auto-granted admin by the
  `profiles_owner_admin` trigger.
- UI: `/admin` — lists all deposit/withdraw requests with requester phone,
  approve/reject actions, and the payable UPI ID editor.
- Every admin server fn re-checks `has_role` before doing anything; the client
  `getIsAdmin` result is for UI only and is never trusted for authorization.
- Privileged writes use `supabaseAdmin` (service role), imported lazily inside
  handlers so the server-only module never enters the client bundle.

---

## 9. Environment Variables

Auto-generated in `.env` (do not edit):

| Name                            | Scope  |
| ------------------------------- | ------ |
| `VITE_SUPABASE_URL`             | client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client |
| `VITE_SUPABASE_PROJECT_ID`      | client |
| `SUPABASE_URL`                  | server |
| `SUPABASE_PUBLISHABLE_KEY`      | server |
| `SUPABASE_PROJECT_ID`           | server |

Backend secrets (managed, not in files): `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `LOVABLE_API_KEY`.

Optional client overrides (fallbacks exist in code): `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

---

## 10. Capacitor / Android

`capacitor.config.ts`:

```ts
appId: "com.matka777.app";
appName: "GD BOSS777";
webDir: "dist/client";
android: {
  allowMixedContent: false;
}
server: {
  androidScheme: "https";
} // WebView origin = https://localhost
```

- Android package name: **com.matka777.app**
- Firebase Android config present at `android/app/google-services.json`.
- The native Android project (Gradle, Manifest) is **not** committed —
  regenerate locally with `npx cap add android`, then `npm run build && npx cap sync android`.
- Because `androidScheme` is `https`, the WebView origin is `https://localhost`,
  which must be present in Firebase → Authentication → Settings → Authorized domains.

---

## 11. Known Issues / Open Items

1. Native Android project not in the repo — must be generated locally before any APK/AAB build.
2. Market data (`markets.functions.ts`, `satta.functions.ts`, `mock-data.ts`) is
   static/mock; there is no admin result-declaration flow, so bets stay `Pending`
   and no `win` transactions are ever produced.
3. No dedicated profile route; profile editing is limited.
4. Notifications are static content (`/notice`), no push (FCM not wired).
5. `app_settings` is world-readable (`anon` SELECT) — fine today since it only
   holds the public UPI ID, but do not store anything sensitive there.
6. No rate limiting on `exchangeFirebaseToken` (public server fn).
7. No pagination — bets and transactions are capped at 200/300 rows.
8. Duplicate charting libraries (chart.js and recharts) inflate the bundle.
9. `phone_otps` table is dead code from the pre-Firebase OTP flow.
10. No automated tests.
11. App icons / splash screens not provided.

---

## 12. Production Checklist

**Backend**

- [x] Schema, RPCs, triggers, RLS, grants restored
- [x] `transactions.status` constraint includes `processing_*` (Phase 1)
- [ ] Verify owner admin role exists in production data
- [ ] Add rate limiting to the token-exchange endpoint
- [ ] Add pagination/archival for transactions and bets

**Firebase**

- [x] Web app id corrected
- [x] Persistence + reCAPTCHA resend fix
- [x] Server-side token claim validation
- [ ] Add production domains + `localhost` to Authorized Domains
- [ ] Confirm SMS quota / billing plan for real volume
- [ ] Add SHA-1 and SHA-256 release fingerprints to the Android app

**Android / Play Store**

- [ ] `npx cap add android` and commit or archive the native project
- [ ] App icon, splash, adaptive icon assets
- [ ] Release keystore + signing config, build AAB
- [ ] Version code/name strategy
- [ ] Real-money gaming compliance: licence declaration, region restrictions,
      18+ content rating, privacy policy URL, responsible-gaming disclosures

**App**

- [ ] Result declaration + bet settlement flow
- [ ] Replace mock market data with live source
- [ ] Push notifications (FCM) if required
- [ ] Load test deposit/withdraw approval under concurrency
- [ ] Error monitoring reviewed before launch
