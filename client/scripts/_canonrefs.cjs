const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";
const dests = [
  "entities/series/model/studio-types.ts",
  "entities/board/model/board-types.ts",
  "entities/proposal/model/proposal-types.ts",
  "entities/series/model/series-types.ts",
  "entities/board/model/voting-types.ts",
  "entities/task/model/assistant-types.ts",
  "entities/chapter/model/chapter-pages.ts",
  "entities/proposal/model/map-material.ts",
  "entities/proposal/model/board-tally.ts",
  "entities/proposal/model/decision-effect.ts",
  "entities/series/model/series-production.ts",
  "entities/submission/model/review-types.ts",
  "features/board/model/board-adapters.ts",
  "features/proposals/model/proposal-machine.ts",
  "features/editor/model/editor-access.ts",
  "features/assistant/model/assistant-access.ts",
  "features/board/model/board-access.ts",
  "features/series/detail/model/studio-permissions.ts",
  "features/series/detail/model/series-production-helpers.ts",
  "features/series/detail/model/chapter-machine.ts",
  "features/board/sessions/model/voting-machine.ts",
  "features/board/at-risk/model/at-risk-decision-utils.ts",
  "features/board/rankings/model/ranking-source-utils.ts",
];
for (const f of dests) {
  const c = fs.readFileSync(SRC + "/" + f, "utf8");
  const libRefs = [...c.matchAll(/from\s+["'](@\/lib\/[^"']+)["']/g)].map(m=>m[1]);
  if (libRefs.length) console.log(f + " -> " + [...new Set(libRefs)].join(", "));
}
console.log("(files not listed have no @/lib refs)");
