// Simplified adaptive testing, modeled on how RIT-style scales work (Rasch model).
// A student at level θ answers an item of difficulty b correctly with probability
//   P = 1 / (1 + exp(-(θ - b) / S)),  where S = 10 RIT points per logit.
// Item difficulties are the author's `rit` estimates, so scores are approximate.

import { SUBJECT_AREAS, type Area, type Question, type Subject } from "./types";

const S = 10;
const PRIOR_SD = 20; // how far from the starting level we expect a student might be

export interface Response {
  b: number;
  correct: boolean;
}

const prob = (theta: number, b: number) => 1 / (1 + Math.exp(-(theta - b) / S));

/**
 * Maximum a posteriori estimate of the student's level with a normal prior centered on `start`.
 * The prior keeps the estimate finite when every answer so far is right (or wrong).
 */
export function estimate(responses: Response[], start: number): { theta: number; se: number } {
  let t = start;
  for (let it = 0; it < 60; it++) {
    let grad = -(t - start) / PRIOR_SD ** 2;
    let hess = -1 / PRIOR_SD ** 2;
    for (const r of responses) {
      const p = prob(t, r.b);
      grad += ((r.correct ? 1 : 0) - p) / S;
      hess -= (p * (1 - p)) / S ** 2;
    }
    const step = grad / hess;
    t = Math.min(300, Math.max(140, t - step));
    if (Math.abs(step) < 1e-4) break;
  }
  let info = 1 / PRIOR_SD ** 2;
  for (const r of responses) {
    const p = prob(t, r.b);
    info += (p * (1 - p)) / S ** 2;
  }
  return { theta: t, se: 1 / Math.sqrt(info) };
}

/**
 * Chooses the next item: balance the content areas (like the real test does), and within the
 * chosen area take one of the two unused items whose difficulty is closest to the current estimate.
 */
export function pickNext(subject: Subject, pool: Question[], used: Set<string>, theta: number): Question | null {
  const unused = pool.filter((q) => !used.has(q.id));
  if (!unused.length) return null;

  const counts = new Map<Area, number>(SUBJECT_AREAS[subject].map((a) => [a, 0]));
  for (const q of pool) if (used.has(q.id)) counts.set(q.area, (counts.get(q.area) ?? 0) + 1);

  const available = SUBJECT_AREAS[subject].filter((a) => unused.some((q) => q.area === a));
  const fewest = Math.min(...available.map((a) => counts.get(a)!));
  const areaChoices = available.filter((a) => counts.get(a) === fewest);
  const area = areaChoices[Math.floor(Math.random() * areaChoices.length)];

  const near = unused
    .filter((q) => q.area === area)
    .sort((a, b) => Math.abs(a.rit - theta) - Math.abs(b.rit - theta))
    .slice(0, 2);
  return near[Math.floor(Math.random() * near.length)];
}
