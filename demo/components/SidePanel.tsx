import { HEADLINE } from "@/lib/data";
import { AccuracyChart } from "./AccuracyChart";

function pctFmt(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

function Stat({ label, before, after, unit }: { label: string; before: string; after: string; unit?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
        <span className="text-sm text-ink-3">{before}</span>
        <span aria-hidden className="text-xs text-ink-3">→</span>
        <span className="sr-only">to</span>
        <span className="text-lg font-semibold text-ink">{after}</span>
      </dd>
      {unit && <dd className="text-xs text-ink-3">{unit}</dd>}
    </div>
  );
}

/** currentStep is set only on the "Watch it learn" tab, where it draws the dashed marker. */
export function SidePanel({ currentStep }: { currentStep: number | null }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-ink">Full GSM8K test set</h2>
        <p className="text-xs text-ink-3">{HEADLINE.n.toLocaleString()} questions, base vs after 1,000 steps</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          <Stat label="Accuracy" before={pctFmt(HEADLINE.base.accuracy)} after={pctFmt(HEADLINE.grpo.accuracy)} />
          <Stat
            label="Uses the format"
            before={pctFmt(HEADLINE.base.format_rate)}
            after={pctFmt(HEADLINE.grpo.format_rate)}
          />
          <Stat
            label="Avg answer length"
            before={`${Math.round(HEADLINE.base.avg_len_chars)}`}
            after={`${Math.round(HEADLINE.grpo.avg_len_chars)}`}
            unit="chars"
          />
          <div>
            <dt className="text-xs text-ink-3">Fixed / broke</dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink tabular-nums">
              {HEADLINE.fixed} / {HEADLINE.broke}
            </dd>
            <dd className="text-xs text-ink-3">McNemar p &lt; 0.001</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-ink">Accuracy during training</h2>
        <p className="mb-3 text-xs text-ink-3">200 held-out test questions, checked every 200 steps</p>
        <AccuracyChart currentStep={currentStep} />
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          Peaked at step 400, then drifted down while the training reward stayed flat.
          {currentStep !== null && " The dashed line is the step you are viewing."}
        </p>
      </div>

      <p className="px-1 text-xs leading-relaxed text-ink-3">
        Answers are greedy (no sampling), so each one is exactly what the model would say. The badge uses the
        same rule as training: the number in <code className="font-mono">&lt;answer&gt;</code>, else in{" "}
        <code className="font-mono">\boxed{"{}"}</code>, else the last number in the text.
      </p>
    </aside>
  );
}
