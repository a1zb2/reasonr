"use client";

import { useState } from "react";
import type { Graded } from "@/lib/answer";
import { AnswerView } from "./AnswerView";

export function Verdict({ correct, size = "md" }: { correct: boolean; size?: "sm" | "md" }) {
  const base =
    size === "sm"
      ? "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none"
      : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold";
  const tone = correct ? "bg-good-soft text-good" : "bg-bad-soft text-bad";
  return (
    <span className={`${base} ${tone}`}>
      <span aria-hidden>{correct ? "✓" : "✗"}</span>
      {size === "md" && (correct ? "Correct" : "Wrong")}
    </span>
  );
}

/** Badge + stats row + rendered answer. Used by both tabs so they look the same. */
export function AnswerCard({
  answer,
  title,
  lengthNote,
  animKey,
  clampOnMobile,
}: {
  answer: Graded;
  title?: string;
  lengthNote?: string;
  animKey?: string;
  clampOnMobile?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
      {title && <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Verdict correct={answer.correct} />
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-ink-3">Extracted</dt>
            <dd className="font-semibold text-ink tabular-nums">{answer.extracted ?? "none"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-3">Length</dt>
            <dd className="text-ink tabular-nums">
              {answer.length.toLocaleString()} chars
              {lengthNote && <span className="ml-1 text-ink-3">({lengthNote})</span>}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-3">Format</dt>
            <dd className="text-ink">{answer.format ? "followed" : "not followed"}</dd>
          </div>
        </dl>
      </div>
      {clampOnMobile && answer.length > CLAMP_CHARS ? (
        <Clamped key={animKey}>
          <AnswerView text={answer.text} />
        </Clamped>
      ) : (
        <div key={animKey} className="fade-in">
          <AnswerView text={answer.text} />
        </div>
      )}
    </div>
  );
}

const CLAMP_CHARS = 450;

/** On narrow screens, cap a long answer so the one below it stays in view. No effect from md up. */
function Clamped({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fade-in">
      <div className={open ? "" : "relative max-h-72 overflow-hidden md:max-h-none md:overflow-visible"}>
        {children}
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface to-transparent md:hidden" />
        )}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-2 text-sm font-medium text-accent-ink underline underline-offset-2 md:hidden"
      >
        {open ? "Collapse" : "Show full answer"}
      </button>
    </div>
  );
}

export function QuestionCard({ question, gold, children }: { question: string; gold: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-[15px] leading-relaxed text-ink">{question}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-3">
        <span>
          Correct answer: <span className="font-semibold text-ink tabular-nums">{gold}</span>
        </span>
        {children}
      </div>
    </div>
  );
}
