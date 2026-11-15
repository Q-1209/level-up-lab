import type { ReactNode } from "react";
import { passageById, type ShownQuestion } from "../bank";
import { AREA_LABELS } from "../types";
import { MarkWordsToggle, useWords } from "../words";
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
  const { marking } = useWords();

  return (
    <div className={`${passage ? "split" : "single"}${marking ? " marking" : ""}`}>
      {passage && <PassageView passage={passage} />}
      <section className="question-card">
        <div className="card-head">
          <div className="area-tag">{AREA_LABELS[q.area]}</div>
          <MarkWordsToggle />
        </div>
        {marking && <p className="mark-hint">Tap any word you don't know. Tap it again to remove it. Saved words appear in “My words” on the home screen.</p>}
        <p className="stem">
          <MathText text={q.stem} questionId={q.id} />
        </p>
        <div className="choices" role="radiogroup">
          {q.order.map((orig, pos) => {
            let cls = "choice";
            if (reveal && pos === correctPos) cls += " correct";
            else if (reveal && pos === picked) cls += " wrong";
            else if (pos === picked) cls += " picked";
            return (
              <button
                key={pos}
                className={cls}
                role="radio"
                aria-checked={pos === picked}
                disabled={reveal && !marking}
                onClick={() => {
                  if (!marking && !reveal) onPick(pos);
                }}
              >
                <span className="letter">{LETTERS[pos]}</span>
                <span className="choice-text">
                  <MathText text={q.choices[orig]} questionId={q.id} />
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
