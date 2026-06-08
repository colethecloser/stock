// Core data contract. Every provider (mock, FMP, future) normalizes into a
// FinancialSnapshot. Annual series are MOST RECENT FIRST (index 0 = latest FY).
// Currency figures are absolute (not millions) in the reporting currency.

export interface FinancialSnapshot {
  ticker: string;
  name: string;
  marketCap: number;
  price: number;

  revenue: number[];
  fcf: number[];
  netIncome: number[];
  ebitda: number[];
  netDebt: number[];

  shortTermDebt: number;
  cash: number;

  evEbitda: number[];

  source: "mock" | "fmp";
  asOf: string;
}

// Pillar weights. Need not sum to 100 — the engine normalizes — but presets do.
export interface Weights {
  ruleOf40: number;
  growthConsistency: number;
  fcfMarginTrend: number;
  netLeverage: number;
  fcfYield: number;
  debtMaturity: number;
  reRating: number;
  earningsQuality: number;
}

export type Band =
  | "High Conviction"
  | "Quality"
  | "Mixed"
  | "Elevated Scrutiny"
  | "Avoid";

export interface PillarResult {
  key: keyof Weights;
  label: string;
  score: number;   // 0-10
  weight: number;  // normalized contribution (points out of 100)
  metric: string;
  detail: string;
}

// Chronological (oldest → newest) series for charts.
export interface SnapshotSeries {
  revenue: number[];
  fcf: number[];
  fcfMargin: number[];
  netIncome: number[];
}

export interface ScoreResult {
  ticker: string;
  name: string;
  composite: number;       // 0-100
  band: Band;
  pillars: PillarResult[];
  series: SnapshotSeries;
  gateApplied: boolean;
  gateNote?: string;
  marketCap: number;
  price: number;
  asOf: string;
  source: string;
}

// Structured output of the AI analyst memo.
export interface AnalystMemo {
  ticker: string;
  thesis: string;
  bull: string[];
  bear: string[];
  scoreReconciliation: string;
  whatWouldChangeIt: string[];
  verdict: string;
  model: string;
}
