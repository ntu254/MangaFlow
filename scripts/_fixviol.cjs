const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";
function patch(file, replacements) {
  const p = SRC + "/" + file;
  let c = fs.readFileSync(p, "utf8");
  let n = 0;
  for (const [from, to] of replacements) {
    if (c.includes(from)) { c = c.split(from).join(to); n++; }
    else console.log("  WARN not found in " + file + ": " + from);
  }
  fs.writeFileSync(p, c, "utf8");
  console.log("patched " + file + " (" + n + " repl)");
}

// decisionEffect now in entities/proposal/model/decision-effect
patch("entities/proposal/ui/decision-effect-preview.tsx", [
  ['from "@/lib/board-access"', 'from "@/entities/proposal/model/decision-effect"'],
]);
// evaluateBoardTally now in entities/proposal/model/board-tally
patch("entities/proposal/ui/decision-history.tsx", [
  ['from "@/lib/proposal-machine"', 'from "@/entities/proposal/model/board-tally"'],
]);
patch("entities/proposal/ui/vote-tally.tsx", [
  ['from "@/lib/proposal-machine"', 'from "@/entities/proposal/model/board-tally"'],
]);
// series production now in entities/series/model/series-production
patch("entities/series/ui/series-card.tsx", [
  ['from "@/lib/series-production-helpers"', 'from "@/entities/series/model/series-production"'],
]);
// review types now in entities/submission/model/review-types
patch("entities/submission/ui/deadline-risk-pill.tsx", [
  ['from "@/lib/editor-access"', 'from "@/entities/submission/model/review-types"'],
]);
patch("entities/submission/ui/priority-pill.tsx", [
  ['from "@/lib/editor-access"', 'from "@/entities/submission/model/review-types"'],
]);
// UNSUPPORTED_MVP now in shared/config/ui-copy
patch("shared/ui/decision-actions.tsx", [
  ['from "@/lib/studio-types"', 'from "@/shared/config/ui-copy"'],
]);
console.log("DONE");
