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
const shims=Object.keys(map);
// classify consumers by layer
const report={};
for(const f of files){
  const c=fs.readFileSync(f,"utf8");
  for(const shim of shims){
    const re=new RegExp('from\\s+["\\047]'+shim.replace(/[/]/g,'\\/')+'["\\047]','g');
    if(re.test(c)){
      const rel=f.replace(SRC+"/","");
      const layer=rel.startsWith("routes/")?"routes":rel.startsWith("features/")?"features":rel.startsWith("entities/")?"entities":rel.startsWith("shared/")?"shared":rel.startsWith("lib/")?"lib":"other";
      report[shim]=report[shim]||{routes:0,features:0,entities:0,shared:0,lib:0,other:0};
      report[shim][layer]++;
    }
  }
}
console.log("shim -> consumers by layer (routes matter for boundary lint):");
for(const s of shims){
  const r=report[s]; if(!r)continue;
  console.log(s+"  routes="+r.routes+" features="+r.features+" entities="+r.entities+" shared="+r.shared+" lib="+r.lib+" other="+r.other);
}
