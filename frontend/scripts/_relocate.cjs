const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

function read(f){ return fs.readFileSync(SRC + "/" + f, "utf8"); }
function write(f, c){ fs.mkdirSync(require("path").dirname(SRC + "/" + f), { recursive: true }); fs.writeFileSync(SRC + "/" + f, c, "utf8"); }

function extractExport(lines, symbolName) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp("^export\\s+(async\\s+)?(function|const|type|interface)\\s+" + symbolName + "\\b").test(lines[i])) { start = i; break; }
  }
  if (start === -1) return null;
  let depth = 0, seenOpen = false, end = start;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === "{") { depth++; seenOpen = true; } else if (ch === "}") depth--; }
    end = i;
    if (!seenOpen) { if (/;\s*$/.test(lines[i])) { end = i; break; } }
    else if (depth === 0) { end = i; break; }
  }
  return { text: lines.slice(start, end + 1).join("\n"), start, end };
}

// Pull a set of named symbols out of a source file: returns {extracted:[{name,text}], remainingLines}
function pullSymbols(sourceRel, names) {
  let lines = read(sourceRel).split("\n");
  const extracted = [];
  // extract in reverse line order to keep indices valid while splicing
  const found = names.map(n => ({ n, r: extractExport(lines, n) })).filter(x => x.r);
  // sort by start desc
  found.sort((a, b) => b.r.start - a.r.start);
  for (const { n, r } of found) {
    extracted.unshift({ name: n, text: r.text });
    lines.splice(r.start, r.end - r.start + 1);
  }
  return { extracted, remaining: lines.join("\n") };
}

// ---- Relocation A: board tally -> entities/proposal/model/board-tally.ts ----
{
  const src = "features/proposals/model/proposal-machine.ts";
  const { extracted, remaining } = pullSymbols(src, ["TallyResult", "evaluateBoardTally"]);
  const newFile = "entities/proposal/model/board-tally.ts";
  const header = 'import type { BoardVote, ProposalStatus } from "./proposal-types";\nimport { BOARD_QUORUM, BOARD_TOTAL } from "./proposal-types";\n\n';
  write(newFile, header + extracted.map(e => e.text).join("\n\n") + "\n");
  // source: add import for internal use + re-export
  const inject = 'import { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";\nexport { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";\n';
  write(src, inject + remaining);
  console.log("A: board-tally -> entities/proposal/model (" + extracted.map(e=>e.name).join(", ") + ")");
}

// ---- Relocation B: decisionEffect -> entities/proposal/model/decision-effect.ts ----
{
  const src = "features/board/model/board-access.ts";
  const { extracted, remaining } = pullSymbols(src, ["decisionEffect"]);
  const newFile = "entities/proposal/model/decision-effect.ts";
  const header = 'import type { SeriesProposal } from "./proposal-types";\n\n';
  write(newFile, header + extracted.map(e => e.text).join("\n\n") + "\n");
  const inject = 'export { decisionEffect } from "@/entities/proposal/model/decision-effect";\n';
  write(src, inject + remaining);
  console.log("B: decision-effect -> entities/proposal/model (" + extracted.map(e=>e.name).join(", ") + ")");
}

// ---- Relocation C: series production -> entities/series/model/series-production.ts ----
{
  const src = "features/series/detail/model/series-production-helpers.ts";
  const { extracted, remaining } = pullSymbols(src, ["SeriesPrimaryAction", "SeriesProductionSummary", "PRIMARY_ACTION_LABEL", "formatDeadline"]);
  const newFile = "entities/series/model/series-production.ts";
  const header = 'import type { ChapterStatus } from "./series-types";\n\n';
  write(newFile, header + extracted.map(e => e.text).join("\n\n") + "\n");
  const inject =
    'import type { SeriesPrimaryAction, SeriesProductionSummary } from "@/entities/series/model/series-production";\n' +
    'import { PRIMARY_ACTION_LABEL, formatDeadline } from "@/entities/series/model/series-production";\n' +
    'export type { SeriesPrimaryAction, SeriesProductionSummary } from "@/entities/series/model/series-production";\n' +
    'export { PRIMARY_ACTION_LABEL, formatDeadline } from "@/entities/series/model/series-production";\n';
  write(src, inject + remaining);
  console.log("C: series-production -> entities/series/model (" + extracted.map(e=>e.name).join(", ") + ")");
}

// ---- Relocation D: review types -> entities/submission/model/review-types.ts ----
{
  const src = "features/editor/model/editor-access.ts";
  const { extracted, remaining } = pullSymbols(src, ["ReviewPriority", "DeadlineRisk"]);
  const newFile = "entities/submission/model/review-types.ts";
  write(newFile, extracted.map(e => e.text).join("\n\n") + "\n");
  const inject =
    'import type { ReviewPriority, DeadlineRisk } from "@/entities/submission/model/review-types";\n' +
    'export type { ReviewPriority, DeadlineRisk } from "@/entities/submission/model/review-types";\n';
  write(src, inject + remaining);
  console.log("D: review-types -> entities/submission/model (" + extracted.map(e=>e.name).join(", ") + ")");
}

// ---- Relocation E: UNSUPPORTED_MVP -> shared/config/ui-copy.ts ----
{
  const src = "entities/series/model/studio-types.ts";
  const { extracted, remaining } = pullSymbols(src, ["UNSUPPORTED_MVP"]);
  const newFile = "shared/config/ui-copy.ts";
  write(newFile, extracted.map(e => e.text).join("\n\n") + "\n");
  const inject = 'export { UNSUPPORTED_MVP } from "@/shared/config/ui-copy";\n';
  write(src, inject + remaining);
  console.log("E: UNSUPPORTED_MVP -> shared/config/ui-copy (" + extracted.map(e=>e.name).join(", ") + ")");
}

console.log("RELOCATIONS DONE");
