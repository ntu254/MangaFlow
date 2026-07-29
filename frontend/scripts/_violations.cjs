const fs = require("fs");
function walk(d,out){for(const f of fs.readdirSync(d)){const fp=d+"/"+f;const st=fs.statSync(fp);if(st.isDirectory())walk(fp,out);else if(/\.(ts|tsx)$/.test(f))out.push(fp);}return out;}
const SRC="E:/storyboard-nexus/src";
const files=walk(SRC,[]);

// shims that landed in FEATURES (entities/shared importing these = violation)
const featureShims=["@/lib/board-adapters","@/lib/proposal-machine","@/lib/editor-access","@/lib/assistant-access","@/lib/board-access","@/lib/studio-permissions","@/lib/series-production-helpers","@/lib/chapter-machine","@/lib/voting-machine","@/lib/workflow/at-risk-decision-utils","@/lib/workflow/ranking-source-utils"];
// shims that landed in ENTITIES (shared importing these = violation)
const entityShims=["@/lib/studio-types","@/lib/board-types","@/lib/proposal-types","@/lib/series-types","@/lib/voting-types","@/lib/assistant-types","@/lib/chapter-pages","@/lib/materials/map-material"];

console.log("=== ENTITIES importing feature-located files (entity->feature VIOLATION) ===");
for(const f of files){
  const rel=f.replace(SRC+"/","");
  if(!rel.startsWith("entities/"))continue;
  const c=fs.readFileSync(f,"utf8");
  for(const s of featureShims){ if(c.includes('"'+s+'"')) console.log(rel+"  imports  "+s); }
}
console.log("\n=== SHARED importing entity/feature-located files (shared->above VIOLATION) ===");
for(const f of files){
  const rel=f.replace(SRC+"/","");
  if(!rel.startsWith("shared/"))continue;
  const c=fs.readFileSync(f,"utf8");
  for(const s of [...entityShims,...featureShims]){ if(c.includes('"'+s+'"')) console.log(rel+"  imports  "+s); }
}
