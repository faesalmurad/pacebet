# 🏁 PaceBet

A friendly marathon wager board. Friends bet **over/under** on your finish time
while training progress rolls in. Built for fun — not scale, not Fort Knox.

**Live:** https://pacebet.vercel.app

## How it works

- **Board** (`/`) — the line, a live countdown to gun time, a Riegel-formula
  projected finish, weekly mileage, recent runs, and the current over/under split.
- **Place a bet** (`/bets`) — friends enter a name, pick over/under, add an
  optional stake + trash talk. No login.
- **Settle** (`/settle`) — you enter the official finish time to close the book
  and crown winners. Passphrase-gated.

## Controls you'll want

- **Change the runner name, race, date, or the line:** go to `/settle` →
  *Race settings*, enter the passphrase, save. (The runner currently defaults to
  "Fae" — change it there.)
- **Passphrase:** set by `SETTLE_PASSPHRASE` (default `letsgo`). Change it in
  Vercel → Project → Settings → Environment Variables, then redeploy.
- **Settle the race:** `/settle` → enter finish time like `3:58:21` + passphrase.
  Got it wrong? *Reopen betting* clears the result.

## Data

Stored in Supabase (the existing **nestmate** project), in tables prefixed
`wager_` so they stay clearly separate:

- `wager_races` — the race + the over/under line + the result
- `wager_bets` — everyone's picks
- `wager_activities` — training runs (currently seeded mock data)

Env vars live in `.env.local` (and on Vercel). The service-role key is used only
server-side to settle the race and edit settings.

## Strava (when you're ready)

Training runs read from `wager_activities`, seeded with realistic mock data so
the board looks alive today. Wiring real Strava means populating that same table
from the Strava API — **no UI changes needed**. The full plan lives in
[`lib/strava.ts`](./lib/strava.ts): create a Strava app, set
`STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` / `STRAVA_REFRESH_TOKEN`, implement
`fetchStravaRuns()`, and upsert runs into `wager_activities` (source `'strava'`)
on a cron.

## Local dev

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase · Zod.
