import { useState } from "react";
import { allQuestions, buildPracticeSet, DEFAULT_RIT, type ShownQuestion } from "./bank";
import { Practice } from "./components/Practice";
import { AREA_LABELS, SUBJECT_AREAS, type Area, type Subject } from "./types";

type Level = "warmup" | "onlevel" | "stretch";
const LEVELS: { key: Level; label: string; offset: number; hint: string }[] = [
  { key: "warmup", label: "Warm-up", offset: -15, hint: "Easier questions" },
  { key: "onlevel", label: "On level", offset: 0, hint: "Around Grade 10 average" },
  { key: "stretch", label: "Stretch", offset: 15, hint: "Harder questions" },
];

interface Session {
  subject: Subject;
  area: Area | "all";
  level: Level;
  questions: ShownQuestion[];
}

export default function App() {
  const [subject, setSubject] = useState<Subject>("math");
  const [area, setArea] = useState<Area | "all">("all");
  const [level, setLevel] = useState<Level>("onlevel");
  const [session, setSession] = useState<Session | null>(null);

  const start = (s: Subject, a: Area | "all", l: Level) => {
    const offset = LEVELS.find((x) => x.key === l)!.offset;
    setSession({ subject: s, area: a, level: l, questions: buildPracticeSet(s, a, DEFAULT_RIT[s] + offset) });
  };

  if (session) {
    const levelLabel = LEVELS.find((x) => x.key === session.level)!.label;
    const areaLabel = session.area === "all" ? "All areas" : AREA_LABELS[session.area];
    return (
      <main className="container">
        <Practice
          key={session.questions.map((q) => q.id).join()}
          questions={session.questions}
          title={`${session.subject === "math" ? "Math" : "Reading"} · ${areaLabel} · ${levelLabel}`}
          onExit={() => setSession(null)}
          onRetry={() => start(session.subject, session.area, session.level)}
        />
      </main>
    );
  }

  const count = (s: Subject, a: Area | "all") => allQuestions.filter((q) => q.subject === s && (a === "all" || q.area === a)).length;

  return (
    <main className="container">
      <header className="hero">
        <h1>
          Level Up <span className="accent">Lab</span>
        </h1>
        <p className="muted">Practice for adaptive Math and Reading growth tests.</p>
      </header>

      <section className="panel">
        <h2>Practice</h2>

        <div className="field">
          <span className="field-label">Subject</span>
          <div className="seg">
            {(["math", "reading"] as Subject[]).map((s) => (
              <button
                key={s}
                className={s === subject ? "on" : ""}
                onClick={() => {
                  setSubject(s);
                  setArea("all");
                }}
              >
                {s === "math" ? "Math" : "Reading"}
              </button>
            ))}
          </div>
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
          <div className="seg">
            {LEVELS.map((l) => (
              <button key={l.key} className={l.key === level ? "on" : ""} onClick={() => setLevel(l.key)} title={l.hint}>
                {l.label}
              </button>
            ))}
          </div>
          <span className="hint">{LEVELS.find((l) => l.key === level)!.hint}</span>
        </div>

        <button className="primary big" onClick={() => start(subject, area, level)}>
          Start 10 questions
        </button>
      </section>

      <section className="panel soon">
        <h2>Coming soon</h2>
        <ul>
          <li>Adaptive mock test with an estimated score</li>
          <li>Review your missed questions</li>
          <li>Progress dashboard</li>
        </ul>
      </section>

      <footer className="foot muted">
        All questions are original practice items. Scores are estimates, not official RIT scores. Not affiliated with NWEA.
      </footer>
    </main>
  );
}
