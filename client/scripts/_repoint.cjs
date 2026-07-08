const fs = require("fs");
const path = require("path");
function walk(d,out){for(const f of fs.readdirSync(d)){const fp=d+"/"+f;const st=fs.statSync(fp);if(st.isDirectory())walk(fp,out);else if(/\.(ts|tsx)$/.test(f))out.push(fp);}return out;}
const SRC="E:/storyboard-nexus/src";
const files=walk(SRC,[]);

// shim module -> canonical destination (no ext)
const map = {
  "@/lib/studio-types":"@/entities/series/model/studio-types",
  "@/lib/board-types":"@/entities/board/model/board-types",
  "@/lib/proposal-types":"@/entities/proposal/model/proposal-types",
  "@/lib/series-types":"@/entities/series/model/series-types",
  "@/lib/voting-types":"@/entities/board/model/voting-types",
  "@/lib/assistant-types":"@/entities/task/model/assistant-types",
  "@/lib/chapter-pages":"@/entities/chapter/model/chapter-pages",
  "@/lib/materials/map-material":"@/entities/proposal/model/map-material",
  "@/lib/board-adapters":"@/features/board/model/board-adapters",
  "@/lib/proposal-machine":"@/features/proposals/model/proposal-machine",
  "@/lib/editor-access":"@/features/editor/model/editor-access",
  "@/lib/assistant-access":"@/features/assistant/model/assistant-access",
  "@/lib/board-access":"@/features/board/model/board-access",
  "@/lib/studio-permissions":"@/features/series/detail/model/studio-permissions",
  "@/lib/series-production-helpers":"@/features/series/detail/model/series-production-helpers",
  "@/lib/chapter-machine":"@/features/series/detail/model/chapter-machine",
  "@/lib/voting-machine":"@/features/board/sessions/model/voting-machine",
  "@/lib/workflow/at-risk-decision-utils":"@/features/board/at-risk/model/at-risk-decision-utils",
  "@/lib/workflow/ranking-source-utils":"@/features/board/rankings/model/ranking-source-utils",
};

// Sort keys by length desc so longer specifiers match first (avoid prefix collisions)
const keys = Object.keys(map).sort((a,b)=>b.length-a.length);
let totalEdits = 0, filesChanged = 0;
for (const f of files) {
  const rel = f.replace(SRC + "/", "");
  // do not rewrite the shim files themselves (they live in src/lib and intentionally point at canonical)
  if (rel.startsWith("lib/")) continue;
  // do not rewrite the canonical files importing their own siblings via relative paths (they don't use @/lib for these)
  let c = fs.readFileSync(f, "utf8");
  let edits = 0;
  for (const k of keys) {
    // match exact module specifier in quotes
    const reD = new RegExp('"' + k.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + '"', "g");
    const reS = new RegExp("'" + k.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "'", "g");
    const before = c;
    c = c.replace(reD, '"' + map[k] + '"').replace(reS, "'" + map[k] + "'");
    if (c !== before) edits++;
  }
  if (edits > 0) { fs.writeFileSync(f, c, "utf8"); totalEdits += edits; filesChanged++; }
}
console.log("files changed: " + filesChanged + ", specifier-groups rewritten: " + totalEdits);
