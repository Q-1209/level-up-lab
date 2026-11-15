// "My words": words the student tapped because they didn't know them.
// Saved in this browser (localStorage) together with the sentence they appeared in.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SavedWord {
  word: string; // normalized: lowercase, no surrounding punctuation
  context: string; // sentence where it was first marked
  questionId?: string;
  at: number;
}

const KEY = "levelUpLab.words.v1";

function load(): SavedWord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedWord[]) : [];
  } catch {
    return [];
  }
}

function persist(words: SavedWord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(words));
  } catch {
    /* storage unavailable */
  }
}

export const normalizeWord = (w: string) => w.toLowerCase().replace(/[’']s$/, "").replace(/^[^a-z]+|[^a-z]+$/g, "");

/** The sentence of `text` that contains `word` (falls back to a trimmed snippet). */
export function sentenceFor(text: string, word: string): string {
  const sentences = text.replace(/\$[^$]*\$/g, "…").split(/(?<=[.!?…"])\s+/);
  const re = new RegExp(`\\b${word.replace(/[^a-z]/gi, "")}`, "i");
  const hit = sentences.find((s) => re.test(s)) ?? text;
  return hit.length > 220 ? hit.slice(0, 217) + "…" : hit.trim();
}

interface WordsState {
  words: SavedWord[];
  marking: boolean;
  setMarking: (on: boolean) => void;
  isSaved: (word: string) => boolean;
  toggle: (rawWord: string, sourceText: string, questionId?: string) => void;
  remove: (word: string) => void;
}

const Ctx = createContext<WordsState | null>(null);

export function WordsProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<SavedWord[]>(load);
  const [marking, setMarking] = useState(false);
  const saved = useMemo(() => new Set(words.map((w) => w.word)), [words]);

  const update = useCallback((fn: (prev: SavedWord[]) => SavedWord[]) => {
    setWords((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<WordsState>(
    () => ({
      words,
      marking,
      setMarking,
      isSaved: (w) => saved.has(normalizeWord(w)),
      toggle: (raw, sourceText, questionId) => {
        const word = normalizeWord(raw);
        if (word.length < 2) return;
        update((prev) =>
          prev.some((w) => w.word === word)
            ? prev.filter((w) => w.word !== word)
            : [...prev, { word, context: sentenceFor(sourceText, word), questionId, at: Date.now() }],
        );
      },
      remove: (word) => update((prev) => prev.filter((w) => w.word !== word)),
    }),
    [words, marking, saved, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWords(): WordsState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWords outside WordsProvider");
  return v;
}

/** Plain text where each English word can be tapped while marking mode is on. */
export function MarkableText({ text, source, questionId }: { text: string; source?: string; questionId?: string }) {
  const { marking, isSaved, toggle } = useWords();
  const parts = text.split(/([A-Za-z][A-Za-z'’-]*[A-Za-z]|[A-Za-z])/);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return p;
        const saved = isSaved(p);
        if (!marking && !saved) return p;
        return (
          <span
            key={i}
            className={`w${marking ? " tappable" : ""}${saved ? " saved" : ""}`}
            onClick={
              marking
                ? (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggle(p, source ?? text, questionId);
                  }
                : undefined
            }
          >
            {p}
          </span>
        );
      })}
    </>
  );
}

/** Toggle button shown on question screens. */
export function MarkWordsToggle() {
  const { marking, setMarking } = useWords();
  return (
    <button className={`mark-toggle${marking ? " on" : ""}`} onClick={() => setMarking(!marking)} aria-pressed={marking}>
      {marking ? "Done marking" : "Mark words I don't know"}
    </button>
  );
}
