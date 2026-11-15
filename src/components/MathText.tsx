import katex from "katex";
import { useMemo } from "react";
import { MarkableText } from "../words";

/**
 * Renders plain text with inline LaTeX between $...$ (KaTeX).
 * Words in the plain-text parts can be tapped to save them while "mark words" mode is on.
 */
export function MathText({ text, questionId }: { text: string; questionId?: string }) {
  const parts = useMemo(() => {
    return text.split("$").map((chunk, i) => {
      if (i % 2 === 0) return { math: false, value: chunk };
      try {
        return { math: true, value: katex.renderToString(chunk, { throwOnError: false }) };
      } catch {
        return { math: false, value: chunk };
      }
    });
  }, [text]);

  return (
    <>
      {parts.map((p, i) =>
        p.math ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: p.value }} />
        ) : (
          <MarkableText key={i} text={p.value} source={text} questionId={questionId} />
        ),
      )}
    </>
  );
}
