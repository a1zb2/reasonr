"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PROBE } from "@/lib/data";

type TipProps = { active?: boolean; payload?: { payload: { step: number; accuracy: number } }[] };

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-sm">
      <div className="text-ink-3">step {p.step}</div>
      <div className="font-semibold text-ink tabular-nums">{p.accuracy.toFixed(1)}% correct</div>
    </div>
  );
}

export function AccuracyChart({ currentStep }: { currentStep: number | null }) {
  return (
    <div className="h-48 w-full" role="img" aria-label="Probe accuracy by training step: 40% at step 0, peak 51.5% at step 400, 46% at step 1000">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={PROBE} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="step"
            type="number"
            domain={[0, 1000]}
            ticks={[0, 200, 400, 600, 800, 1000]}
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
          />
          <YAxis
            domain={[35, 55]}
            ticks={[35, 40, 45, 50, 55]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--ink-3)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          {currentStep !== null && (
            <ReferenceLine x={currentStep} stroke="var(--ink-3)" strokeDasharray="3 3" />
          )}
          <Tooltip content={<Tip />} cursor={{ stroke: "var(--line)" }} isAnimationActive={false} />
          <Line
            type="linear"
            dataKey="accuracy"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
