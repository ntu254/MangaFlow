const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";

// What series-card imports from series-production-helpers
console.log("=== series-card.tsx import block ===");
const sc = fs.readFileSync(SRC + "/entities/series/ui/series-card.tsx", "utf8").split("\n");
let cap = false;
sc.forEach(l => { if (l.includes("series-production-helpers")) { console.log(l); } });
// show the multi-line import
const scText = fs.readFileSync(SRC + "/entities/series/ui/series-card.tsx", "utf8");
const m = scText.match(/import\s*\{[^}]*\}\s*from\s*["']@\/lib\/series-production-helpers["']/s);
console.log(m ? m[0] : "(single-line)");

// decisionEffect signature
console.log("\n=== decisionEffect in board-access ===");
const ba = fs.readFileSync(SRC + "/features/board/model/board-access.ts", "utf8").split("\n");
ba.forEach((l,i)=>{ if(/decisionEffect/.test(l)) console.log((i+1)+": "+l); });

// evaluateBoardTally signature
console.log("\n=== evaluateBoardTally in proposal-machine ===");
const pm = fs.readFileSync(SRC + "/features/proposals/model/proposal-machine.ts", "utf8").split("\n");
pm.forEach((l,i)=>{ if(/evaluateBoardTally/.test(l)) console.log((i+1)+": "+l); });

// DeadlineRisk / ReviewPriority defs
console.log("\n=== DeadlineRisk / ReviewPriority in editor-access ===");
const ea = fs.readFileSync(SRC + "/features/editor/model/editor-access.ts", "utf8").split("\n");
ea.forEach((l,i)=>{ if(/DeadlineRisk|ReviewPriority/.test(l)) console.log((i+1)+": "+l); });

// UNSUPPORTED_MVP def
console.log("\n=== UNSUPPORTED_MVP in studio-types ===");
const st = fs.readFileSync(SRC + "/entities/series/model/studio-types.ts", "utf8").split("\n");
st.forEach((l,i)=>{ if(/UNSUPPORTED_MVP/.test(l)) console.log((i+1)+": "+l); });

// is decision-actions really shared? check its other imports + who consumes it
console.log("\n=== shared/ui/decision-actions.tsx imports ===");
const da = fs.readFileSync(SRC + "/shared/ui/decision-actions.tsx", "utf8");
[...da.matchAll(/from\s+["']([^"']+)["']/g)].forEach(mm=>console.log("   "+mm[1]));
