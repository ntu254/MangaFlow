const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

console.log("########## editor-access.ts: ReviewPriority + DeadlineRisk region ##########");
const ea = fs.readFileSync(SRC + "/features/editor/model/editor-access.ts", "utf8").split("\n");
console.log(ea.slice(0, 45).join("\n"));
console.log("...");
console.log(ea.slice(155, 200).join("\n"));

console.log("\n########## series-production-helpers.ts (head + symbol defs) ##########");
const sph = fs.readFileSync(SRC + "/features/series/detail/model/series-production-helpers.ts", "utf8").split("\n");
sph.forEach((l,i)=>{ if(/export (type|const|function) (SeriesProductionSummary|PRIMARY_ACTION_LABEL|formatDeadline)/.test(l)) console.log((i+1)+": "+l); });
console.log("--- import block ---");
console.log(sph.slice(0,12).join("\n"));
