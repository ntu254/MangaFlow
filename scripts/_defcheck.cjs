const fs = require("fs");
const files = [
  "studio-types","board-types","proposal-types","series-types","voting-types",
  "assistant-types","board-adapters","chapter-pages","proposal-machine",
  "editor-access","assistant-access","board-access","studio-permissions",
  "series-production-helpers","chapter-machine","voting-machine"
];
for (const f of files) {
  const p = "E:/storyboard-nexus/src/lib/" + f + ".ts";
  const c = fs.readFileSync(p, "utf8");
  const hasDefault = /export\s+default\b/.test(c);
  console.log((hasDefault ? "DEFAULT " : "named   ") + f);
}
// workflow + materials
for (const p of ["workflow/at-risk-decision-utils","workflow/ranking-source-utils","materials/map-material"]) {
  const c = fs.readFileSync("E:/storyboard-nexus/src/lib/" + p + ".ts", "utf8");
  console.log((/export\s+default\b/.test(c) ? "DEFAULT " : "named   ") + p);
}
