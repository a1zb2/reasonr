import { splitSegments } from "@/lib/answer";
import { RichText } from "./RichText";

export function AnswerView({ text }: { text: string }) {
  const segments = splitSegments(text);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {segments.map((s, i) => {
        if (s.kind === "plain") {
          return <RichText key={i} text={s.text} className="text-ink-2" />;
        }
        const isThink = s.kind === "think";
        return (
          <section
            key={i}
            className={
              isThink
                ? "rounded-lg border-l-[3px] border-think bg-think-soft px-4 py-3"
                : "rounded-lg border-l-[3px] border-accent bg-accent-soft px-4 py-3"
            }
          >
            <div
              className={`mb-1.5 font-mono text-xs ${isThink ? "text-think-ink" : "text-accent-ink"}`}
            >
              {isThink ? "<think>" : "<answer>"}
              <span className="ml-2 font-sans text-ink-3">
                {isThink ? "reasoning" : "final answer"}
                {s.unclosed && " (tag never closed)"}
              </span>
            </div>
            <RichText
              text={s.text}
              className={isThink ? "text-ink-2" : "text-lg font-semibold text-ink"}
            />
          </section>
        );
      })}
    </div>
  );
}
