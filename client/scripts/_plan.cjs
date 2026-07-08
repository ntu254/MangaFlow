const fs = require("fs");
function dirs(d){ try { return fs.readdirSync(d).filter(f=>fs.statSync(d+"/"+f).isDirectory()); } catch { return []; } }
console.log("entities:", dirs("E:/storyboard-nexus/src/entities").join(", "));
for (const e of dirs("E:/storyboard-nexus/src/entities")) {
  const base = "E:/storyboard-nexus/src/entities/" + e;
  const sub = dirs(base);
  console.log("  " + e + ": [" + sub.join(", ") + "]");
}
// cross-imports among lib type/machine/access files
const libFiles = ["proposal-types","series-types","voting-types","board-types","assistant-types","studio-types","proposal-machine","chapter-machine","voting-machine","assistant-access","board-access","editor-access","board-adapters","studio-permissions","series-production-helpers","chapter-pages","auth"];
console.log("\n=== internal lib cross-refs ===");
for (const f of libFiles) {
  const p = "E:/storyboard-nexus/src/lib/" + f + ".ts";
  if (!fs.existsSync(p)) { console.log(f + ": MISSING"); continue; }
  const c = fs.readFileSync(p, "utf8");
  const refs = [...c.matchAll(/from\s+["'](@\/lib\/[^"']+|\.\/[^"']+)["']/g)].map(m=>m[1]);
  console.log(f + " -> " + (refs.join(", ") || "(no lib refs)"));
}
