import { NextRequest, NextResponse } from "next/server";
import { scoreCompany, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { resolveSnapshot, ResolveError } from "@/lib/resolve";
import type { Weights, AnalystMemo } from "@/lib/types";

export const runtime = "nodejs";

// Default model. Swap to a heavier model for depth or a lighter one for cost.
const MODEL = "claude-sonnet-4-6";

const SYSTEM = `You are a buy-side equity research analyst writing a tight internal memo.
You are given a company's quantitative score from an eight-pillar framework plus its key financials.
Write a grounded, non-promotional memo that RECONCILES the qualitative story with the quantitative score —
explicitly note where the numbers and the narrative agree or diverge.
Be specific, skeptical, and concise. No hedging filler, no disclaimers, no price targets.
Return ONLY valid JSON (no markdown, no backticks) matching exactly:
{
  "thesis": "2-3 sentence core thesis",
  "bull": ["3-4 specific bull points"],
  "bear": ["3-4 specific bear points / key risks"],
  "scoreReconciliation": "2-3 sentences on whether the composite score fairly reflects the situation",
  "whatWouldChangeIt": ["2-3 concrete, observable events that would move the score"],
  "verdict": "1-2 sentence actionable conclusion"
}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add ANTHROPIC_API_KEY to enable the AI analyst memo." },
      { status: 503 }
    );
  }

  let body: { ticker?: string; weights?: Weights };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const snap = await resolveSnapshot(body.ticker ?? "");
    const weights: Weights = body.weights ?? DEFAULT_WEIGHTS;
    const score = scoreCompany(snap, weights);

    const pillarLines = score.pillars
      .map((p) => `- ${p.label}: ${p.score.toFixed(1)}/10 (weight ${p.weight}) — ${p.metric}`)
      .join("\n");

    const userPrompt = `Company: ${score.name} (${score.ticker})
Market cap: ${(score.marketCap / 1e9).toFixed(1)}B | Latest FY: ${score.asOf}
Composite score: ${score.composite}/100 → ${score.band}${score.gateApplied ? " (DEBT-MATURITY GATE TRIPPED)" : ""}

Pillar detail:
${pillarLines}

Revenue (most recent first): ${snap.revenue.map((r) => (r / 1e9).toFixed(2) + "B").join(", ")}
FCF (most recent first): ${snap.fcf.map((f) => (f / 1e9).toFixed(2) + "B").join(", ")}

Write the memo as instructed.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Anthropic API error (${res.status}): ${detail.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string = (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    const clean = text.replace(/```json|```/g, "").trim();
    let parsed: Omit<AnalystMemo, "ticker" | "model">;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: "Model did not return valid JSON.", raw: clean.slice(0, 500) },
        { status: 502 }
      );
    }

    const memo: AnalystMemo = { ticker: score.ticker, model: MODEL, ...parsed };
    return NextResponse.json(memo);
  } catch (e) {
    const err = e as ResolveError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
