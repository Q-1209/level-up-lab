import { useEffect, useMemo, useState } from "react";
import type { ShownQuestion } from "../bank";
import { saveAttempts, type Attempt } from "../storage";
import { MathText } from "./MathText";
import { LETTERS, QuestionView } from "./QuestionView";

interface Props {
  questions: ShownQuestion[];
  title: string;
  onExit: () => void;
  onRetry: () => void;
  retryLabel?: string;
}

export function Practice({ questions, title, onExit, onRetry, retryLabel = "New set" }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Attempt[]>([]);
  const done = index >= questions.length;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  if (done)
    return <Summary questions={questions} results={results} title={title} onExit={onExit} onRetry={onRetry} retryLabel={retryLabel} />;

  const q = questions[index];
  const correctPos = q.order.indexOf(q.answer);
  const isCorrect = picked === correctPos;

  const submit = () => {
    if (picked === null) return;
    setSubmitted(true);
    // Saved immediately so quitting mid-set keeps what was answered.
    const attempt: Attempt = { id: q.id, correct: picked === correctPos, at: Date.now(), mode: "practice" };
    saveAttempts([attempt]);
    setResults((r) => [...r, attempt]);
  };
  const next = () => {
    setIndex((i) => i + 1);
    setPicked(null);
    setSubmitted(false);
  };

  return (
    <div className="practice">
      <TopBar title={title} index={index} total={questions.length} onExit={onExit} exitLabel="← Quit" />
      <QuestionView q={q} picked={picked} onPick={setPicked} reveal={submitted}>
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
      </QuestionView>
    </div>
  );
}

export function TopBar({ title, index, total, onExit, exitLabel }: { title: string; index: number; total: number; onExit: () => void; exitLabel: string }) {
  return (
    <>
      <header className="practice-bar">
        <button className="link" onClick={onExit}>
          {exitLabel}
        </button>
        <span className="practice-title">{title}</span>
        <span className="counter">
          {index + 1} / {total}
        </span>
      </header>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>
    </>
  );
}

function Summary({ questions, results, title, onExit, onRetry, retryLabel }: { questions: ShownQuestion[]; results: Attempt[] } & Omit<Props, "questions">) {
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
          {retryLabel}
        </button>
        <button className="secondary" onClick={onExit}>
          Home
        </button>
      </div>
    </div>
  );
}
