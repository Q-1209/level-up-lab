// Progress is kept in this browser only (localStorage). Every access is wrapped so the app
// still works in private windows or when storage is blocked.
import type { Subject } from "./types";

export interface Attempt {
  id: string; // question id
  correct: boolean;
  at: number; // timestamp (ms)
  mode: "practice" | "test";
}

export interface TestResult {
  subject: Subject;
  at: number;
  score: number; // estimated level, rounded
  se: number; // standard error in RIT points
  correct: number;
  total: number;
}

const ATTEMPTS = "levelUpLab.attempts.v1";
const TESTS = "levelUpLab.tests.v1";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function append<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify([...read<T>(key), ...items]));
  } catch {
    /* storage unavailable: progress just isn't saved */
  }
}

export const loadAttempts = () => read<Attempt>(ATTEMPTS);
export const saveAttempts = (a: Attempt[]) => append(ATTEMPTS, a);
export const loadTests = () => read<TestResult>(TESTS);
export const saveTest = (t: TestResult) => append(TESTS, [t]);

/** Question ids whose most recent attempt was wrong. Answering one correctly removes it. */
export function missedIds(): string[] {
  const latest = new Map<string, boolean>();
  for (const a of loadAttempts().sort((x, y) => x.at - y.at)) latest.set(a.id, a.correct);
  return [...latest].filter(([, ok]) => !ok).map(([id]) => id);
}
