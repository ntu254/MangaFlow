const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

console.log("########## proposal-types.ts: BoardVote, TallyResult, BOARD_* ##########");
const pt = fs.readFileSync(SRC + "/entities/proposal/model/proposal-types.ts", "utf8").split("\n");
pt.forEach((l,i)=>{ if(/TallyResult|BoardVote|BOARD_QUORUM|BOARD_TOTAL/.test(l)) console.log((i+1)+": "+l); });

console.log("\n########## proposal-machine.ts: full evaluateBoardTally body ##########");
const pm = fs.readFileSync(SRC + "/features/proposals/model/proposal-machine.ts", "utf8").split("\n");
const start = pm.findIndex(l=>l.includes("export function evaluateBoardTally"));
console.log(pm.slice(start, start+60).join("\n"));
