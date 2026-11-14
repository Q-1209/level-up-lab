export type Subject = "math" | "reading";

export type MathArea = "algebra" | "numbers" | "geometry" | "statistics";
export type ReadingArea = "literary" | "informational" | "vocabulary";
export type Area = MathArea | ReadingArea;

export interface Question {
  id: string;
  subject: Subject;
  area: Area;
  /** Approximate RIT level this item targets (author's estimate, not an official value). */
  rit: number;
  /** Text with inline LaTeX between $...$ */
  stem: string;
  choices: string[];
  /** Index into choices of the correct answer. */
  answer: number;
  explanation: string;
  /** Reading only: the passage this question belongs to. */
  passageId?: string;
  /**
   * Math only, optional: a JS arithmetic expression computed independently of the choices.
   * The validator checks that it equals the correct choice and no other choice.
   */
  calc?: string;
}

export interface Passage {
  id: string;
  title: string;
  genre: "literary" | "informational";
  /** Poems keep line breaks; prose paragraphs are separated by blank lines. */
  form: "prose" | "poem";
  text: string;
}

export const AREA_LABELS: Record<Area, string> = {
  algebra: "Operations & Algebraic Thinking",
  numbers: "Real & Complex Number Systems",
  geometry: "Geometry",
  statistics: "Statistics & Probability",
  literary: "Literary Text",
  informational: "Informational Text",
  vocabulary: "Vocabulary",
};

export const SUBJECT_AREAS: Record<Subject, Area[]> = {
  math: ["algebra", "numbers", "geometry", "statistics"],
  reading: ["literary", "informational", "vocabulary"],
};
