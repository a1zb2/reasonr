// Mirrors extract_answer / same_number / FORMAT_RE from the training notebook,
// so the badges here agree with how the model was scored.

const NUM_RE = /-?\d+(?:\.\d+)?/g;

function lastNumber(text: string): string | null {
  const nums = text.replace(/,/g, "").match(NUM_RE);
  return nums ? nums[nums.length - 1] : null;
}

/** <answer> tag first, then \boxed{}, then the last number anywhere. Commas stripped. */
export function extractAnswer(text: string): string | null {
  for (const re of [/<answer>([\s\S]*?)<\/answer>/, /\\boxed\{([\s\S]*?)\}/]) {
    const m = text.match(re);
    if (m) {
      const n = lastNumber(m[1]);
      if (n !== null) return n;
    }
  }
  return lastNumber(text);
}

export function sameNumber(a: string | null, b: string): boolean {
  if (a === null) return false;
  const x = Number(a);
  const y = Number(b);
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 1e-6;
}

const FORMAT_RE = /^\s*<think>[\s\S]*?<\/think>\s*<answer>[\s\S]*?<\/answer>\s*$/;

export function followsFormat(text: string): boolean {
  return FORMAT_RE.test(text);
}

export type SegmentKind = "plain" | "think" | "answer";
export type Segment = { kind: SegmentKind; text: string; unclosed?: boolean };

/** Split a completion into plain text, <think> and <answer> sections. */
export function splitSegments(text: string): Segment[] {
  const out: Segment[] = [];
  const tagRe = /<(\/?)(think|answer)>/g;
  let state: SegmentKind = "plain";
  let last = 0;
  let m: RegExpExecArray | null;

  const push = (kind: SegmentKind, chunk: string, unclosed = false) => {
    const t = chunk.trim();
    if (t) out.push({ kind, text: t, unclosed: unclosed || undefined });
  };

  while ((m = tagRe.exec(text))) {
    const closing = m[1] === "/";
    const tag = m[2] as SegmentKind;
    if (!closing && state === "plain") {
      push("plain", text.slice(last, m.index));
      state = tag;
      last = tagRe.lastIndex;
    } else if (closing && state === tag) {
      push(tag, text.slice(last, m.index));
      state = "plain";
      last = tagRe.lastIndex;
    }
    // stray or mismatched tags are left in the text as-is
  }
  push(state, text.slice(last), state !== "plain");
  return out;
}

export type Graded = {
  text: string;
  extracted: string | null;
  correct: boolean;
  length: number;
  format: boolean;
};

export function grade(text: string, gold: string): Graded {
  const extracted = extractAnswer(text);
  return {
    text,
    extracted,
    correct: sameNumber(extracted, gold),
    length: text.length,
    format: followsFormat(text),
  };
}
