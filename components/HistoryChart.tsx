"use client";

import { useCallback, useEffect, useState } from "react";
import type { HistoryPoint } from "@/lib/db";
import { bandColor } from "@/lib/ui";
import type { Band } from "@/lib/types";

const W = 360;
const H = 150;
const PAD = { l: 30, r: 10, t: 12, b: 22 };
const THRESHOLDS = [35, 50, 65, 80];

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function HistoryChart({ ticker }: { ticker: string }) {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?ticker=${encodeURIComponent(ticker)}`);
      const data = await res.json();
      setEnabled(data.enabled);
      setPoints(data.points ?? []);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    load();
  }, [load]);

  async function snapshot() {
    setRecording(true);
    try {
      await fetch("/api/snapshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tickers: [ticker] }),
      });
      await load();
    } finally {
      setRecording(false);
    }
  }

  const header = (
    <div className="flex items-center justify-between">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        Composite History
      </div>
      {enabled && (
        <button
          onClick={snapshot}
          disabled={recording}
          className="font-mono text-[12px] text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
        >
          {recording ? "Recording…" : "Record snapshot"}
        </button>
      )}
    </div>
  );

  let body;
  if (loading) {
    body = <div className="mt-3 font-mono text-[13px] text-ink-soft">Loading history…</div>;
  } else if (!enabled) {
    body = (
      <p className="mt-3 font-body text-[13px] leading-relaxed text-ink-soft">
        Connect a <span className="font-mono">DATABASE_URL</span> and the nightly
        job will track this composite over time. (See the README — Neon&apos;s free
        tier takes about two minutes.)
      </p>
    );
  } else if (points.length < 2) {
    body = (
      <div className="mt-3">
        <p className="font-body text-[13px] leading-relaxed text-ink-soft">
          {points.length === 0
            ? "No snapshots yet."
            : "Just one snapshot so far — the line needs at least two points."}{" "}
          Hit “Record snapshot” a few times, or let the nightly cron accrue
          history.
        </p>
      </div>
    );
  } else {
    const vals = points.map((p) => p.composite);
    const latestBand = points[points.length - 1].band as Band;
    const color = bandColor(latestBand);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const x = (i: number) => PAD.l + (i / (points.length - 1)) * innerW;
    const y = (v: number) => PAD.t + (1 - v / 100) * innerH;

    const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    const delta = last.composite - first.composite;

    body = (
      <div className="mt-2">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold leading-none" style={{ color }}>
            {last.composite}
          </span>
          <span
            className="font-mono text-[13px]"
            style={{ color: delta >= 0 ? "var(--good)" : "var(--avoid)" }}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} since {shortDate(first.scoredAt)}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
          {THRESHOLDS.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--hair)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <text x={4} y={y(t) + 3} className="font-mono" fontSize="9" fill="var(--ink-soft)">
                {t}
              </text>
            </g>
          ))}
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.composite)} r="2.2" fill={color} />
          ))}
          <text x={PAD.l} y={H - 6} className="font-mono" fontSize="9" fill="var(--ink-soft)">
            {shortDate(first.scoredAt)}
          </text>
          <text
            x={W - PAD.r}
            y={H - 6}
            textAnchor="end"
            className="font-mono"
            fontSize="9"
            fill="var(--ink-soft)"
          >
            {shortDate(last.scoredAt)}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-hair-strong bg-paper-raised p-5">
      {header}
      {body}
    </div>
  );
}
