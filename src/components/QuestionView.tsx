import type { ReactNode } from "react";
import { passageById, type ShownQuestion } from "../bank";
import { AREA_LABELS } from "../types";
import { MathText } from "./MathText";
import { PassageView } from "./PassageView";

export const LETTERS = ["A", "B", "C", "D"];

interface Props {
  q: ShownQuestion;
  picked: number | null; // display position
  onPick: (pos: number) => void;
  /** When true, choices are locked and correct/wrong colors are shown. */
  reveal: boolean;
  /** Buttons / feedback shown under the choices. */
  children?: ReactNode;
}

/** Passage (for reading) + question card with selectable choices. */
export function QuestionView({ q, picked, onPick, reveal, children }: Props) {
  const passage = q.passageId ? passageById.get(q.passageId) : undefined;
  const correctPos = q.order.indexOf(q.answer);

  return (
    <div className={passage ? "split" : "single"}>
      {passage && <PassageView passage={passage} />}
      <section className="question-card">
        <div className="area-tag">{AREA_LABELS[q.area]}</div>
        <p className="stem">
          <MathText text={q.stem} />
        </p>
        <div className="choices" role="radiogroup">
          {q.order.map((orig, pos) => {
            let cls = "choice";
            if (reveal && pos === correctPos) cls += " correct";
            else if (reveal && pos === picked) cls += " wrong";
            else if (pos === picked) cls += " picked";
            return (
              <button key={pos} className={cls} role="radio" aria-checked={pos === picked} disabled={reveal} onClick={() => onPick(pos)}>
                <span className="letter">{LETTERS[pos]}</span>
                <span className="choice-text">
                  <MathText text={q.choices[orig]} />
                </span>
              </button>
            );
          })}
        </div>
        {children}
      </section>
    </div>
  );
}
