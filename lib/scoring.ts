import type {
  FinancialSnapshot,
  PillarResult,
  ScoreResult,
  Band,
  Weights,
  SnapshotSeries,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// DEFAULT (BALANCED) WEIGHTS. Tunable presets live in lib/presets.ts. Weights
// need not sum to 100 — scoreCompany normalizes them — so UI sliders are free.
// ─────────────────────────────────────────────────────────────────────────
export const DEFAULT_WEIGHTS: Weights = {
  ruleOf40: 15,
  growthConsistency: 12,
  fcfMarginTrend: 15,
  netLeverage: 13,
  fcfYield: 15,
  debtMaturity: 10,
  reRating: 8,
  earningsQuality: 12,
};

const GATE_COVERAGE_FLOOR = 0.75;
const GATE_COMPOSITE_CAP = 45;

// ── helpers ───────────────────────────────────────────────────────────────
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};
const growthSeries = (levels: number[]): number[] => {
  const out: number[] = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const prev = levels[i + 1];
    if (prev) out.push((levels[i] - prev) / Math.abs(prev));
  }
  return out;
};
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

type RawPillar = Omit<PillarResult, "weight">;

// ── PILLAR 1 — Rule of 40 ──────────────────────────────────────────────────
function ruleOf40(s: FinancialSnapshot): RawPillar {
  const g = growthSeries(s.revenue)[0] ?? 0;
  const fcfMargin = s.revenue[0] ? s.fcf[0] / s.revenue[0] : 0;
  const r40 = g * 100 + fcfMargin * 100;
  return {
    key: "ruleOf40",
    label: "Rule of 40",
    score: clamp((r40 - 10) / 4, 0, 10),
    metric: `${r40.toFixed(0)} (${pct(g, 0)} growth + ${pct(fcfMargin, 0)} FCF margin)`,
    detail: r40 >= 40
      ? "Clears the 40 bar — growth and profitability are balanced."
      : "Below 40 — growth isn't yet paying for itself in cash.",
  };
}

// ── PILLAR 2 — Growth consistency ──────────────────────────────────────────
function growthConsistency(s: FinancialSnapshot): RawPillar {
  const g = growthSeries(s.revenue);
  const avg = mean(g);
  const negatives = g.filter((x) => x < 0).length;
  const vol = stdev(g);
  let score = clamp((avg * 100) / 3, 0, 10);
  score *= Math.max(0, 1 - 0.2 * negatives);
  if (vol > 0.15) score *= 0.8;
  return {
    key: "growthConsistency",
    label: "Growth Consistency",
    score: clamp(score, 0, 10),
    metric: `${pct(avg, 0)} avg, ${negatives} down yr${negatives === 1 ? "" : "s"}`,
    detail: negatives === 0 && vol <= 0.15
      ? "Steady, uninterrupted top-line compounding."
      : "Growth is present but uneven or interrupted.",
  };
}

// ── PILLAR 3 — FCF margin trend ────────────────────────────────────────────
function fcfMarginTrend(s: FinancialSnapshot): RawPillar {
  const margins = s.revenue.map((r, i) => (r ? s.fcf[i] / r : 0));
  const latest = margins[0] ?? 0;
  const oldest = margins[margins.length - 1] ?? 0;
  const slope = latest - oldest;
  const level = clamp((latest / 0.25) * 8, 0, 8);
  const trendAdj = clamp((slope / 0.05) * 2, -2, 2);
  return {
    key: "fcfMarginTrend",
    label: "FCF Margin Trend",
    score: clamp(level + trendAdj, 0, 10),
    metric: `${pct(latest)} now, ${slope >= 0 ? "+" : ""}${pct(slope)} vs ${margins.length}y ago`,
    detail: slope >= 0
      ? "Margins are holding or expanding — operating leverage intact."
      : "Margins are compressing — watch cost or pricing pressure.",
  };
}

// ── PILLAR 4 — Net leverage ────────────────────────────────────────────────
function netLeverage(s: FinancialSnapshot): RawPillar {
  const ebitda = s.ebitda[0] ?? 0;
  const lev = ebitda > 0 ? s.netDebt[0] / ebitda : 99;
  const score =
    lev < 0 ? 10 : lev < 1 ? 9 : lev < 2 ? 7.5 : lev < 3 ? 5.5 : lev < 4 ? 3.5 : lev < 5 ? 2 : 0.5;
  return {
    key: "netLeverage",
    label: "Net Leverage",
    score,
    metric: lev >= 99 ? "n/m (negative EBITDA)" : `${lev.toFixed(2)}x net debt/EBITDA`,
    detail: lev < 0
      ? "Net cash — balance sheet is a weapon, not a constraint."
      : lev < 3 ? "Leverage is manageable." : "Elevated leverage narrows the margin for error.",
  };
}

// ── PILLAR 5 — FCF yield ───────────────────────────────────────────────────
function fcfYield(s: FinancialSnapshot): RawPillar {
  const y = s.marketCap ? s.fcf[0] / s.marketCap : 0;
  return {
    key: "fcfYield",
    label: "FCF Yield",
    score: clamp((y * 100) / 0.8, 0, 10),
    metric: pct(y),
    detail: y >= 0.05
      ? "Generous cash yield — you're paid to wait."
      : y > 0 ? "Thin cash yield — the price embeds a lot of future growth." : "Negative FCF — no cash return at this price.",
  };
}

