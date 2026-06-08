import type { FinancialSnapshot } from "../types";

// Financial Modeling Prep provider. Swap this file (and the import in
// app/api/score/route.ts) to move to Polygon, Finnhub, Alpha Vantage, etc.
// Each provider just has to return a FinancialSnapshot.

const BASE = "https://financialmodelingprep.com/api/v3";

async function fmp(path: string, key: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}apikey=${key}`, {
    // cache fundamentals for an hour; they don't change intraday
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`FMP request failed (${res.status}) for ${path.split("?")[0]}`);
  }
  return res.json();
}

const num = (x: unknown): number => (typeof x === "number" ? x : 0);

export async function fetchSnapshot(
  ticker: string,
  key: string
): Promise<FinancialSnapshot> {
  const t = ticker.toUpperCase();

  const [income, cash, balance, metrics, quote, profile] = await Promise.all([
    fmp(`/income-statement/${t}?period=annual&limit=5`, key),
    fmp(`/cash-flow-statement/${t}?period=annual&limit=5`, key),
    fmp(`/balance-sheet-statement/${t}?period=annual&limit=5`, key),
    fmp(`/key-metrics/${t}?period=annual&limit=5`, key),
    fmp(`/quote/${t}`, key),
    fmp(`/profile/${t}`, key),
  ]);

  if (!Array.isArray(income) || income.length === 0) {
    throw new Error(`No fundamentals found for "${t}". Check the ticker symbol.`);
  }

  const q = quote?.[0] ?? {};
  const p = profile?.[0] ?? {};
  const b0 = balance?.[0] ?? {};

  return {
    ticker: t,
    name: p.companyName ?? t,
    marketCap: num(q.marketCap) || num(p.mktCap),
    price: num(q.price),
    revenue: income.map((r: any) => num(r.revenue)),
    fcf: cash.map((r: any) => num(r.freeCashFlow)),
    netIncome: income.map((r: any) => num(r.netIncome)),
    ebitda: income.map((r: any) => num(r.ebitda)),
    netDebt: balance.map(
      (r: any) =>
        num(r.totalDebt) -
        (num(r.cashAndCashEquivalents) || num(r.cashAndShortTermInvestments))
    ),
    shortTermDebt: num(b0.shortTermDebt),
    cash: num(b0.cashAndCashEquivalents) || num(b0.cashAndShortTermInvestments),
    evEbitda: metrics.map((m: any) => num(m.enterpriseValueOverEBITDA)),
    source: "fmp",
    asOf: income[0]?.date ?? new Date().toISOString().slice(0, 10),
  };
}
