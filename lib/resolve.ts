import type { FinancialSnapshot } from "./types";
import { getMock, MOCK_TICKERS } from "./mockData";
import { fetchSnapshot } from "./providers/fmp";

export class ResolveError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// Single source of truth for turning a ticker into a FinancialSnapshot.
// Demo tickers always use bundled data. Without an API key, everything else
// falls back to a helpful error.
export async function resolveSnapshot(rawTicker: string): Promise<FinancialSnapshot> {
  const ticker = rawTicker.toUpperCase().trim();
  if (!ticker) throw new ResolveError("Provide a ticker.", 400);

  const key = process.env.FMP_API_KEY;

  if (MOCK_TICKERS.includes(ticker) || !key) {
    const snap = getMock(ticker);
    if (!snap) {
      throw new ResolveError(
        `No FMP_API_KEY configured, so only demo tickers work right now. Try: ${MOCK_TICKERS.join(", ")}.`,
        404
      );
    }
    return snap;
  }

  return fetchSnapshot(ticker, key);
}
