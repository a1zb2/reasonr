"use client";

import { useEffect, useState } from "react";
import { CHECKPOINTS, GITHUB_URL } from "@/lib/data";
import { CompareTab } from "./CompareTab";
import { SidePanel } from "./SidePanel";
import { LAST, WatchTab } from "./WatchTab";

type Tab = "compare" | "watch";
const PLAY_MS = 1400;

const TABS: { key: Tab; label: string }[] = [
  { key: "compare", label: "Before vs after" },
  { key: "watch", label: "Watch it learn" },
];

export function Demo() {
  const [tab, setTab] = useState<Tab>("compare");
  // "Watch it learn" state lives here so it survives tab switches and the chart can show the step
  const [q, setQ] = useState(0);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Autoplay: advance one checkpoint per tick, stop on the last one
  useEffect(() => {
    if (!playing || tab !== "watch") return;
    const t = setTimeout(
      () => (idx >= LAST ? setPlaying(false) : setIdx(idx + 1)),
      idx >= LAST ? 0 : PLAY_MS,
    );
    return () => clearTimeout(t);
  }, [playing, idx, tab]);

  const switchTab = (t: Tab) => {
    setPlaying(false);
    setTab(t);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Reasonr{" "}
            <span className="font-normal text-ink-3">/ teaching a 0.5B model math with RL</span>
          </h1>
          <a href={GITHUB_URL} className="text-sm text-accent-ink underline-offset-4 hover:underline">
            Code and write-up on GitHub
          </a>
        </div>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-2">
          <span className="font-medium text-ink">What am I looking at?</span> A small language model
          (Qwen2.5-0.5B, about 0.5 billion parameters) trained with reinforcement learning to solve
          grade-school math word problems. It never sees worked solutions. It writes an answer, gets a score
          (points for the right final number, a little extra for putting its work in{" "}
          <code className="font-mono text-[13px] text-think-ink">&lt;think&gt;</code> and its result in{" "}
          <code className="font-mono text-[13px] text-accent-ink">&lt;answer&gt;</code>), and slowly shifts
          toward whatever scored well. <span className="font-medium text-ink">Before vs after</span> puts the
          original and trained model side by side on the same test question.{" "}
          <span className="font-medium text-ink">Watch it learn</span> replays a few questions at checkpoints
          during training.
        </p>
      </header>

      <div role="tablist" aria-label="View" className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => switchTab(t.key)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-accent text-on-accent" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare" hidden={tab !== "compare"}>
            <CompareTab />
          </div>
          <div role="tabpanel" id="panel-watch" aria-labelledby="tab-watch" hidden={tab !== "watch"}>
            <WatchTab
              q={q}
              setQ={setQ}
              idx={idx}
              setIdx={setIdx}
              playing={playing}
              setPlaying={setPlaying}
              goCompare={() => switchTab("compare")}
            />
          </div>
        </main>
        <SidePanel currentStep={tab === "watch" ? CHECKPOINTS[idx].step : null} />
      </div>
    </div>
  );
}
