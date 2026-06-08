import type { FinancialSnapshot } from "./types";

// Illustrative sample companies (NOT real tickers). They exist so the app
// renders a full scoring run the moment it deploys, before any API key is set.
// Each one is engineered to land in a different band so you can see the
// framework discriminate. Figures are absolute USD.

const COMPANIES: Record<string, FinancialSnapshot> = {
  // ── A clean compounder: durable growth, fat & rising FCF margins, net cash,
  //    high cash conversion. Should land High Conviction / Quality.
  DEMOQ: {
    ticker: "DEMOQ",
    name: "Demo Quality Compounder",
    marketCap: 420_000_000_000,
    price: 310,
    revenue: [62_000, 53_000, 46_000, 40_500].map((x) => x * 1e6),
    fcf: [19_000, 15_900, 13_340, 11_300].map((x) => x * 1e6),
    netIncome: [16_000, 13_500, 11_500, 9_800].map((x) => x * 1e6),
    ebitda: [24_000, 20_500, 17_800, 15_600].map((x) => x * 1e6),
    netDebt: [-15_000, -12_000, -9_000, -6_000].map((x) => x * 1e6),
    shortTermDebt: 2_000 * 1e6,
    cash: 30_000 * 1e6,
    evEbitda: [18, 23, 21, 20], // below its own history → re-rating setup
    source: "mock",
    asOf: "2024-12-31",
  },

  // ── A hypergrowth name: huge top-line, improving but modest FCF margins,
  //    LOW earnings quality (cash lags reported profit) and a premium,
  //    rising multiple. Great Rule of 40, but flagged → Elevated Scrutiny.
  DEMOG: {
    ticker: "DEMOG",
    name: "Demo Hypergrowth",
    marketCap: 95_000_000_000,
    price: 280,
    revenue: [4_800, 3_300, 2_100, 1_500].map((x) => x * 1e6),
    fcf: [620, 360, 150, 80].map((x) => x * 1e6),
    netIncome: [1_400, 720, 260, 70].map((x) => x * 1e6), // reported profit outruns cash
    ebitda: [1_100, 700, 320, 150].map((x) => x * 1e6),
    netDebt: [800, 600, 400, 300].map((x) => x * 1e6),
    shortTermDebt: 300 * 1e6,
    cash: 1_500 * 1e6,
    evEbitda: [42, 38, 30, 25],
    source: "mock",
    asOf: "2024-12-31",
  },

  // ── A levered value name: flat revenue, decent FCF yield and cheap vs its
  //    own history, but 4.5x net leverage and near-term maturities it can't
  //    cover → trips the debt-maturity gate → capped to Avoid territory.
  DEMOL: {
    ticker: "DEMOL",
    name: "Demo Levered Value",
    marketCap: 8_000_000_000,
    price: 22,
    revenue: [12_000, 11_800, 11_900, 11_500].map((x) => x * 1e6),
    fcf: [650, 700, 600, 720].map((x) => x * 1e6),
    netIncome: [400, 450, 380, 500].map((x) => x * 1e6),
    ebitda: [1_400, 1_450, 1_380, 1_500].map((x) => x * 1e6),
    netDebt: [6_300, 6_500, 6_400, 6_200].map((x) => x * 1e6),
    shortTermDebt: 2_200 * 1e6,
    cash: 400 * 1e6,
    evEbitda: [6.5, 7, 8, 9],
    source: "mock",
    asOf: "2024-12-31",
  },
};

export const MOCK_TICKERS = Object.keys(COMPANIES);

export function getMock(ticker: string): FinancialSnapshot | null {
  return COMPANIES[ticker.toUpperCase()] ?? null;
}
