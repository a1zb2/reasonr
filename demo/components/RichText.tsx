import katex from "katex";
import { Fragment, useMemo } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "math"; value: string; display: boolean };

// \[..\]  $$..$$  \(..\)  bare \boxed{..}  **bold**
// Single $ is left alone on purpose: in these answers it almost always means dollars.
const TOKEN_RE =
  /\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)|(\\boxed\{[^{}]*\})|\*\*([^*\n]+)\*\*/g;

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(src))) {
    if (m.index > last) tokens.push({ type: "text", value: src.slice(last, m.index) });
    if (m[1] !== undefined || m[2] !== undefined) {
      tokens.push({ type: "math", value: (m[1] ?? m[2]).trim(), display: true });
    } else if (m[3] !== undefined || m[4] !== undefined) {
      tokens.push({ type: "math", value: (m[3] ?? m[4]).trim(), display: false });
    } else {
      tokens.push({ type: "bold", value: m[5] });
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < src.length) tokens.push({ type: "text", value: src.slice(last) });

  // Display math is a block already, so drop the newline that hugs it on either side
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== "text") continue;
    const prev = tokens[i - 1];
    const next = tokens[i + 1];
    if (prev?.type === "math" && prev.display) t.value = t.value.replace(/^[ \t]*\n/, "");
    if (next?.type === "math" && next.display) t.value = t.value.replace(/\n[ \t]*$/, "");
  }
  return tokens;
}

// The model writes things KaTeX rejects: "$200" inside math, and align* inside inline \( \).
// Patch those two, and if it still doesn't parse, show the source as plain text.
function renderMath(tex: string, display: boolean): { html: string | null; display: boolean } {
  const cleaned = tex.replace(/(^|[^\\])\$/g, "$1\\$");
  const asDisplay = display || /\\begin\{/.test(cleaned);
  try {
    return {
      html: katex.renderToString(cleaned, { displayMode: asDisplay, throwOnError: true, strict: "ignore" }),
      display: asDisplay,
    };
  } catch {
    return { html: null, display };
  }
}

function MathSpan({ tex, display }: { tex: string; display: boolean }) {
  const r = useMemo(() => renderMath(tex, display), [tex, display]);
  if (r.html === null) {
    const src = display ? `\\[${tex}\\]` : `\\(${tex}\\)`;
    return display ? <div className="my-2 font-mono text-sm">{src}</div> : <span className="font-mono text-sm">{src}</span>;
  }
  if (r.display) {
    return <div className="katex-block my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: r.html }} />;
  }
  return <span dangerouslySetInnerHTML={{ __html: r.html }} />;
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const tokens = useMemo(() => tokenize(text), [text]);
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {tokens.map((t, i) => (
        <Fragment key={i}>
          {t.type === "text" && t.value}
          {t.type === "bold" && <strong className="font-semibold text-ink">{t.value}</strong>}
          {t.type === "math" && <MathSpan tex={t.value} display={t.display} />}
        </Fragment>
      ))}
    </div>
  );
}
