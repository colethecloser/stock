import type { Weights } from "./types";
import { DEFAULT_WEIGHTS } from "./scoring";

// Each preset is a different house view. They sum to 100 for readability, but
// the engine normalizes anyway, so custom user weights can be anything.
export const PRESETS: { id: string; label: string; blurb: string; weights: Weights }[] = [
  {
    id: "balanced",
    label: "Balanced",
    blurb: "Even-handed across quality, value, and growth.",
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: "quality",
    label: "Quality",
    blurb: "Durable margins, clean balance sheets, cash-backed earnings.",
    weights: {
      ruleOf40: 12,
      growthConsistency: 14,
      fcfMarginTrend: 18,
      netLeverage: 14,
      fcfYield: 8,
      debtMaturity: 10,
      reRating: 4,
      earningsQuality: 20,
    },
  },
  {
    id: "value",
    label: "Value",
    blurb: "Cash yield, balance-sheet safety, multiple re-rating.",
    weights: {
      ruleOf40: 6,
      growthConsistency: 6,
      fcfMarginTrend: 10,
      netLeverage: 16,
      fcfYield: 28,
      debtMaturity: 14,
      reRating: 16,
      earningsQuality: 4,
    },
  },
  {
    id: "growth",
    label: "Growth",
    blurb: "Rule of 40, durable compounding, expanding margins.",
    weights: {
      ruleOf40: 24,
      growthConsistency: 22,
      fcfMarginTrend: 18,
      netLeverage: 6,
      fcfYield: 4,
      debtMaturity: 6,
      reRating: 6,
      earningsQuality: 14,
    },
  },
];

export const PILLAR_LABELS: Record<keyof Weights, string> = {
  ruleOf40: "Rule of 40",
  growthConsistency: "Growth Consistency",
  fcfMarginTrend: "FCF Margin Trend",
  netLeverage: "Net Leverage",
  fcfYield: "FCF Yield",
  debtMaturity: "Debt Maturity Gate",
  reRating: "Re-Rating Kicker",
  earningsQuality: "Earnings Quality",
};
