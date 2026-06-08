"use client";

import type { ScoreResult, Weights, PillarResult } from "@/lib/types";
import { BAND_STYLE, pillarColor, fmtCap } from "@/lib/ui";
import { Sparkline } from "./Sparkline";
import { HistoryChart } from "./HistoryChart";
import { AnalystMemo } from "./AnalystMemo";

function PillarRow({ p, i }: { p: PillarResult; i: number }) {
  return (
    <div
      className="rise grid grid-cols-[1fr] gap-1 border-t border-hair py-4 sm:grid-cols-[200px_1fr]"
      style={{ animationDelay: `${0.04 * i + 0.05}s` }}
    >
      <div className="flex items-baseline justify-between sm:block">
        <div className="font-body text-[15px] font-semibold text-ink">{p.label}</div>
        <div className="font-mono text-xs text-ink-soft">
          {p.weight}% · {p.score.toFixed(1)}/10
        </div>
      </div>
      <div>
        <div className="mb-1.5 h-[6px] w-full overflow-hidden rounded-full bg-hair">
          <div
            className="bar-grow h-full rounded-full"
            style={{
              width: `${(p.score / 10) * 100}%`,
              background: pillarColor(p.score),
              animationDelay: `${0.04 * i + 0.1}s`,
            }}
          />
        </div>
        <div className="font-mono text-[13px] text-ink">{p.metric}</div>
        <div className="mt-0.5 font-body text-[13px] leading-snug text-ink-soft">{p.detail}</div>
      </div>
    </div>
  );
}

function TrendCard({
  label,
  data,
  color,
  fmt,
}: {
  label: string;
  data: number[];
  color: string;
  fmt: (n: number) => string;
}) {
  const latest = data[data.length - 1] ?? 0;
  const first = data[0] ?? 0;
  const delta = first ? (latest - first) / Math.abs(first) : 0;
  return (
    <div className="rounded-lg border border-hair bg-paper-raised p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="font-mono text-[16px] text-ink">{fmt(latest)}</div>
        <Sparkline data={data} color={color} width={110} height={34} />
      </div>
      <div
        className="font-mono mt-1 text-[11px]"
        style={{ color: delta >= 0 ? "var(--good)" : "var(--avoid)" }}
      >
        {delta >= 0 ? "+" : ""}
        {(delta * 100).toFixed(0)}% over window
      </div>
    </div>
  );
}

export function DeepDive({ r, weights }: { r: ScoreResult; weights: Weights }) {
  const band = BAND_STYLE[r.band];
  const fmtB = (n: number) => `$${(n / 1e9).toFixed(2)}B`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <section>
      <div className="rise rounded-lg border border-hair-strong p-6" style={{ background: band.soft }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-ink-soft">
              {r.ticker} · {r.source === "mock" ? "Sample data" : "Live · FMP"}
            </div>
            <div className="mt-1 font-display text-2xl font-medium text-ink">{r.name}</div>
            <div className="mt-1 font-mono text-[13px] text-ink-soft">
              {fmtCap(r.marketCap)} cap · FY {r.asOf}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-6xl font-semibold leading-none" style={{ color: band.color }}>
              {r.composite}
            </div>
            <div
              className="font-mono mt-1 text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: band.color }}
            >
              {r.band}
            </div>
          </div>
        </div>
        {r.gateApplied && r.gateNote && (
          <div className="mt-4 border-t border-hair-strong pt-3 font-body text-[13px] leading-snug text-avoid">
            ⚠ {r.gateNote}
          </div>
        )}
      </div>

      {/* trends */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TrendCard label="Revenue" data={r.series.revenue} color="var(--ink)" fmt={fmtB} />
        <TrendCard label="Free cash flow" data={r.series.fcf} color="var(--good)" fmt={fmtB} />
        <TrendCard label="FCF margin" data={r.series.fcfMargin} color="var(--quality)" fmt={fmtPct} />
      </div>

      {/* pillars */}
      <div className="mt-7">
        <div className="font-mono mb-1 text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Pillar Breakdown
        </div>
        {r.pillars.map((p, i) => (
          <PillarRow key={p.key} p={p} i={i} />
        ))}
        <div className="border-t border-hair" />
      </div>

      <HistoryChart ticker={r.ticker} />

      <AnalystMemo ticker={r.ticker} weights={weights} />
    </section>
  );
}
