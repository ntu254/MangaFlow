const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const targets = [];

function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (f === "ui") continue;
      walk(fp);
    } else if (/\.(ts|tsx)$/.test(f)) {
      targets.push(fp);
    }
  }
}

walk(root);

const sourceMap = new Map();

const re = /from\s+["'](@\/(?:[^"']+))["']/g;

for (const file of targets) {
  const content = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(content)) !== null) {
    const imp = m[1];
    if (!sourceMap.has(imp)) sourceMap.set(imp, new Set());
    sourceMap.get(imp).add(path.relative(root, file).replace(/\\/g, "/"));
  }
}

const rules = [
  { from: "shared/", not: ["entities/", "features/"] },
  { from: "entities/", not: ["features/"] },
  { from: "routes/", not: ["components/", "hooks/", "lib/", "entities/", "features/"] },
];

console.log("rule\tviolation\tfile");

let violationCount = 0;

for (const rule of rules) {
  for (const [source, files] of sourceMap.entries()) {
    if (!source.startsWith(rule.from)) continue;
    for (const file of files) {
      for (const bad of rule.not) {
        if (file.startsWith(bad)) {
          violationCount += 1;
          console.log([rule.from, source, file].join("\t"));
        }
      }
    }
  }
}

if (violationCount > 0) {
  console.error(`Architecture boundary check failed with ${violationCount} violation(s).`);
  process.exitCode = 1;
}
