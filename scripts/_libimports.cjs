const fs = require("fs");
function walk(d, out) {
  for (const f of fs.readdirSync(d)) {
    const fp = d + "/" + f;
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(fp);
  }
  return out;
}
const files = walk("E:/storyboard-nexus/src", []);
const counts = {};
const importRe = /from\s+["']([^"']+)["']/g;
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  let m;
  while ((m = importRe.exec(c))) {
    const spec = m[1];
    if (spec.includes("@/lib/") || /(^|\/)lib\//.test(spec)) {
      counts[spec] = (counts[spec] || 0) + 1;
    }
  }
}
const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
console.log("distinct lib/* import specifiers: " + keys.length);
for (const k of keys) console.log(counts[k] + "\t" + k);
