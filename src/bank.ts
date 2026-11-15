import type { Area, Passage, Question, Subject } from "./types";

// Every JSON file in src/data is bundled: math*.json, reading*.json, passages*.json.
const files = import.meta.glob<unknown[]>('./data/*.json', { eager: true, import: 'default' });
const collect = (prefix: string) =>
  Object.entries(files)
    .filter(([path]) => path.split('/').pop()!.startsWith(prefix))
    .flatMap(([, data]) => data);
const mathData = collect('math');
const readingData = collect('reading');
const passageData = collect('passages');

export const allQuestions = [...mathData, ...readingData] as Question[];
export const passages = passageData as Passage[];
export const passageById = new Map(passages.map((p) => [p.id, p]));

export const DEFAULT_RIT: Record<Subject, number> = { math: 232, reading: 220 };

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A question as shown to the student: choices in random order, answer index remapped. */
export interface ShownQuestion extends Question {
  order: number[]; // order[k] = original choice index displayed at position k
}

export function present(q: Question): ShownQuestion {
  return { ...q, order: shuffle(q.choices.map((_, i) => i)) };
}

/**
 * Picks up to `count` questions for a practice set.
 * Prefers items whose RIT is close to `targetRit`, with some randomness so repeats feel fresh.
 * Reading items are grouped by passage so the student reads each passage once.
 */
export function buildPracticeSet(subject: Subject, area: Area | "all", targetRit: number, count = 10): ShownQuestion[] {
  const pool = allQuestions.filter((q) => q.subject === subject && (area === "all" || q.area === area));
  const scored = shuffle(pool)
    .map((q) => ({ q, d: Math.abs(q.rit - targetRit) + Math.random() * 8 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.q);

  if (subject === "reading") {
    const firstSeen = new Map<string, number>();
    scored.forEach((q, i) => {
      const key = q.passageId ?? q.id;
      if (!firstSeen.has(key)) firstSeen.set(key, i);
    });
    scored.sort((a, b) => firstSeen.get(a.passageId ?? a.id)! - firstSeen.get(b.passageId ?? b.id)!);
  }
  return scored.map(present);
}
