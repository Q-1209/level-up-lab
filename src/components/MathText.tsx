import katex from "katex";
import { Fragment, useMemo } from "react";

/** Renders plain text with inline LaTeX between $...$ (KaTeX). */
export function MathText({ text }: { text: string }) {
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
        p.math ? <span key={i} dangerouslySetInnerHTML={{ __html: p.value }} /> : <Fragment key={i}>{p.value}</Fragment>,
      )}
    </>
  );
}
