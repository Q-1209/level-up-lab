import { useState } from "react";
import { allQuestions, buildPracticeSet, DEFAULT_RIT, present, shuffle, type ShownQuestion } from "./bank";
import { MockTest } from "./components/MockTest";
import { Practice } from "./components/Practice";
import { loadTests, missedIds } from "./storage";
import { AREA_LABELS, SUBJECT_AREAS, type Area, type Subject } from "./types";

type Level = "warmup" | "onlevel" | "stretch";
const LEVELS: { key: Level; label: string; offset: number; hint: string }[] = [
  { key: "warmup", label: "Warm-up", offset: -15, hint: "Easier questions" },
  { key: "onlevel", label: "On level", offset: 0, hint: "Around Grade 10 average" },
  { key: "stretch", label: "Stretch", offset: 15, hint: "Harder questions" },
];

const TEST_LENGTHS: Record<Subject, { short: number; full: number }> = {
  math: { short: 20, full: 40 },
  reading: { short: 12, full: 40 },
};

const subjectName = (s: Subject) => (s === "math" ? "Math" : "Reading");

type Screen =
  | { kind: "home" }
  | { kind: "practice"; subject: Subject; area: Area | "all"; level: Level; questions: ShownQuestion[] }
  | { kind: "review"; questions: ShownQuestion[] }
  | { kind: "test"; subject: Subject; length: number; key: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const home = () => setScreen({ kind: "home" });

  const startPractice = (subject: Subject, area: Area | "all", level: Level) => {
    const offset = LEVELS.find((x) => x.key === level)!.offset;
    setScreen({ kind: "practice", subject, area, level, questions: buildPracticeSet(subject, area, DEFAULT_RIT[subject] + offset) });
  };

  const startReview = () => {
    const ids = new Set(missedIds());
    const qs = shuffle(allQuestions.filter((q) => ids.has(q.id))).slice(0, 10);
    if (qs.length) setScreen({ kind: "review", questions: qs.map(present) });
  };

  if (screen.kind === "practice") {
    const levelLabel = LEVELS.find((x) => x.key === screen.level)!.label;
    const areaLabel = screen.area === "all" ? "All areas" : AREA_LABELS[screen.area];
    return (
      <main className="container">
        <Practice
          key={screen.questions.map((q) => q.id).join()}
          questions={screen.questions}
          title={`${subjectName(screen.subject)} · ${areaLabel} · ${levelLabel}`}
          onExit={home}
          onRetry={() => startPractice(screen.subject, screen.area, screen.level)}
        />
      </main>
    );
  }

  if (screen.kind === "review") {
    return (
      <main className="container">
        <Practice
          key={screen.questions.map((q) => q.id).join()}
          questions={screen.questions}
          title="Review missed questions"
          onExit={home}
          onRetry={() => (missedIds().length ? startReview() : home())}
          retryLabel="Review more"
        />
      </main>
    );
  }

  if (screen.kind === "test") {
    return (
      <main className="container">
        <MockTest key={screen.key} subject={screen.subject} length={screen.length} onExit={home} />
      </main>
    );
  }

  return <Home onPractice={startPractice} onReview={startReview} onTest={(subject, length) => setScreen({ kind: "test", subject, length, key: Date.now() })} />;
}

function Home({
  onPractice,
  onReview,
  onTest,
}: {
  onPractice: (s: Subject, a: Area | "all", l: Level) => void;
  onReview: () => void;
  onTest: (s: Subject, length: number) => void;
}) {
  const [subject, setSubject] = useState<Subject>("math");
  const [area, setArea] = useState<Area | "all">("all");
  const [level, setLevel] = useState<Level>("onlevel");
  const [testSubject, setTestSubject] = useState<Subject>("math");
  const [testLength, setTestLength] = useState<"short" | "full">("short");

  const missed = missedIds().length;
  const tests = loadTests().slice(-6).reverse();
  const count = (s: Subject, a: Area | "all") => allQuestions.filter((q) => q.subject === s && (a === "all" || q.area === a)).length;
  const lengthFor = (s: Subject, l: "short" | "full") => Math.min(TEST_LENGTHS[s][l], count(s, "all"));

  return (
    <main className="container">
      <header className="hero">
        <h1>
          Level Up <span className="accent">Lab</span>
        </h1>
        <p className="muted">Practice for adaptive Math and Reading growth tests.</p>
      </header>

      <div className="home-grid">
        <section className="panel">
          <h2>Mock test</h2>
          <p className="muted small">Adaptive: questions get harder when you're right and easier when you're wrong. You get an estimated score at the end.</p>

          <div className="field">
            <span className="field-label">Subject</span>
            <Seg options={(["math", "reading"] as Subject[]).map((s) => [s, subjectName(s)])} value={testSubject} onChange={setTestSubject} />
          </div>
          <div className="field">
            <span className="field-label">Length</span>
            <Seg
              options={[
                ["short", `Short · ${lengthFor(testSubject, "short")} Qs`],
                ["full", `Full · ${lengthFor(testSubject, "full")} Qs`],
              ]}
              value={testLength}
              onChange={setTestLength}
            />
          </div>
          <button className="primary big" onClick={() => onTest(testSubject, lengthFor(testSubject, testLength))}>
            Start mock test
          </button>

          {tests.length > 0 && (
            <>
              <h3 className="mini-title">Recent scores</h3>
              <ul className="history">
                {tests.map((t) => (
                  <li key={t.at}>
                    <span>{subjectName(t.subject)}</span>
                    <span className="muted">{new Date(t.at).toLocaleDateString()}</span>
                    <strong>{t.score}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="panel">
          <h2>Practice</h2>
          <div className="field">
            <span className="field-label">Subject</span>
            <Seg
              options={(["math", "reading"] as Subject[]).map((s) => [s, subjectName(s)])}
              value={subject}
              onChange={(s) => {
                setSubject(s);
                setArea("all");
              }}
            />
          </div>

          <div className="field">
            <span className="field-label">Area</span>
            <div className="area-grid">
              {(["all", ...SUBJECT_AREAS[subject]] as (Area | "all")[]).map((a) => (
                <button key={a} className={`area-btn ${a === area ? "on" : ""}`} onClick={() => setArea(a)}>
                  <span>{a === "all" ? "All areas (mixed)" : AREA_LABELS[a]}</span>
                  <span className="count">{count(subject, a)} questions</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Level</span>
            <Seg options={LEVELS.map((l) => [l.key, l.label])} value={level} onChange={setLevel} />
            <span className="hint">{LEVELS.find((l) => l.key === level)!.hint}</span>
          </div>

          <button className="primary big" onClick={() => onPractice(subject, area, level)}>
            Start 10 questions
          </button>
        </section>

        <section className="panel">
          <h2>Review missed questions</h2>
          {missed > 0 ? (
            <>
              <p className="muted small">
                {missed} question{missed === 1 ? "" : "s"} to review. Answer one correctly and it leaves this list.
              </p>
              <button className="secondary big" onClick={onReview}>
                Review {Math.min(10, missed)} now
              </button>
            </>
          ) : (
            <p className="muted small">Nothing to review yet. Questions you miss in practice or tests will show up here.</p>
          )}
        </section>
      </div>

      <footer className="foot muted">
        All questions are original practice items. Scores are estimates, not official RIT scores. Not affiliated with NWEA.
      </footer>
    </main>
  );
}

function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([k, label]) => (
        <button key={k} className={k === value ? "on" : ""} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
