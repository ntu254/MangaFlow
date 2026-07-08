const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";
const cases = [
  ["entities/proposal/ui/decision-effect-preview.tsx", "board-access"],
  ["entities/proposal/ui/decision-history.tsx", "proposal-machine"],
  ["entities/proposal/ui/vote-tally.tsx", "proposal-machine"],
  ["entities/series/ui/series-card.tsx", "series-production-helpers"],
  ["entities/submission/ui/deadline-risk-pill.tsx", "editor-access"],
  ["entities/submission/ui/priority-pill.tsx", "editor-access"],
  ["shared/ui/decision-actions.tsx", "studio-types"],
];
for (const [file, mod] of cases) {
  const c = fs.readFileSync(SRC + "/" + file, "utf8");
  const lines = c.split("\n");
  console.log("=== " + file + "  (imports from " + mod + ") ===");
  lines.forEach(l => { if (l.includes(mod)) console.log("   " + l.trim()); });
}
