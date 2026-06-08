# Equity Score — Eight-Pillar Research Terminal

Score a watchlist, tune the rubric to a house view, dive into any name's trend
history, generate a reconciled AI analyst memo, and track how every score drifts
over time.

Ships with bundled demo tickers (`DEMOQ`, `DEMOG`, `DEMOL`) so the full app works
the moment it deploys — no keys required. Every external service is optional and
the app degrades gracefully without it.

## The eight pillars

Rule of 40 · Growth Consistency · FCF Margin Trend · Net Leverage · FCF Yield ·
Debt Maturity Gate · Re-Rating Kicker · Earnings Quality. The composite is a
weighted 0–100; a near-term debt-coverage shortfall trips a hard gate.

## Features

- **Ranked screener** over a saved watchlist, re-scoring live.
- **Strategy presets + tunable weights** (Balanced / Quality / Value / Growth).
- **Deep dive** with revenue / FCF / margin trend charts.
- **Compare** 2–3 names across every pillar.
- **AI analyst memo** — grounded bull/bear/verdict reconciled with the score.
- **Score history** — nightly cron + on-demand snapshots, charted over time.

## What each env var unlocks

| Env var | Effect | Without it |
| --- | --- | --- |
| `FMP_API_KEY` | Live fundamentals for any ticker | Demo tickers only |
| `ANTHROPIC_API_KEY` | AI analyst memo | Memo button shows "add a key" |
| `DATABASE_URL` | Score-history tracking | History UI hidden/disabled |
| `WATCHLIST` | Extra tickers the cron tracks (CSV) | Demos only |
| `CRON_SECRET` | Locks `/api/cron` | Endpoint open |

History always uses the **balanced** rubric so the time series stays comparable
regardless of how you tune weights in the UI.

---

# Full deploy guide (GitHub → Vercel → live site)

You need three free accounts: GitHub, Vercel, and (optionally) Neon for history.

## 1. Run it locally first (optional sanity check)

```bash
npm install
npm run dev      # http://localhost:3000
```

## 2. Put it on GitHub

```bash
git init
git add .
git commit -m "Equity Score v3"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/equity-scoring-framework.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Vercel

1. Go to vercel.com → **Add New… → Project**.
2. **Import** your GitHub repo (authorize Vercel for GitHub if prompted).
3. Framework preset auto-detects **Next.js**. Leave build settings default.
4. Click **Deploy**. In ~1 minute you get a live `*.vercel.app` URL — already
   working on the demo tickers.

Every `git push` to `main` now auto-redeploys.

## 4. Turn on live data (optional)

1. Get a key at financialmodelingprep.com.
2. Vercel → your project → **Settings → Environment Variables**.
3. Add `FMP_API_KEY` = your key. **Redeploy** (Deployments → ⋯ → Redeploy).
4. Now any real ticker works in the screener.

## 5. Turn on the AI memo (optional)

Add `ANTHROPIC_API_KEY` (from console.anthropic.com) the same way and redeploy.

## 6. Turn on score history (optional)

1. Go to neon.tech → create a free project → copy the **connection string**
   (looks like `postgresql://user:pass@host/db?sslmode=require`).
   (Or use Vercel's Postgres/Storage integration, which sets this for you.)
2. Vercel → Settings → Environment Variables → add `DATABASE_URL` = that string.
3. (Optional) add `WATCHLIST` = `AAPL,MSFT,NVDA` and `CRON_SECRET` = any random
   string.
4. Redeploy. The table is created automatically on first use.
5. The cron in `vercel.json` runs daily (Hobby plan: once/day). To seed history
   immediately, open a deep dive and hit **Record snapshot**, or call
   `/api/cron` once in your browser.

> Vercel Hobby allows one cron run per day. For intraday history, upgrade the
> plan and change the schedule in `vercel.json`.

---

## Architecture

```
app/
  page.tsx                dashboard (tabs, live re-score, persistence)
  api/
    score    | one ticker          screen | batch → ranked
    analyze  | AI memo (Anthropic)  history| read score history
    snapshot | record now           cron   | nightly history job
lib/
  scoring.ts   eight-pillar engine (pure, weight-configurable)
  presets.ts   strategy weight presets
  resolve.ts   ticker → FinancialSnapshot (mock fallback + FMP)
  db.ts        optional Postgres layer (no-ops without DATABASE_URL)
  providers/fmp.ts   data adapter   mockData.ts  demo companies
components/  WeightStudio · Screener · DeepDive · Compare · AnalystMemo ·
             Sparkline · HistoryChart
vercel.json  cron schedule
```

Swap data sources by writing a new adapter that returns a `FinancialSnapshot`
and changing the import in `lib/resolve.ts`. Tune the house view via the presets
and the inline thresholds in `lib/scoring.ts`.

## Path to a real product

The defensible moat isn't the rubric — it's (1) proprietary inputs feeding the
score, (2) the accumulated score-history dataset this app now builds, and
(3) distribution. Next technical steps: user accounts + server-side watchlists
(Clerk/NextAuth), per-user history, alerts on band changes, and Stripe tiers.

*Not investment advice. A scoring framework is a lens, not a verdict.*
