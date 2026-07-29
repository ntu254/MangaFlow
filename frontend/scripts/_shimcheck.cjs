const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";
const moves = [
  ["lib/studio-types.ts","entities/series/model/studio-types.ts"],
  ["lib/board-types.ts","entities/board/model/board-types.ts"],
  ["lib/proposal-types.ts","entities/proposal/model/proposal-types.ts"],
  ["lib/series-types.ts","entities/series/model/series-types.ts"],
  ["lib/voting-types.ts","entities/board/model/voting-types.ts"],
  ["lib/assistant-types.ts","entities/task/model/assistant-types.ts"],
  ["lib/chapter-pages.ts","entities/chapter/model/chapter-pages.ts"],
  ["lib/materials/map-material.ts","entities/proposal/model/map-material.ts"],
  ["lib/board-adapters.ts","features/board/model/board-adapters.ts"],
  ["lib/proposal-machine.ts","features/proposals/model/proposal-machine.ts"],
  ["lib/editor-access.ts","features/editor/model/editor-access.ts"],
  ["lib/assistant-access.ts","features/assistant/model/assistant-access.ts"],
  ["lib/board-access.ts","features/board/model/board-access.ts"],
  ["lib/studio-permissions.ts","features/series/detail/model/studio-permissions.ts"],
  ["lib/series-production-helpers.ts","features/series/detail/model/series-production-helpers.ts"],
  ["lib/chapter-machine.ts","features/series/detail/model/chapter-machine.ts"],
  ["lib/voting-machine.ts","features/board/sessions/model/voting-machine.ts"],
  ["lib/workflow/at-risk-decision-utils.ts","features/board/at-risk/model/at-risk-decision-utils.ts"],
  ["lib/workflow/ranking-source-utils.ts","features/board/rankings/model/ranking-source-utils.ts"],
];
let bad = 0;
for (const [srcRel, dstRel] of moves) {
  const shimC = fs.readFileSync(SRC + "/" + srcRel, "utf8");
  const dstC = fs.readFileSync(SRC + "/" + dstRel, "utf8");
  const dstNoExt = dstRel.replace(/\.ts$/, "");
  const shimOk = shimC.includes('export * from "@/' + dstNoExt + '"') && shimC.split("\n").filter(l=>l.trim()).length <= 2;
  const dstSelfRef = dstC.includes('export * from "@/' + dstNoExt + '"');
  if (!shimOk || dstSelfRef) { bad++; console.log("BAD " + srcRel + " shimOk=" + shimOk + " dstSelfRef=" + dstSelfRef); }
}
console.log(bad === 0 ? "ALL SHIMS OK (" + moves.length + ")" : bad + " bad");
