"use client";

import { CHECKPOINTS, GOLD, QUESTIONS, QUESTION_LABELS } from "@/lib/data";
import { lengthDelta } from "./CompareTab";
import { AnswerCard, QuestionCard, Verdict } from "./ui";

export const LAST = CHECKPOINTS.length - 1;

function stepLabel(step: number) {
  return step === 0 ? "base model" : `step ${step}`;
}

// 0 and 1000 always; 200..800 from sm up; odd hundreds never (too cramped)
function tickLabelClass(step: number) {
  if (step === 0 || step === 1000) return "block";
  return step % 200 === 0 ? "invisible sm:visible" : "invisible";
}

export function WatchTab({
  q,
  setQ,
  idx,
  setIdx,
  playing,
  setPlaying,
  goCompare,
}: {
  q: number;
  setQ: (q: number) => void;
  idx: number;
  setIdx: (i: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  goCompare: () => void;
}) {
  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (idx >= LAST) setIdx(0);
    setPlaying(true);
  };

  const cp = CHECKPOINTS[idx];
  const ans = cp.answers[q];
  const baseLen = CHECKPOINTS[0].answers[q].length;
  const pct = (idx / LAST) * 100;

  return (
    <div>
      <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-2">
        8 random test questions. On these, training mostly changed the format and length of answers, not
        correctness. See{" "}
        <button onClick={goCompare} className="font-medium text-accent-ink underline underline-offset-2">
          Before vs after
        </button>{" "}
        for the accuracy gain.
      </p>

      {/* Question picker: status before training -> after 1,000 steps */}
      <div role="radiogroup" aria-label="Question" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUESTION_LABELS.map((label, i) => {
          const before = CHECKPOINTS[0].answers[i].correct;
          const after = CHECKPOINTS[LAST].answers[i].correct;
          const active = i === q;
          return (
            <button
              key={i}
              role="radio"
              aria-checked={active}
              aria-label={`Question ${i + 1}: ${label}. Base ${before ? "right" : "wrong"}, after training ${after ? "right" : "wrong"}`}
              onClick={() => setQ(i)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                active ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface text-ink-2 hover:border-ink-3"
              }`}
            >
              <span className="min-w-0 truncate">
                <span className="mr-1.5 font-mono text-xs text-ink-3">Q{i + 1}</span>
                {label}
              </span>
              <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
                <Verdict correct={before} size="sm" />
                <span className="text-[10px] text-ink-3">→</span>
                <Verdict correct={after} size="sm" />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-3">Marks show base model → after 1,000 steps.</p>

      <div className="mt-4">
        <QuestionCard question={QUESTIONS[q]} gold={GOLD[q]} />
      </div>

      {/* Step control (sticky so it stays reachable while reading long answers) */}
      <div className="sticky top-0 z-10 -mx-4 mt-5 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent hover:opacity-90"
            aria-label={playing ? "Pause autoplay" : "Autoplay through checkpoints"}
          >
            <span aria-hidden className="w-3 text-center">
              {playing ? "❚❚" : "▶"}
            </span>
            {playing ? "Pause" : "Play"}
          </button>
          <span className="text-sm font-semibold text-ink tabular-nums">
            {cp.step === 0 ? "Step 0 (base model)" : `Step ${cp.step}`}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={LAST}
          step={1}
          value={idx}
          onChange={(e) => {
            setPlaying(false);
            setIdx(Number(e.target.value));
          }}
          aria-label="Training step"
          aria-valuetext={stepLabel(cp.step)}
          className="scrub mt-2 w-full"
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
        />

        {/* Per-step result for this question, aligned under the slider */}
        <div className="flex justify-between px-[9px]" aria-hidden>
          {CHECKPOINTS.map((c, i) => {
            const ok = c.answers[q].correct;
            return (
              <div key={c.step} className="flex w-0 flex-col items-center">
                <button
                  tabIndex={-1}
                  onClick={() => {
                    setPlaying(false);
                    setIdx(i);
                  }}
                  className="flex h-6 w-6 items-center justify-center"
                  title={`${stepLabel(c.step)}: ${ok ? "correct" : "wrong"}`}
                >
                  <span
                    className={`block rounded-full transition-all ${ok ? "bg-good" : "bg-bad"} ${
                      i === idx ? "h-3 w-3 ring-2 ring-ink ring-offset-2 ring-offset-bg" : "h-2 w-2 opacity-70"
                    }`}
                  />
                </button>
                <span className={`text-[10px] tabular-nums text-ink-3 ${tickLabelClass(c.step)}`}>{c.step}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-1 hidden text-xs text-ink-3 sm:block">
          Dots: was this question answered correctly at each checkpoint? (green right, red wrong)
        </p>
      </div>

      <div className="mt-5">
        <AnswerCard
          answer={ans}
          animKey={`${q}-${idx}`}
          lengthNote={idx > 0 ? lengthDelta(ans.length, baseLen) : undefined}
        />
      </div>
    </div>
  );
}
