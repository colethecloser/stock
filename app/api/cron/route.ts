import { NextRequest, NextResponse } from "next/server";
import { scoreCompany, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { resolveSnapshot } from "@/lib/resolve";
import { isDbEnabled, recordScores } from "@/lib/db";
import { MOCK_TICKERS } from "@/lib/mockData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tickers the nightly job tracks: always the demos, plus anything in the
// WATCHLIST env var (comma-separated). History always uses the balanced rubric
// so the time series stays comparable regardless of UI weight tuning.
function trackedTickers(): string[] {
  const env = (process.env.WATCHLIST ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return Array.from(new Set([...MOCK_TICKERS, ...env]));
}

export async function GET(req: NextRequest) {
  // If CRON_SECRET is set, require it. Vercel Cron sends it automatically as
  // `Authorization: Bearer <CRON_SECRET>`. Left unset, the endpoint is open
  // (handy for manual testing).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({
      ok: false,
      message: "No DATABASE_URL configured — history is disabled.",
    });
  }

  const tickers = trackedTickers();
  const rows: { ticker: string; composite: number; band: string }[] = [];

  await Promise.all(
    tickers.map(async (t) => {
      try {
        const snap = await resolveSnapshot(t);
        const s = scoreCompany(snap, DEFAULT_WEIGHTS);
        rows.push({ ticker: s.ticker, composite: s.composite, band: s.band });
      } catch {
        /* skip names that fail to resolve */
      }
    })
  );

  const recorded = await recordScores(rows);
  return NextResponse.json({ ok: true, recorded, tickers });
}
