const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

console.log("########## proposal-machine.ts: TallyResult type def ##########");
const pm = fs.readFileSync(SRC + "/features/proposals/model/proposal-machine.ts", "utf8").split("\n");
const ti = pm.findIndex(l=>/TallyResult/.test(l));
console.log("first TallyResult mention @ line " + (ti+1));
// find the type definition
const tdef = pm.findIndex(l=>/(type|interface)\s+TallyResult/.test(l));
console.log("type def @ " + (tdef+1));
if(tdef>=0) console.log(pm.slice(tdef, tdef+14).join("\n"));
console.log("--- proposal-machine imports (head) ---");
console.log(pm.slice(0,12).join("\n"));

console.log("\n########## series-production-helpers.ts: SeriesProductionSummary + formatDeadline ##########");
const sph = fs.readFileSync(SRC + "/features/series/detail/model/series-production-helpers.ts", "utf8").split("\n");
const sidx = sph.findIndex(l=>/export type SeriesProductionSummary/.test(l));
console.log(sph.slice(sidx, sidx+40).join("\n"));
const fidx = sph.findIndex(l=>/export function formatDeadline/.test(l));
console.log("--- formatDeadline ---");
console.log(sph.slice(fidx, fidx+10).join("\n"));
const lidx = sph.findIndex(l=>/export const PRIMARY_ACTION_LABEL/.test(l));
console.log("--- PRIMARY_ACTION_LABEL ---");
console.log(sph.slice(lidx, lidx+10).join("\n"));
