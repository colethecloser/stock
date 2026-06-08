import { NextRequest, NextResponse } from "next/server";
import { scoreCompany, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { resolveSnapshot } from "@/lib/resolve";
import type { Weights, ScoreResult } from "@/lib/types";

export const runtime = "nodejs";

// POST { tickers: string[], weights?: Weights }
// Returns { results: ScoreResult[], errors: { ticker, error }[] }
export async function POST(req: NextRequest) {
  let body: { tickers?: string[]; weights?: Weights };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const tickers = (body.tickers ?? [])
    .map((t) => t.toUpperCase().trim())
    .filter(Boolean)
    .slice(0, 40); // guard against runaway batches

  const weights = body.weights ?? DEFAULT_WEIGHTS;

  const results: ScoreResult[] = [];
  const errors: { ticker: string; error: string }[] = [];

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const snap = await resolveSnapshot(ticker);
        results.push(scoreCompany(snap, weights));
      } catch (e) {
        errors.push({ ticker, error: (e as Error).message });
      }
    })
  );

  results.sort((a, b) => b.composite - a.composite);
  return NextResponse.json({ results, errors });
}
