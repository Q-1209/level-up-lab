// Checks the question bank for structural mistakes and (for math) wrong answer keys.
// Run: npm run validate
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SUBJECT_AREAS, type Passage, type Question } from "../src/types";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
// Loads and concatenates every src/data/<prefix>*.json file.
const load = <T>(prefix: string): T[] =>
  readdirSync(dataDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as T[]);

const math = load<Question>('math');
const reading = load<Question>('reading');
const passages = load<Passage>('passages');

const errors: string[] = [];
const warnings: string[] = [];
const err = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

/** Turns simple LaTeX like "8\sqrt{2}", "\frac{2}{15}", "90\pi", "37.5\%" into a number, or null. */
export function latexToNumber(src: string): number | null {
  let s = src.trim().replace(/^\$|\$$/g, "").trim();
  s = s
    .replace(/\\text\{[^}]*\}/g, "")
    .replace(/\^\\circ|°/g, "")
    .replace(/\\%|%/g, "")
    .replace(/\\,/g, "") // thin space; plain commas are kept so "(3,-11)" stays unparseable
    .replace(/\\left|\\right/g, "")
    .replace(/\\times|\\cdot/g, "*")
    .replace(/\\pi/g, "(PI)");
  // \frac{a}{b} and \sqrt{x}, innermost first
  for (let i = 0; i < 5; i++) {
    s = s
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))")
      .replace(/\\sqrt\{([^{}]*)\}/g, "(SQRT($1))");
  }
  s = s.replace(/\^\{([^{}]*)\}/g, "**($1)").replace(/\^(\d)/g, "**$1");
  s = s.replace(/\s+/g, "");
  // implicit multiplication: "8(" , ")(" , "8SQRT" , ")PI"
  s = s.replace(/([\d)])(?=[(A-Z])/g, "$1*");
  if (!/^[\d+\-*/().A-Z]*$/.test(s) || /[A-Z]/.test(s.replace(/PI|SQRT/g, ""))) return null;
  s = s.replace(/PI/g, "Math.PI").replace(/SQRT/g, "Math.sqrt");
  try {
    const v = Function(`"use strict"; return (${s});`)();
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

const passageIds = new Set(passages.map((p) => p.id));
const seen = new Set<string>();

for (const p of passages) {
  if (!p.title || !p.text) err(p.id, "passage missing title or text");
}

for (const q of [...math, ...reading]) {
  if (seen.has(q.id)) err(q.id, "duplicate id");
  seen.add(q.id);
  if (!SUBJECT_AREAS[q.subject]?.includes(q.area)) err(q.id, `area "${q.area}" not valid for ${q.subject}`);
  if (!(q.rit >= 180 && q.rit <= 290)) err(q.id, `rit ${q.rit} out of range`);
  if (!q.stem?.trim()) err(q.id, "empty stem");
  if (!q.explanation?.trim()) err(q.id, "empty explanation");
  if (!Array.isArray(q.choices) || q.choices.length !== 4) err(q.id, "needs exactly 4 choices");
  if (new Set(q.choices.map((c) => c.trim())).size !== q.choices.length) err(q.id, "duplicate choices");
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) err(q.id, "answer index out of range");
  if (q.subject === "reading") {
    if (q.passageId && !passageIds.has(q.passageId)) err(q.id, `unknown passage ${q.passageId}`);
    if (!q.passageId && q.area !== "vocabulary") err(q.id, "reading question without passage");
  }
  if ((q.stem.split("$").length - 1) % 2 !== 0) err(q.id, "unbalanced $ in stem");

  if (q.subject === "math") {
    const values = q.choices.map(latexToNumber);
    if (q.calc) {
      let expected: number;
      try {
        expected = Function(`"use strict"; return (${q.calc});`)();
      } catch (e) {
        err(q.id, `calc does not evaluate: ${String(e)}`);
        continue;
      }
      const correct = values[q.answer];
      if (correct === null) err(q.id, `could not parse correct choice "${q.choices[q.answer]}"`);
      else if (!near(correct, expected)) err(q.id, `calc=${expected} but correct choice=${correct}`);
      values.forEach((v, i) => {
        if (i !== q.answer && v !== null && near(v, expected)) err(q.id, `distractor ${i} also equals ${expected}`);
      });
    } else {
      warnings.push(`${q.id}: no calc (answer not machine-checked)`);
    }
  }
}

// Coverage report
const report = (label: string, qs: Question[]) => {
  console.log(`\n${label}: ${qs.length} questions`);
  const areas = [...new Set(qs.map((q) => q.area))];
  for (const a of areas) {
    const rits = qs.filter((q) => q.area === a).map((q) => q.rit).sort((x, y) => x - y);
    console.log(`  ${a.padEnd(14)} ${String(rits.length).padStart(3)}  RIT ${rits[0]}–${rits[rits.length - 1]}`);
  }
};
report("Math", math);
report("Reading", reading);
console.log(`  passages: ${passages.length}`);

if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ` + warnings.join("\n  "));
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("\nOK — question bank is valid.");
