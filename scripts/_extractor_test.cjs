const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

// Extract a top-level export (type or function or const) by line+brace balancing.
// Returns { text, startIdx, endIdx } where indices are line numbers (0-based, inclusive).
function extractExport(lines, symbolName) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (new RegExp("^export\\s+(async\\s+)?(function|const|type|interface)\\s+" + symbolName + "\\b").test(l)) {
      start = i; break;
    }
  }
  if (start === -1) return null;
  // balance braces from start until they net to zero AND statement terminates
  let depth = 0, seenOpen = false, end = start;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "{") { depth++; seenOpen = true; }
      else if (ch === "}") depth--;
    }
    end = i;
    // type alias / const without braces ends at first line ending with ; or = ... ;
    if (!seenOpen) {
      if (/;\s*$/.test(line) || /=\s*[^=].*[^{]$/.test(line) && /;\s*$/.test(line)) { end = i; break; }
      if (/;\s*$/.test(line)) { end = i; break; }
    } else if (depth === 0) { end = i; break; }
  }
  return { text: lines.slice(start, end + 1).join("\n"), start, end };
}

// Quick test on each target
const tests = [
  ["features/proposals/model/proposal-machine.ts", "TallyResult"],
  ["features/proposals/model/proposal-machine.ts", "evaluateBoardTally"],
  ["features/board/model/board-access.ts", "decisionEffect"],
  ["features/series/detail/model/series-production-helpers.ts", "SeriesPrimaryAction"],
  ["features/series/detail/model/series-production-helpers.ts", "SeriesProductionSummary"],
  ["features/series/detail/model/series-production-helpers.ts", "PRIMARY_ACTION_LABEL"],
  ["features/series/detail/model/series-production-helpers.ts", "formatDeadline"],
  ["features/editor/model/editor-access.ts", "ReviewPriority"],
  ["features/editor/model/editor-access.ts", "DeadlineRisk"],
  ["entities/series/model/studio-types.ts", "UNSUPPORTED_MVP"],
];
for (const [f, sym] of tests) {
  const lines = fs.readFileSync(SRC + "/" + f, "utf8").split("\n");
  const r = extractExport(lines, sym);
  if (!r) { console.log("MISS " + sym); continue; }
  const preview = r.text.split("\n").slice(0,2).join(" | ");
  console.log("OK " + sym + " [lines " + (r.start+1) + "-" + (r.end+1) + "]: " + preview.slice(0,90));
}
