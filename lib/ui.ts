import type { Band } from "./types";

export const BAND_STYLE: Record<Band, { color: string; soft: string }> = {
  "High Conviction": { color: "var(--good)", soft: "var(--good-soft)" },
  Quality: { color: "var(--quality)", soft: "var(--good-soft)" },
  Mixed: { color: "var(--mixed)", soft: "var(--caution-soft)" },
  "Elevated Scrutiny": { color: "var(--caution)", soft: "var(--caution-soft)" },
  Avoid: { color: "var(--avoid)", soft: "var(--avoid-soft)" },
};

export function bandColor(band: Band): string {
  return BAND_STYLE[band].color;
}

export function pillarColor(score: number): string {
  if (score >= 7.5) return "var(--good)";
  if (score >= 5) return "var(--mixed)";
  if (score >= 3) return "var(--caution)";
  return "var(--avoid)";
}

export function fmtCap(n: number): string {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
