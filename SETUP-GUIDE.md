# Aurora Booking Standalone — Project Setup Guide

Use this checklist to create a **separate, production-ready** Aurora cruise booking project from the portfolio repo. The portfolio demo files are **not modified**; this kit lives in `aurora-booking-standalone/` and can be bootstrapped into a new folder.

---

## Quick start (automated)

From the **portfolio root**:

```bash
node aurora-booking-standalone/scripts/bootstrap-from-portfolio.mjs
```

Optional custom output path:

```bash
node aurora-booking-standalone/scripts/bootstrap-from-portfolio.mjs "C:\Projects\aurora-booking-standalone"
```

Then follow [Post-copy steps](#post-copy-steps) below.

---

## Manual setup checklist

### Phase 1 — Create the new project folder

- [ ] Create an empty folder, e.g. `C:\Projects\aurora-booking-standalone`
- [ ] Copy the entire **`aurora-booking-standalone/`** kit from the portfolio into it (or run the bootstrap script above)

### Phase 2 — Copy application source from portfolio

Copy these paths **from portfolio root → standalone root** (preserve folder structure):

| Copy from portfolio | Purpose |
|---------------------|---------|
| `components/booking/` | React booking widget (4-step flow) |
| `store/bookingStore.ts` | Client booking state (Zustand) |
| `lib/pricing.ts` | Price calculation |
| `lib/validations.ts` | Zod schemas for API + forms |
| `app/globals.css` | Tailwind base styles |
| `app/api/bookings/[id]/route.ts` | Fetch booking by ID |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Dev/staging seed script |
| `prisma/seed.sql` | Optional SQL seed reference |

**Optional — marketing site**

| Copy from portfolio | Standalone destination |
|---------------------|------------------------|
| `demo-aurora-maritime.html` | `public/marketing.html` |

Update `public/marketing.html` booking links to `/` instead of `localhost:3000/aurora-booking` (see [URL updates](#url--path-updates-for-production)).

### Phase 3 — Use production kit files (do not copy from portfolio)

Replace or use these from **`aurora-booking-standalone/`** (not the portfolio copies):

| Kit file | Standalone destination |
|----------|------------------------|
| `package.json` | `./package.json` |
| `.env.example` | `./.env.example` → copy to `.env` |
| `.gitignore` | `./.gitignore` |
| `next.config.ts` | `./next.config.ts` |
| `vercel.json` | `./vercel.json` |
| `tsconfig.json` | `./tsconfig.json` |
| `tailwind.config.js` | `./tailwind.config.js` |
| `postcss.config.js` | `./postcss.config.js` |
| `templates/lib/logger.ts` | `./lib/logger.ts` |
| `templates/lib/api.ts` | `./lib/api.ts` |
| `templates/lib/prisma.ts` | `./lib/prisma.ts` |
| `templates/app/page.tsx` | `./app/page.tsx` |
| `templates/app/layout.tsx` | `./app/layout.tsx` |
| `templates/app/api/cruises/availability/route.ts` | `./app/api/cruises/availability/route.ts` |
| `templates/app/api/bookings/hold/route.ts` | `./app/api/bookings/hold/route.ts` |
| `templates/app/api/bookings/confirm/route.ts` | `./app/api/bookings/confirm/route.ts` |
| `templates/app/api/cron/cleanup-holds/route.ts` | `./app/api/cron/cleanup-holds/route.ts` |

### Phase 4 — Do NOT copy (portfolio-only / demo)

| Portfolio path | Reason |
|----------------|--------|
| `lib/demoBooking.ts` | In-memory demo fallback — **not for production** |
| `app/demo-aurora-maritime/route.ts` | Serves portfolio HTML through Next — **not needed** |
| `app/aurora-booking/page.tsx` | Replaced by `app/page.tsx` at `/` |
| `demo-*.html` (other demos) | Unrelated portfolio showcases |
| `index.html`, `layout.css`, `script.js`, etc. | Portfolio site |
| `our-work-marquee.js`, `dist/`, `vite.config.js` | Portfolio carousel build |
| `scripts/capture-our-work-previews.mjs` | Portfolio tooling |
| `.next/`, `node_modules/` | Regenerate in new project |

If you copied API routes from the portfolio instead of templates, **remove demo fallback**:

- Delete imports of `@/lib/demoBooking`
- Remove `isDatabaseUnavailable` / `getDemoAvailability` / `createDemoHold` / `confirmDemoBooking` branches
- Delete `lib/demoBooking.ts` if present

### Phase 5 — Environment-specific configuration

Update these after copying:

| File / variable | What to change |
|-----------------|----------------|
| `.env` → `DATABASE_URL` | Your production PostgreSQL URL (Supabase, Neon, RDS, etc.) |
| `.env` → `NEXT_PUBLIC_APP_URL` | Public URL, e.g. `https://booking.auroramaritime.com` |
| `.env` → `ALLOWED_ORIGINS` | Comma-separated domains that embed or call the API |
| `.env` → `CRON_SECRET` | Random secret for hold cleanup cron |
| `templates/app/layout.tsx` | Uses `NEXT_PUBLIC_APP_URL` for metadata |
| `templates/lib/api.ts` | CORS reads `ALLOWED_ORIGINS` + `NEXT_PUBLIC_APP_URL` |
| `public/marketing.html` | Booking modal/links → `/` or your booking URL |
| `vercel.json` | Cron schedule (default: every 5 minutes) |

### Phase 6 — Dependencies

In the **new project folder** only:

```bash
npm install
```

**Production dependencies** (included in kit `package.json`):

- `next`, `react`, `react-dom`
- `@prisma/client`, `prisma`
- `zod`, `react-hook-form`, `@hookform/resolvers`, `zustand`

**Not included** (portfolio-only, omit from standalone):

- `puppeteer`, `vite`, `@vitejs/plugin-react`, `framer-motion`

---

## Post-copy steps

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with real values (see `.env.example` comments).

### 2. Database setup

```bash
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

For production deploy:

```bash
npx prisma migrate deploy
```

> **Note:** The portfolio repo has no `prisma/migrations/` folder yet. The first `migrate dev` in the standalone project creates it.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — booking widget is the home page.

### 4. Production build test

```bash
npm run build
npm run start
```

---

## URL & path updates for production

| Portfolio reference | Standalone replacement |
|---------------------|------------------------|
| `/aurora-booking` | `/` (home page) |
| `http://localhost:3000/aurora-booking` | `NEXT_PUBLIC_APP_URL` or `/` |
| `http://localhost:3000` / `3001` port probing in `demo-aurora-maritime.html` | Point modal iframe to `/` on same domain, or deploy marketing + booking together |
| `ALLOWED_ORIGINS` default `localhost:3000,3456` | Your production domain(s) |
| Portfolio `package.json` name | `aurora-booking-standalone` |

### Marketing site + booking on one domain

1. Put `demo-aurora-maritime.html` in `public/marketing.html`
2. Change booking modal iframe `src` to `/`
3. Access marketing at `/marketing.html`, booking at `/`

### Marketing on separate domain

1. Deploy booking app to `booking.example.com`
2. Set `ALLOWED_ORIGINS=https://www.example.com`
3. Embed widget via iframe or link to `https://booking.example.com`

---

## Production readiness checklist

- [ ] `lib/demoBooking.ts` **absent**
- [ ] API routes use **templates** (no demo fallback)
- [ ] `CRON_SECRET` set in production
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `npm run build` succeeds
- [ ] Search → hold → confirm flow tested against real DB
- [ ] Vercel cron configured (see `vercel.json`)
- [ ] `.env` not committed

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `500` on `/api/cruises/availability` | Check `DATABASE_URL`, run migrations + seed |
| CORS errors from marketing site | Add marketing origin to `ALLOWED_ORIGINS` |
| Holds never expire | Verify Vercel cron + `CRON_SECRET` |
| `prisma migrate` fails on Supabase | Use `DIRECT_URL` for migrations (non-pooled connection) |

---

## File tree (standalone target)

```
aurora-booking-standalone/
├── app/
│   ├── api/
│   │   ├── bookings/[id]/route.ts
│   │   ├── bookings/confirm/route.ts
│   │   ├── bookings/hold/route.ts
│   │   ├── cron/cleanup-holds/route.ts
│   │   └── cruises/availability/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/booking/
├── lib/
│   ├── api.ts
│   ├── logger.ts
│   ├── pricing.ts
│   ├── prisma.ts
│   └── validations.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── marketing.html          (optional)
├── store/bookingStore.ts
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```
