"use client";

import { useMemo, useState } from "react";
import curated from "@/data/eval_curated.json";
import { grade } from "@/lib/answer";
import { AnswerCard, QuestionCard } from "./ui";

type Row = { id: number; question: string; gold: string; base: string; grpo: string };
type PoolFile = { total: number; fixed: number[]; broken: number[]; random: number[]; rows: Row[] };
type Pool = PoolFile & { byId: Map<number, Row> };
type Filter = "fixed" | "broken" | "random";

// The full pool (all fixed + all broken + a random sample) is ~180 KB gzipped,
// so it's only fetched when someone leaves the default "Fixed" view.
let poolPromise: Promise<Pool> | null = null;
function loadPool(): Promise<Pool> {
  poolPromise ??= fetch("/data/eval_pool.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<PoolFile>;
    })
    .then((p) => ({ ...p, byId: new Map(p.rows.map((r) => [r.id, r])) }))
    .catch((e) => {
      poolPromise = null;
      throw e;
    });
  return poolPromise;
}

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FILTERS: { key: Filter; label: string; count: number; help: string }[] = [
  {
    key: "fixed",
    label: "Fixed by GRPO",
    count: curated.fixedCount,
    help: `${curated.rows.length} hand-picked from the ${curated.fixedCount}: base answer clearly wrong, GRPO answer short enough to read.`,
  },
  {
    key: "broken",
    label: "Broken by GRPO",
    count: curated.brokenCount,
    help: `All ${curated.brokenCount}, in random order.`,
  },
  {
    key: "random",
    label: "Random",
    count: curated.randomCount,
    help: `${curated.randomCount} questions sampled uniformly from all ${curated.total.toLocaleString()}, in random order. Includes ones both models get right or wrong.`,
  },
];

export function CompareTab() {
  const [filter, setFilter] = useState<Filter>("fixed");
  const [pos, setPos] = useState<Record<Filter, number>>({ fixed: 0, broken: 0, random: 0 });
  const [orders, setOrders] = useState<Partial<Record<Filter, number[]>>>({});
  const [pool, setPool] = useState<Pool | null>(null);
  const [error, setError] = useState(false);

  const choose = async (f: Filter) => {
    setFilter(f);
    if (f === "fixed" || orders[f]) return;
    try {
      setError(false);
      const p = pool ?? (await loadPool());
      setPool(p);
      setOrders((o) => (o[f] ? o : { ...o, [f]: shuffled(p[f]) }));
    } catch {
      setError(true);
    }
  };

  let row: Row | null = null;
  let total = 0;
  if (filter === "fixed") {
    total = curated.rows.length;
    row = curated.rows[pos.fixed % total];
  } else if (pool && orders[filter]) {
    const order = orders[filter]!;
    total = order.length;
    row = pool.byId.get(order[pos[filter] % total]) ?? null;
  }

  const graded = useMemo(
    () => (row ? { base: grade(row.base, row.gold), grpo: grade(row.grpo, row.gold) } : null),
    [row],
  );

  const outcome = graded
    ? graded.base.correct
      ? graded.grpo.correct
        ? "Both right"
        : "Broken by GRPO"
      : graded.grpo.correct
        ? "Fixed by GRPO"
        : "Both wrong"
    : "";

  const help = FILTERS.find((f) => f.key === filter)!.help;

  return (
    <div>
      <div role="radiogroup" aria-label="Which questions to show" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              role="radio"
              aria-checked={active}
              onClick={() => choose(f.key)}
              onPointerEnter={() => f.key !== "fixed" && loadPool().catch(() => {})}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-line bg-surface text-ink-2 hover:border-ink-3"
              }`}
            >
              {f.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                  active ? "bg-surface text-ink" : "bg-bg text-ink-3"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        GRPO fixed 227 questions and broke 128, net +99 (+7.5 pts). The &lsquo;Broken&rsquo; tab is there so
        you can see it&rsquo;s not cherry-picked.
      </p>
      <p className="mt-1 text-xs text-ink-3">{help}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-ink-3 tabular-nums">
          {row ? (
            <>
              {(pos[filter] % total) + 1} of {total}
              <span className="ml-2 hidden sm:inline">· test question #{row.id}</span>
            </>
          ) : error ? (
            "Couldn't load the examples."
          ) : (
            "Loading examples…"
          )}
        </span>
        <button
          onClick={() => (row ? setPos((p) => ({ ...p, [filter]: p[filter] + 1 })) : choose(filter))}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent hover:opacity-90"
        >
          {row || !error ? "Show another" : "Retry"}
          <span aria-hidden>→</span>
        </button>
      </div>

      {row && graded ? (
        <>
          <div className="mt-3">
            <QuestionCard question={row.question} gold={row.gold}>
              <span className="rounded-md bg-bg px-2 py-0.5 text-xs text-ink-2">{outcome}</span>
            </QuestionCard>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <AnswerCard title="Base model" answer={graded.base} animKey={`b-${row.id}`} clampOnMobile />
            <AnswerCard
              title="After GRPO (step 1,000)"
              answer={graded.grpo}
              animKey={`g-${row.id}`}
              lengthNote={lengthDelta(graded.grpo.length, graded.base.length)}
            />
          </div>
        </>
      ) : (
        <div className="mt-3 h-64 animate-pulse rounded-xl border border-line bg-surface motion-reduce:animate-none" />
      )}
    </div>
  );
}

export function lengthDelta(len: number, baseLen: number) {
  const d = Math.round(((len - baseLen) / baseLen) * 100);
  return `${d > 0 ? "+" : ""}${d}% vs base`;
}
