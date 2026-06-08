"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScoreResult, Weights } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { WeightStudio } from "@/components/WeightStudio";
import { Screener } from "@/components/Screener";
import { DeepDive } from "@/components/DeepDive";
import { Compare } from "@/components/Compare";

type Tab = "screener" | "deepdive" | "compare";

const SEED = ["DEMOQ", "DEMOG", "DEMOL"];

export default function Home() {
  const [weights, setWeights, wLoaded] = useLocalStorage<Weights>("esf:weights", DEFAULT_WEIGHTS);
  const [watchlist, setWatchlist, wlLoaded] = useLocalStorage<string[]>("esf:watchlist", SEED);
  const [compare, setCompare] = useLocalStorage<string[]>("esf:compare", []);

  const [results, setResults] = useState<ScoreResult[]>([]);
  const [errors, setErrors] = useState<{ ticker: string; error: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("screener");
  const [selected, setSelected] = useState<string | null>(null);

  // re-score the whole watchlist whenever it or the weights change (debounced)
  useEffect(() => {
    if (!wlLoaded || !wLoaded) return;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/screen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tickers: watchlist, weights }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setErrors(data.errors ?? []);
      } catch {
        /* aborted or network */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [watchlist, weights, wlLoaded, wLoaded]);

  const compareSet = useMemo(() => new Set(compare), [compare]);
  const compareItems = useMemo(
    () => results.filter((r) => compareSet.has(r.ticker)),
    [results, compareSet]
  );
  const selectedResult = useMemo(
    () => results.find((r) => r.ticker === selected) ?? null,
    [results, selected]
  );

  function addTicker(t: string) {
    setWatchlist((prev) => (prev.includes(t) ? prev : [...prev, t]));
  }
  function removeTicker(t: string) {
    setWatchlist((prev) => prev.filter((x) => x !== t));
    setCompare((prev) => prev.filter((x) => x !== t));
  }
  function selectTicker(t: string) {
    setSelected(t);
    setTab("deepdive");
  }
  function toggleCompare(t: string) {
    setCompare((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 3 ? prev : [...prev, t]
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "screener", label: "Screener" },
    { id: "deepdive", label: "Deep Dive" },
    { id: "compare", label: `Compare${compare.length ? ` (${compare.length})` : ""}` },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b-2 border-ink pb-5">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <span>Eight-Pillar Framework</span>
          <span>Research Terminal</span>
        </div>
        <h1 className="mt-3 font-display text-5xl font-medium leading-none tracking-tight text-ink sm:text-6xl">
          Equity Score
        </h1>
        <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-ink-soft">
          Score a whole watchlist, tune the rubric to a house view, dive into any
          name&apos;s trend history, and generate a reconciled analyst memo.
        </p>
      </header>

      <div className="mt-6">
        <WeightStudio weights={weights} onChange={setWeights} />
      </div>

      {/* tabs */}
      <nav className="mt-7 flex items-center gap-1 border-b border-hair">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-body relative px-4 py-2.5 text-[14px] transition-colors ${
              tab === t.id ? "font-semibold text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-[2px] bg-ink" />}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "screener" && (
          <Screener
            results={results}
            errors={errors}
            loading={loading}
            onAdd={addTicker}
            onRemove={removeTicker}
            onSelect={selectTicker}
            compareSet={compareSet}
            onToggleCompare={toggleCompare}
          />
        )}

        {tab === "deepdive" &&
          (selectedResult ? (
            <DeepDive r={selectedResult} weights={weights} />
          ) : (
            <div className="rounded-lg border border-dashed border-hair-strong px-4 py-10 text-center font-body text-[14px] text-ink-soft">
              Pick a name from the screener to open its deep dive.
            </div>
          ))}

        {tab === "compare" && <Compare items={compareItems} />}
      </div>

      <footer className="mt-14 border-t border-hair pt-5 font-body text-[12px] leading-relaxed text-ink-soft">
        Weights normalize to 100; a near-term debt-coverage shortfall trips a hard
        gate that caps the composite. Watchlist, weights, and comparison set persist
        in your browser. Sample tickers use bundled data; set{" "}
        <span className="font-mono">FMP_API_KEY</span> for live fundamentals and{" "}
        <span className="font-mono">ANTHROPIC_API_KEY</span> for the analyst memo.
        Not investment advice.
      </footer>
    </main>
  );
}
