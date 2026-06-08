"use client";

import type { ScoreResult } from "@/lib/types";
import { bandColor, pillarColor } from "@/lib/ui";
import { PILLAR_LABELS } from "@/lib/presets";
import type { Weights } from "@/lib/types";

const KEYS = Object.keys(PILLAR_LABELS) as (keyof Weights)[];

export function Compare({ items }: { items: ScoreResult[] }) {
  if (items.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-hair-strong px-4 py-10 text-center font-body text-[14px] text-ink-soft">
        Select 2–3 names from the screener (the checkboxes) to compare them
        side by side.
      </div>
    );
  }

  // best score per pillar gets highlighted
  const bestByPillar: Record<string, number> = {};
  for (const k of KEYS) {
    bestByPillar[k] = Math.max(...items.map((it) => it.pillars.find((p) => p.key === k)?.score ?? 0));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-hair">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-hair bg-paper-raised">
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              Pillar
            </th>
            {items.map((it) => (
              <th key={it.ticker} className="px-3 py-3">
                <div className="font-mono text-[14px] font-semibold text-ink">{it.ticker}</div>
                <div className="font-display text-3xl font-semibold leading-none" style={{ color: bandColor(it.band) }}>
                  {it.composite}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: bandColor(it.band) }}>
                  {it.band}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KEYS.map((k) => (
            <tr key={k} className="border-b border-hair last:border-0">
              <td className="px-3 py-2.5 font-body text-[13px] text-ink-soft">{PILLAR_LABELS[k]}</td>
              {items.map((it) => {
                const p = it.pillars.find((pp) => pp.key === k);
                const score = p?.score ?? 0;
                const isBest = score === bestByPillar[k] && score > 0;
                return (
                  <td key={it.ticker} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[13px]"
                        style={{ color: pillarColor(score), fontWeight: isBest ? 700 : 400 }}
                      >
                        {score.toFixed(1)}
                      </span>
                      <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-hair">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${(score / 10) * 100}%`, background: pillarColor(score) }}
                        />
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
