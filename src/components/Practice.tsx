import { useEffect, useMemo, useState } from "react";
import { passageById, type ShownQuestion } from "../bank";
import { saveAttempts, type Attempt } from "../storage";
import { AREA_LABELS } from "../types";
import { MathText } from "./MathText";
import { PassageView } from "./PassageView";

const LETTERS = ["A", "B", "C", "D"];

interface Props {
  questions: ShownQuestion[];
  title: string;
  onExit: () => void;
  onRetry: () => void;
}

export function Practice({ questions, title, onExit, onRetry }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // display position
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Attempt[]>([]);
  const done = index >= questions.length;

  useEffect(() => {
    if (done && results.length) saveAttempts(results);
  }, [done, results]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  if (done) return <Summary questions={questions} results={results} title={title} onExit={onExit} onRetry={onRetry} />;

  const q = questions[index];
  const passage = q.passageId ? passageById.get(q.passageId) : undefined;
  const correctPos = q.order.indexOf(q.answer);
  const isCorrect = picked === correctPos;

  const submit = () => {
    if (picked === null) return;
    setSubmitted(true);
    setResults((r) => [...r, { id: q.id, correct: picked === correctPos, at: Date.now(), mode: "practice" }]);
  };
  const next = () => {
    setIndex((i) => i + 1);
    setPicked(null);
    setSubmitted(false);
  };

  return (
    <div className="practice">
      <header className="practice-bar">
        <button className="link" onClick={onExit}>
          ← Quit
        </button>
        <span className="practice-title">{title}</span>
        <span className="counter">
          {index + 1} / {questions.length}
        </span>
      </header>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

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
              if (submitted && pos === correctPos) cls += " correct";
              else if (submitted && pos === picked) cls += " wrong";
              else if (pos === picked) cls += " picked";
              return (
                <button
                  key={pos}
                  className={cls}
                  role="radio"
                  aria-checked={pos === picked}
                  disabled={submitted}
                  onClick={() => setPicked(pos)}
                >
                  <span className="letter">{LETTERS[pos]}</span>
                  <span className="choice-text">
                    <MathText text={q.choices[orig]} />
                  </span>
                </button>
              );
            })}
          </div>

          {!submitted ? (
            <button className="primary" disabled={picked === null} onClick={submit}>
              Submit
            </button>
          ) : (
            <>
              <div className={`feedback ${isCorrect ? "good" : "bad"}`}>
                <strong>{isCorrect ? "Correct!" : `Not quite. The answer is ${LETTERS[correctPos]}.`}</strong>
                <p>
                  <MathText text={q.explanation} />
                </p>
              </div>
              <button className="primary" onClick={next}>
                {index + 1 < questions.length ? "Next question →" : "See results"}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Summary({ questions, results, title, onExit, onRetry }: { questions: ShownQuestion[]; results: Attempt[] } & Omit<Props, "questions">) {
  const correct = results.filter((r) => r.correct).length;
  const pct = Math.round((correct / Math.max(1, results.length)) * 100);
  const byId = useMemo(() => new Map(results.map((r) => [r.id, r.correct])), [results]);

  return (
    <div className="summary">
      <h1>Practice complete</h1>
      <p className="muted">{title}</p>
      <div className="score-big">
        {correct} / {results.length}
        <span className="pct">{pct}%</span>
      </div>
      <ul className="review-list">
        {questions.map((q, i) => (
          <li key={q.id} className={byId.get(q.id) ? "ok" : "miss"}>
            <span className="mark">{byId.get(q.id) ? "✓" : "✗"}</span>
            <span className="review-text">
              <strong>Q{i + 1}.</strong> <MathText text={q.stem} />
            </span>
          </li>
        ))}
      </ul>
      <div className="row">
        <button className="primary" onClick={onRetry}>
          New set
        </button>
        <button className="secondary" onClick={onExit}>
          Home
        </button>
      </div>
    </div>
  );
}
