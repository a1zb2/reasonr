import samples from "@/data/demo_samples.json";
import probe from "@/data/probe_log.json";
import results from "@/data/results.json";
import { grade, type Graded } from "./answer";

export const GITHUB_URL = "https://github.com/a1zb2/reasonr";

export const QUESTIONS: string[] = samples.questions;
export const GOLD: string[] = samples.gold;

// Short labels for the question picker, same order as demo_samples.json
export const QUESTION_LABELS = [
  "Ages ratio",
  "Sticker trades",
  "Letters in names",
  "Running laps",
  "Ice cream truck",
  "Sleepwalking",
  "Banana pile",
  "Measuring spoons",
];

export type { Graded };
export type Checkpoint = { step: number; answers: Graded[] };

export const CHECKPOINTS: Checkpoint[] = samples.checkpoints.map((c) => ({
  step: c.step,
  answers: c.outputs.map((text, i) => grade(text, GOLD[i])),
}));

export const PROBE = probe.map((p) => ({
  step: p.step,
  accuracy: Math.round(p.accuracy * 1000) / 10,
}));

export const HEADLINE = {
  base: results.base,
  grpo: results.grpo,
  fixed: 227,
  broke: 128,
  n: 1319,
};
