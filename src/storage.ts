// Progress is kept in this browser only (localStorage). Every access is wrapped so the app
// still works in private windows or when storage is blocked.

export interface Attempt {
  id: string; // question id
  correct: boolean;
  at: number; // timestamp (ms)
  mode: "practice" | "test";
}

const KEY = "levelUpLab.attempts.v1";

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempts(newOnes: Attempt[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadAttempts(), ...newOnes]));
  } catch {
    /* storage unavailable: progress just isn't saved */
  }
}
