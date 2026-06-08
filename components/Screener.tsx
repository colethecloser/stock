"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/types";
import { bandColor, pillarColor, fmtCap } from "@/lib/ui";

function PillarStrip({ r }: { r: ScoreResult }) {
  return (
    <div className="flex items-end gap-[2px]" title="Pillar scores">
      {r.pillars.map((p) => (
        <span
          key={p.key}
          className="w-[5px] rounded-sm"
          style={{
            height: `${4 + (p.score / 10) * 14}px`,
            background: pillarColor(p.score),
          }}
        />
      ))}
    </div>
  );
}

export function Screener({
  results,
  errors,
  loading,
  onAdd,
  onRemove,
  onSelect,
  compareSet,
  onToggleCompare,
}: {
  results: ScoreResult[];
  errors: { ticker: string; error: string }[];
  loading: boolean;
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  onSelect: (t: string) => void;
  compareSet: Set<string>;
  onToggleCompare: (t: string) => void;
}) {
  const [input, setInput] = useState("");
  const [snapMsg, setSnapMsg] = useState<string | null>(null);
  const [snapping, setSnapping] = useState(false);

  function add() {
    const t = input.toUpperCase().trim();
    if (t) onAdd(t);
    setInput("");
  }

  async function snapshotAll() {
    setSnapping(true);
    setSnapMsg(null);
    try {
      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tickers: results.map((r) => r.ticker) }),
      });
      const data = await res.json();
      setSnapMsg(data.ok ? `Recorded ${data.recorded} snapshot${data.recorded === 1 ? "" : "s"}.` : data.message);
    } catch {
      setSnapMsg("Couldn't reach the snapshot endpoint.");
    } finally {
      setSnapping(false);
      setTimeout(() => setSnapMsg(null), 4000);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-stretch gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add ticker to watchlist…"
          spellCheck={false}
          className="font-mono w-full rounded-md border border-hair-strong bg-paper-raised px-3 py-2 text-[15px] uppercase tracking-wide text-ink outline-none focus:border-ink"
        />
        <button
          onClick={add}
          className="font-body shrink-0 rounded-md border border-ink px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Add
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-3 rounded-md border border-caution/40 bg-[var(--caution-soft)] px-3 py-2 font-body text-[12px] text-caution">
          Couldn&apos;t score: {errors.map((e) => e.ticker).join(", ")}.{" "}
          {errors[0]?.error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-hair">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hair bg-paper-raised font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              <th className="px-3 py-2 font-normal">#</th>
              <th className="px-3 py-2 font-normal">Ticker</th>
              <th className="px-3 py-2 font-normal">Score</th>
              <th className="hidden px-3 py-2 font-normal sm:table-cell">Band</th>
              <th className="hidden px-3 py-2 font-normal sm:table-cell">Pillars</th>
              <th className="hidden px-3 py-2 text-right font-normal md:table-cell">Cap</th>
              <th className="px-3 py-2 text-right font-normal">Cmp</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={r.ticker}
                className="group cursor-pointer border-b border-hair last:border-0 transition-colors hover:bg-paper-raised"
                onClick={() => onSelect(r.ticker)}
              >
                <td className="px-3 py-3 font-mono text-[12px] text-ink-soft">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="font-mono text-[14px] font-semibold text-ink">{r.ticker}</div>
                  <div className="max-w-[150px] truncate font-body text-[12px] text-ink-soft">
                    {r.name}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="font-display text-2xl font-semibold leading-none"
                    style={{ color: bandColor(r.band) }}
                  >
                    {r.composite}
                  </span>
                  {r.gateApplied && (
                    <span className="ml-1 font-mono text-[10px] text-avoid">⚠</span>
                  )}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <span
                    className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: bandColor(r.band) }}
                  >
                    {r.band}
                  </span>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <PillarStrip r={r} />
                </td>
                <td className="hidden px-3 py-3 text-right font-mono text-[13px] text-ink md:table-cell">
                  {fmtCap(r.marketCap)}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="checkbox"
                      checked={compareSet.has(r.ticker)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleCompare(r.ticker)}
                      className="h-4 w-4 accent-ink"
                      aria-label={`Compare ${r.ticker}`}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(r.ticker);
                      }}
                      className="font-mono text-[14px] leading-none text-ink-soft opacity-0 transition-opacity hover:text-avoid group-hover:opacity-100"
                      aria-label={`Remove ${r.ticker}`}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {results.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center font-body text-[14px] text-ink-soft">
                  Watchlist empty — add a ticker above.
                </td>
              </tr>
            )}
            {loading && results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center font-mono text-[13px] text-ink-soft">
                  Scoring…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-[12px] text-ink-soft">
          Click a row for the deep dive · check boxes to compare.
        </p>
        {results.length > 0 && (
          <div className="flex items-center gap-2">
            {snapMsg && <span className="font-mono text-[12px] text-ink-soft">{snapMsg}</span>}
            <button
              onClick={snapshotAll}
              disabled={snapping}
              className="font-mono text-[12px] text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
            >
              {snapping ? "Recording…" : "Record snapshot of all"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
