import type { Passage } from "../types";
import { MarkableText } from "../words";

export function PassageView({ passage }: { passage: Passage }) {
  const blocks = passage.text.split(/\n\s*\n/);
  return (
    <article className="passage">
      <h2 className="passage-title">{passage.title}</h2>
      {passage.form === "poem"
        ? blocks.map((stanza, i) => (
            <p key={i} className="stanza">
              {stanza.split("\n").map((line, j) => (
                <span key={j} className="poem-line">
                  <MarkableText text={line} source={line} questionId={passage.id} />
                </span>
              ))}
            </p>
          ))
        : blocks.map((para, i) => (
            <p key={i}>
              <span className="para-num">{i + 1}</span>
              <MarkableText text={para} questionId={passage.id} />
            </p>
          ))}
    </article>
  );
}
