const fs = require("fs");
const SRC = "E:/storyboard-nexus/src";
function show(file, startMatch, n) {
  const c = fs.readFileSync(SRC + "/" + file, "utf8").split("\n");
  const idx = c.findIndex(l => l.includes(startMatch));
  if (idx === -1) { console.log("NOT FOUND: " + startMatch + " in " + file); return; }
  console.log("--- " + file + " @ " + startMatch + " ---");
  console.log(c.slice(idx, idx + n).join("\n"));
}
// decisionEffect (board-access)
show("features/board/model/board-access.ts", "export function decisionEffect", 30);
// evaluateBoardTally + TallyResult (proposal-machine)
show("features/proposals/model/proposal-machine.ts", "evaluateBoardTally", 25);
