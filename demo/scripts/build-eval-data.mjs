// Precompute the "Before vs after" data from results/eval_outputs.csv.
//
//   node scripts/build-eval-data.mjs        (run from demo/)
//
// Writes:
//   data/eval_curated.json       ~15 hand-picked "fixed" examples, bundled into the page
//   public/data/eval_pool.json   all fixed + all broken + a random sample, fetched on demand
//
// Grading uses lib/answer.ts (the same code the UI uses), so the counts here and the
// badges on the page can't disagree. Node 24 runs the .ts import directly.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractAnswer, sameNumber } from "../lib/answer.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "..", "results", "eval_outputs.csv");
const RANDOM_N = 150;
const SEED = 42;

// Row indices in eval_outputs.csv. Picked for: base answer clearly wrong (and the extracted
// number is what the base model actually said, not a misread), GRPO answer short and clean.
const CURATED = [810, 1109, 128, 15, 622, 1056, 450, 207, 610, 1038, 144, 748, 1157, 471, 146];

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const [header, ...body] = parseCsv(readFileSync(CSV, "utf8"));
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const rows = body
  .filter((r) => r.length === header.length)
  .map((r, id) => ({
    id,
    question: r[col.question],
    gold: String(r[col.gold]).replace(/,/g, ""),
    base: r[col.base],
    grpo: r[col.grpo],
  }));

const ok = (text, gold) => sameNumber(extractAnswer(text), gold);
const fixed = [], broken = [];
let baseRight = 0, grpoRight = 0;
for (const r of rows) {
  const b = ok(r.base, r.gold), g = ok(r.grpo, r.gold);
  baseRight += b; grpoRight += g;
  if (!b && g) fixed.push(r.id);
  if (b && !g) broken.push(r.id);
}

const pct = (n) => ((100 * n) / rows.length).toFixed(1);
console.log(`rows ${rows.length}  base ${pct(baseRight)}%  grpo ${pct(grpoRight)}%`);
console.log(`fixed ${fixed.length}  broken ${broken.length}  net +${fixed.length - broken.length}`);

const expect = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } };
expect(rows.length === 1319, `expected 1319 rows, got ${rows.length}`);
expect(fixed.length === 227, `expected 227 fixed, got ${fixed.length}`);
expect(broken.length === 128, `expected 128 broken, got ${broken.length}`);
for (const id of CURATED) expect(fixed.includes(id), `curated row ${id} is not in the fixed set`);

// Uniform sample from the whole test set (so it includes both-right and both-wrong rows)
const rand = mulberry32(SEED);
const ids = rows.map((r) => r.id);
for (let i = ids.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [ids[i], ids[j]] = [ids[j], ids[i]];
}
const random = ids.slice(0, RANDOM_N).sort((a, b) => a - b);

const keep = new Set([...fixed, ...broken, ...random]);
const pool = {
  total: rows.length,
  fixed,
  broken,
  random,
  rows: rows.filter((r) => keep.has(r.id)),
};
const curated = {
  total: rows.length,
  fixedCount: fixed.length,
  brokenCount: broken.length,
  randomCount: random.length,
  rows: CURATED.map((id) => rows[id]),
};

mkdirSync(join(ROOT, "public", "data"), { recursive: true });
writeFileSync(join(ROOT, "public", "data", "eval_pool.json"), JSON.stringify(pool));
writeFileSync(join(ROOT, "data", "eval_curated.json"), JSON.stringify(curated, null, 1));
console.log(`pool: ${pool.rows.length} rows, ${(JSON.stringify(pool).length / 1024).toFixed(0)} KB`);
console.log(`curated: ${curated.rows.length} rows, ${(JSON.stringify(curated).length / 1024).toFixed(0)} KB`);
