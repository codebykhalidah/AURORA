# Aurora Booking Standalone

Production-ready cruise booking application for **Aurora Maritime** — a multi-step reservation flow with real-time room holds, passenger details, and PostgreSQL-backed inventory.

Built with Next.js 15, React 19, Prisma, and Tailwind CSS.

---

## Features

- **4-step booking widget** — search voyages, select rooms, enter passenger details, review & confirm
- **Room hold system** — 15-minute holds with automatic expiry via cron
- **Pricing engine** — room multipliers, ticket types, taxes/fees
- **Idempotent confirmation** — safe retries with UUID idempotency keys
- **Production logging** — structured JSON logs for API errors and key events
- **Vercel-ready** — cron job for hold cleanup included

---

## Requirements

- **Node.js** 20+
- **PostgreSQL** 14+ (Supabase, Neon, Railway, or self-hosted)
- **npm** 9+

---

## Installation

### Option A — Bootstrap from portfolio (recommended)

From the portfolio repository root:

```bash
node aurora-booking-standalone/scripts/bootstrap-from-portfolio.mjs "C:\path\to\your-new-project"
cd C:\path\to\your-new-project
npm install
```

### Option B — Manual copy

Follow the step-by-step checklist in [SETUP-GUIDE.md](./SETUP-GUIDE.md).

---

## Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public app URL, e.g. `https://booking.auroramaritime.com` |
| `ALLOWED_ORIGINS` | Yes (prod) | Comma-separated CORS origins |
| `CRON_SECRET` | Yes (prod) | Bearer token for `/api/cron/cleanup-holds` |
| `DIRECT_URL` | Optional | Non-pooled DB URL for migrations (Supabase) |
| `LOG_LEVEL` | Optional | `debug` \| `info` \| `warn` \| `error` (default: `info` in prod) |
| `PRISMA_LOG_QUERIES` | Optional | Set `true` to log SQL in development |

See [.env.example](./.env.example) for full documentation.

---

## Database setup

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations (development)
npm run prisma:migrate

# Seed cruises, schedules, rooms, and ticket types
npm run prisma:seed
```

One-shot setup:

```bash
npm run db:setup
```

---

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the booking widget is served at the root `/`.

Optional marketing landing page (if copied to `public/marketing.html`):

[http://localhost:3000/marketing.html](http://localhost:3000/marketing.html)

---

## Production build

```bash
npm run build
npm run start
```

Verify locally before deploying:

```bash
npm run typecheck
```

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cruises/availability` | Search voyages by date range |
| `POST` | `/api/bookings/hold` | Hold selected rooms (15 min) |
| `POST` | `/api/bookings/confirm` | Confirm booking with passengers |
| `GET` | `/api/bookings/[id]` | Retrieve booking details |
| `POST` | `/api/cron/cleanup-holds` | Expire stale holds (cron) |

All API routes support `OPTIONS` for CORS preflight.

---

## Deploy to Vercel

### 1. Push to GitHub

Create a new repository for the standalone project, push your code, and ensure `.env` is **not** committed.

### 2. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `aurora-booking-standalone` repository
3. Framework preset: **Next.js** (auto-detected)

### 3. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Environment |
|------|-------------|
| `DATABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Production (`https://your-app.vercel.app`) |
| `ALLOWED_ORIGINS` | Production (your marketing domain(s)) |
| `CRON_SECRET` | Production |

Generate `CRON_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Build settings

Default settings work with this project:

- **Build command:** `npm run build`
- **Install command:** `npm install`
- **Output:** Next.js default

The included `vercel.json` configures a cron job to call `/api/cron/cleanup-holds` every 5 minutes.

After first deploy, run migrations against production:

```bash
# With Vercel CLI linked to your project
npx prisma migrate deploy
npm run prisma:seed   # staging only; use admin tools for prod data
```

Or use Vercel's `POST_DEPLOY` hook / GitHub Action to run `prisma migrate deploy`.

### 5. Custom domain

1. Vercel → Project → Domains → add `booking.auroramaritime.com`
2. Update `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS` to match
3. Redeploy

---

## Production optimizations

Included in this kit:

- **`next.config.ts`** — strict mode, compression, security headers on API routes, package import optimization
- **`lib/logger.ts`** — structured logging with configurable log level
- **Production API templates** — no in-memory demo fallback; errors logged server-side
- **`vercel.json`** — automated hold cleanup cron
- **Trimmed dependencies** — portfolio-only packages removed

---

## Demo vs production data

| Item | Portfolio demo | Standalone production |
|------|----------------|----------------------|
| `lib/demoBooking.ts` | Present (offline fallback) | **Removed** |
| API demo fallback | Active when DB down | **Removed** — returns proper errors |
| `prisma/seed.ts` | Dev sample data | Use for staging; load real inventory in prod |
| `demo-aurora-maritime.html` | Portfolio static demo | Optional `public/marketing.html` |

For real customer data, manage cruises, schedules, and rooms through your database or an admin tool — do not rely on seed scripts in production.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run prisma:migrate` | Create/apply dev migrations |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Seed sample cruise data |
| `npm run db:setup` | Migrate + seed |
| `npm run typecheck` | TypeScript check |

---

## License

Private — Aurora Maritime demo / client project.

---

## Related docs

- [SETUP-GUIDE.md](./SETUP-GUIDE.md) — full copy checklist and file manifest
- [.env.example](./.env.example) — environment variable reference
