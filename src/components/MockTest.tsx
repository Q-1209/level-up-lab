import { useEffect, useMemo, useState } from "react";
import { estimate, pickNext, type Response } from "../adaptive";
import { allQuestions, DEFAULT_RIT, present, type ShownQuestion } from "../bank";
import { saveAttempts, saveTest } from "../storage";
import { AREA_LABELS, SUBJECT_AREAS, type Subject } from "../types";
import { MathText } from "./MathText";
import { TopBar } from "./Practice";
import { LETTERS, QuestionView } from "./QuestionView";

interface Answered {
  q: ShownQuestion;
  picked: number; // display position
  correct: boolean;
  thetaAfter: number;
}

interface Props {
  subject: Subject;
  length: number;
  onExit: () => void;
}

export function MockTest({ subject, length, onExit }: Props) {
  const pool = useMemo(() => allQuestions.filter((q) => q.subject === subject), [subject]);
  const total = Math.min(length, pool.length);
  const start = DEFAULT_RIT[subject];

  const [answered, setAnswered] = useState<Answered[]>([]);
  const [current, setCurrent] = useState<ShownQuestion | null>(() => {
    const first = pickNext(subject, pool, new Set(), start);
    return first ? present(first) : null;
  });
  const [picked, setPicked] = useState<number | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const finished = answered.length >= total || current === null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [answered.length]);

  const submit = () => {
    if (!current || picked === null) return;
    const correct = picked === current.order.indexOf(current.answer);
    const responses: Response[] = [...answered.map((a) => ({ b: a.q.rit, correct: a.correct })), { b: current.rit, correct }];
    const { theta } = estimate(responses, start);
    const next: Answered[] = [...answered, { q: current, picked, correct, thetaAfter: theta }];
    setAnswered(next);
    setPicked(null);

    if (next.length >= total) {
      setCurrent(null);
      const final = estimate(responses, start);
      saveAttempts(next.map((a) => ({ id: a.q.id, correct: a.correct, at: Date.now(), mode: "test" as const })));
      saveTest({
        subject,
        at: Date.now(),
        score: Math.round(final.theta),
        se: final.se,
        correct: next.filter((a) => a.correct).length,
        total: next.length,
      });
    } else {
      const nq = pickNext(subject, pool, new Set(next.map((a) => a.q.id)), theta);
      setCurrent(nq ? present(nq) : null);
    }
  };

  if (finished) return <TestResults subject={subject} answered={answered} start={start} onExit={onExit} />;

  const title = `${subject === "math" ? "Math" : "Reading"} mock test`;
  return (
    <div className="practice">
      <TopBar title={title} index={answered.length} total={total} onExit={() => setConfirmQuit(true)} exitLabel="✕ End" />
      {confirmQuit && (
        <div className="confirm">
          <span>Quit this test? Your answers so far won't be scored.</span>
          <button className="secondary" onClick={() => setConfirmQuit(false)}>
            Keep going
          </button>
          <button className="primary danger" onClick={onExit}>
            Quit test
          </button>
        </div>
      )}
      <QuestionView q={current!} picked={picked} onPick={setPicked} reveal={false}>
        <button className="primary" disabled={picked === null} onClick={submit}>
          Submit
        </button>
        <p className="hint">Like the real test, you can't go back or skip questions.</p>
      </QuestionView>
    </div>
  );
}

function TestResults({ subject, answered, start, onExit }: { subject: Subject; answered: Answered[]; start: number; onExit: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const { theta, se } = estimate(
    answered.map((a) => ({ b: a.q.rit, correct: a.correct })),
    start,
  );
  const score = Math.round(theta);
  const lo = Math.round(theta - se);
  const hi = Math.round(theta + se);
  const correct = answered.filter((a) => a.correct).length;

  return (
    <div className="summary">
      <h1>Test complete</h1>
      <p className="muted">{subject === "math" ? "Math" : "Reading"} mock test</p>

      <div className="score-card">
        <div className="score-label">Estimated score</div>
        <div className="score-big">{score}</div>
        <div className="muted">
          Likely range {lo}–{hi} · {correct} of {answered.length} correct
        </div>
        <div className="muted small">Grade 10 average is roughly {start}. This is an estimate from a small practice bank, not an official RIT score.</div>
      </div>

      <h2 className="section-title">By area</h2>
      <div className="area-results">
        {SUBJECT_AREAS[subject].map((area) => {
          const items = answered.filter((a) => a.q.area === area);
          if (!items.length) return null;
          const ok = items.filter((a) => a.correct).length;
          return (
            <div key={area} className="area-row">
              <span>{AREA_LABELS[area]}</span>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${(ok / items.length) * 100}%` }} />
              </div>
              <span className="area-num">
                {ok}/{items.length}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">Your questions</h2>
      <p className="muted small">Tap a question to see the answer and explanation.</p>
      <ul className="review-list">
        {answered.map((a, i) => {
          const correctPos = a.q.order.indexOf(a.q.answer);
          const isOpen = open === a.q.id;
          return (
            <li key={a.q.id} className={`${a.correct ? "ok" : "miss"} expandable`}>
              <button className="review-head" onClick={() => setOpen(isOpen ? null : a.q.id)} aria-expanded={isOpen}>
                <span className="mark">{a.correct ? "✓" : "✗"}</span>
                <span className="review-text">
                  <strong>Q{i + 1}.</strong> <MathText text={a.q.stem} />
                </span>
                <span className="level-chip">~{a.q.rit}</span>
              </button>
              {isOpen && (
                <div className="review-body">
                  <p>
                    Your answer: <strong>{LETTERS[a.picked]}</strong> <MathText text={a.q.choices[a.q.order[a.picked]]} />
                  </p>
                  {!a.correct && (
                    <p>
                      Correct answer: <strong>{LETTERS[correctPos]}</strong> <MathText text={a.q.choices[a.q.answer]} />
                    </p>
                  )}
                  <p className="muted">
                    <MathText text={a.q.explanation} />
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="row">
        <button className="primary" onClick={onExit}>
          Home
        </button>
      </div>
    </div>
  );
}