// ── PILLAR 6 — Debt maturity gate ──────────────────────────────────────────
function debtMaturity(s: FinancialSnapshot): { pillar: RawPillar; coverage: number } {
  const coverage = s.shortTermDebt > 0 ? (s.cash + Math.max(s.fcf[0], 0)) / s.shortTermDebt : 5;
  const score =
    coverage >= 3 ? 10 : coverage >= 2 ? 8.5 : coverage >= 1.5 ? 7 : coverage >= 1 ? 5 : coverage >= 0.5 ? 2.5 : 1;
  return {
    coverage,
    pillar: {
      key: "debtMaturity",
      label: "Debt Maturity Gate",
      score,
      metric: `${coverage >= 5 ? "5.0+" : coverage.toFixed(2)}x ST-debt coverage`,
      detail: coverage >= 1.5
        ? "Near-term maturities are comfortably covered."
        : "Near-term maturities outrun liquidity — refinancing risk.",
    },
  };
}

// ── PILLAR 7 — Re-rating kicker ────────────────────────────────────────────
function reRating(s: FinancialSnapshot): RawPillar {
  const cur = s.evEbitda[0] ?? 0;
  const hist = mean(s.evEbitda.slice(1));
  const discount = hist > 0 ? 1 - cur / hist : 0;
  const margins = s.revenue.map((r, i) => (r ? s.fcf[i] / r : 0));
  const g = growthSeries(s.revenue)[0] ?? 0;
  const improving = margins[0] >= margins[margins.length - 1] || g > 0;
  let score = clamp(5 + (discount * 100) / 4, 0, 10);
  if (!improving) score = Math.min(score, 5);
  return {
    key: "reRating",
    label: "Re-Rating Kicker",
    score,
    metric: `${cur.toFixed(1)}x EV/EBITDA vs ${hist.toFixed(1)}x avg (${discount >= 0 ? "-" : "+"}${Math.abs(discount * 100).toFixed(0)}%)`,
    detail: discount > 0 && improving
      ? "Trading below its own history while fundamentals improve."
      : discount > 0 ? "Cheap vs history, but the story isn't yet improving." : "At or above its own multiple — limited re-rating headroom.",
  };
}

// ── PILLAR 8 — Earnings quality ────────────────────────────────────────────
function earningsQuality(s: FinancialSnapshot): RawPillar {
  const ni = s.netIncome[0] ?? 0;
  const conv = ni > 0 ? s.fcf[0] / ni : s.fcf[0] > 0 ? 1.5 : 0;
  const score =
    conv >= 1.2 ? 10 : conv >= 1 ? 9 : conv >= 0.8 ? 7.5 : conv >= 0.6 ? 5.5 : conv >= 0.4 ? 3.5 : conv >= 0 ? 1.5 : 0;
  return {
    key: "earningsQuality",
    label: "Earnings Quality",
    score,
    metric: `${conv.toFixed(2)}x FCF/NI conversion`,
    detail: conv >= 1 ? "Earnings are fully cash-backed." : "Reported earnings outrun cash flow — check accruals.",
  };
}

function bandFor(score: number): Band {
  if (score >= 80) return "High Conviction";
  if (score >= 65) return "Quality";
  if (score >= 50) return "Mixed";
  if (score >= 35) return "Elevated Scrutiny";
  return "Avoid";
}

function buildSeries(s: FinancialSnapshot): SnapshotSeries {
  // reverse to chronological (oldest → newest) for left-to-right charts
  const rev = [...s.revenue].reverse();
  const fcf = [...s.fcf].reverse();
  const ni = [...s.netIncome].reverse();
  return {
    revenue: rev,
    fcf,
    netIncome: ni,
    fcfMargin: rev.map((r, i) => (r ? fcf[i] / r : 0)),
  };
}

export function scoreCompany(
  s: FinancialSnapshot,
  weights: Weights = DEFAULT_WEIGHTS
): ScoreResult {
  const gate = debtMaturity(s);
  const raw: RawPillar[] = [
    ruleOf40(s),
    growthConsistency(s),
    fcfMarginTrend(s),
    netLeverage(s),
    fcfYield(s),
    gate.pillar,
    reRating(s),
    earningsQuality(s),
  ];

  // normalize weights to sum 100 so the composite always reads 0-100
  const total = Object.values(weights).reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const pillars: PillarResult[] = raw.map((p) => ({
    ...p,
    weight: Math.round(((Math.max(0, weights[p.key]) / total) * 100) * 10) / 10,
  }));

  let composite = pillars.reduce((sum, p) => sum + (p.score / 10) * p.weight, 0);

  const gateApplied =
    s.shortTermDebt > 0 && gate.coverage < GATE_COVERAGE_FLOOR && composite > GATE_COMPOSITE_CAP;
  let gateNote: string | undefined;
  if (gateApplied) {
    gateNote = `Composite capped at ${GATE_COMPOSITE_CAP} — near-term debt coverage of ${gate.coverage.toFixed(2)}x is below the ${GATE_COVERAGE_FLOOR}x gate.`;
    composite = GATE_COMPOSITE_CAP;
  }
  composite = Math.round(composite * 10) / 10;

  return {
    ticker: s.ticker,
    name: s.name,
    composite,
    band: bandFor(composite),
    pillars,
    series: buildSeries(s),
    gateApplied,
    gateNote,
    marketCap: s.marketCap,
    price: s.price,
    asOf: s.asOf,
    source: s.source,
  };
}
