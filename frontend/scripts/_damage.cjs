const fs = require("fs");
const { execSync } = require("child_process");
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
for (const [srcRel,dstRel] of moves) {
  const dst = SRC+"/"+dstRel;
  const dstLines = fs.readFileSync(dst,"utf8").split("\n").filter(l=>l.trim()).length;
  // check if dst is a shim (small + contains export * from @/<dst>)
  const dstC = fs.readFileSync(dst,"utf8");
  const selfRef = dstC.includes('export * from "@/'+dstRel.replace(/\.ts$/,'')+'"');
  console.log((selfRef?"BROKEN ":"ok     ")+dstRel+"  ("+dstLines+" lines)");
}
// Check git availability of originals at HEAD
console.log("\n=== git HEAD has originals? ===");
for (const f of ["src/lib/proposal-types.ts","src/lib/board-types.ts","src/lib/studio-types.ts"]) {
  try { const out=execSync('git -C E:/storyboard-nexus show HEAD:"'+f+'"',{encoding:"utf8"}); console.log(f+": "+out.split("\n").length+" lines at HEAD"); }
  catch(e){ console.log(f+": NOT at HEAD ("+(e.message.split("\n")[0])+")"); }
}
