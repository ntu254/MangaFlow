const fs = require("fs");
console.log("=== src/lib/proposal-types.ts (shim) ===");
console.log(fs.readFileSync("E:/storyboard-nexus/src/lib/proposal-types.ts", "utf8"));
console.log("=== src/entities/proposal/model/proposal-types.ts (first 20 lines) ===");
const c = fs.readFileSync("E:/storyboard-nexus/src/entities/proposal/model/proposal-types.ts", "utf8").split("\n");
c.slice(0,20).forEach((l,i)=>console.log((i+1)+": "+l));
console.log("...total lines: " + c.length);
console.log("=== grep VoteDecision in dest ===");
c.forEach((l,i)=>{ if(/VoteDecision/.test(l)) console.log((i+1)+": "+l); });
