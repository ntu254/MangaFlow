const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");

function walk(d, out) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(fp);
  }
  return out;
}

const files = walk(root, []);
const sources = new Set();

const re = /from\s+["'](@\/(?:[^"']+))["']/g;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(content)) !== null) {
    sources.add(m[1]);
  }
}

const sorted = Array.from(sources).sort();
console.log("source_count\t" + sorted.length);
for (const source of sorted) {
  console.log("source\t" + source);
}
