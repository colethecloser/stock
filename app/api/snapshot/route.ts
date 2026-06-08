import { NextRequest, NextResponse } from "next/server";
import { scoreCompany, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { resolveSnapshot } from "@/lib/resolve";
import { isDbEnabled, recordScores } from "@/lib/db";

export const runtime = "nodejs";

// POST { tickers: string[] } — records a history point for each ticker NOW,
// under the balanced rubric. Lets the user seed history without waiting for the
// nightly cron.
export async function POST(req: NextRequest) {
  if (!isDbEnabled()) {
    return NextResponse.json({
      ok: false,
      message: "Connect a DATABASE_URL to record score history.",
    });
  }

  let body: { tickers?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const tickers = (body.tickers ?? [])
    .map((t) => t.toUpperCase().trim())
    .filter(Boolean)
    .slice(0, 40);

  const rows: { ticker: string; composite: number; band: string }[] = [];
  await Promise.all(
    tickers.map(async (t) => {
      try {
        const snap = await resolveSnapshot(t);
        const s = scoreCompany(snap, DEFAULT_WEIGHTS);
        rows.push({ ticker: s.ticker, composite: s.composite, band: s.band });
      } catch {
        /* skip */
      }
    })
  );

  const recorded = await recordScores(rows);
  return NextResponse.json({ ok: true, recorded });
}
