# TradeLog AI

A personal AI-powered intraday trading journal — upload a Groww screenshot, let Claude extract the trade, log what happened, and get a brutally honest weekly performance report.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Postgres + Storage)
- Anthropic Claude API (`claude-sonnet-4-6`) for Vision extraction and analysis
- next-pwa, Framer Motion, Recharts, jsPDF

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` (or use the existing `.env.local`) and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `LOGIN_PASSWORD`
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). Log in with `LOGIN_PASSWORD`.

PWA support (service worker) is disabled in development and only builds in production.

## Database

Uses two pre-existing Supabase tables — this app never creates or alters schema:

- `umesh_trades`
- `umesh_weekly_reports`

And one pre-existing public storage bucket: `trade-screenshots`.

> Note: the live `umesh_trades` table does not have a `stop_loss_price` column. Stop loss is still captured in the UI (used to compute `risk_reward_ratio`) but isn't persisted as its own field.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add the same four environment variables from `.env.local` in the Vercel project's Environment Variables settings (Production, Preview, and Development).
4. Deploy. Vercel auto-detects Next.js — no custom build command needed.
5. Once deployed, open the site on iOS Safari or Android Chrome and use "Add to Home Screen" to install it as a PWA.

## Security

- `ANTHROPIC_API_KEY` and `LOGIN_PASSWORD` are server-only and are never sent to the client — all Claude API calls happen in `/app/api/*` route handlers.
- Auth is a single shared password (no accounts). The session flag lives in `localStorage` (`tradelog_session`); this is intended for single-user personal use, not multi-tenant security.
