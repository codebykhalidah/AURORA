# Copy this folder anywhere, then open it as a new project.

## Quick start (after copying)

1. **Open in Cursor / VS Code** — File → Open Folder → select this folder
2. **Environment** — edit `.env` and set your `DATABASE_URL` (PostgreSQL)
3. **Install & database** (if you did not copy `node_modules`):
   ```bash
   npm install
   npx prisma migrate deploy
   npm run prisma:seed
   ```
4. **Run**:
   ```bash
   npm run dev
   ```
5. **Open in browser**:
   - Booking widget: http://localhost:3000
   - Full Aurora marketing site: http://localhost:3000/marketing.html

## What to copy

Copy the **entire** `aurora-booking-standalone` folder to your new location (e.g. `C:\Projects\aurora-booking`).

You can **exclude** these when copying to save space (reinstall after):
- `node_modules/`
- `.next/`

If you exclude them, run `npm install` in the new folder before `npm run dev`.

## Production

```bash
npm run build
npm run start
```

See `README.md` for Vercel deployment and full environment variable list.
