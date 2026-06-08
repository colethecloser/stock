"use client";

import { useState } from "react";
import type { Weights } from "@/lib/types";
import { PRESETS, PILLAR_LABELS } from "@/lib/presets";

const KEYS = Object.keys(PILLAR_LABELS) as (keyof Weights)[];

function matchPreset(w: Weights): string | null {
  for (const p of PRESETS) {
    if (KEYS.every((k) => Math.round(p.weights[k]) === Math.round(w[k]))) return p.id;
  }
  return null;
}

export function WeightStudio({
  weights,
  onChange,
}: {
  weights: Weights;
  onChange: (w: Weights) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = matchPreset(weights);
  const total = KEYS.reduce((s, k) => s + Math.max(0, weights[k]), 0) || 1;

  return (
    <div className="rounded-lg border border-hair-strong bg-paper-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Strategy
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              title={p.blurb}
              onClick={() => onChange(p.weights)}
              className={`font-body rounded-full border px-3 py-1 text-[13px] transition-colors ${
                active === p.id
                  ? "border-ink bg-ink text-paper"
                  : "border-hair-strong text-ink hover:border-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
          {active === null && (
            <span className="font-mono rounded-full border border-dashed border-hair-strong px-3 py-1 text-[12px] text-ink-soft">
              Custom
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="font-mono text-[12px] text-ink-soft underline-offset-2 hover:underline"
        >
          {open ? "Hide weights" : "Tune weights"}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-hair pt-4 sm:grid-cols-2">
          {KEYS.map((k) => {
            const normalized = ((Math.max(0, weights[k]) / total) * 100).toFixed(0);
            return (
              <label key={k} className="block">
                <div className="flex items-baseline justify-between">
                  <span className="font-body text-[13px] text-ink">{PILLAR_LABELS[k]}</span>
                  <span className="font-mono text-[12px] text-ink-soft">{normalized}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={weights[k]}
                  onChange={(e) => onChange({ ...weights, [k]: Number(e.target.value) })}
                  className="mt-1 w-full accent-ink"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
