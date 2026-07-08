const fs = require('fs');
const path = require('path');

const root = path.resolve('E:/storyboard-nexus/src');

function walk(d, out) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (f === 'ui') continue;
      walk(fp, out);
    } else if (/\.(ts|tsx)$/.test(f)) {
      out.push(fp);
    }
  }
  return out;
}

const app = walk(root, []);

for (const file of app) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content
    .replace(/from\s+["'](@\/components\/(?!ui)[^"']+)["']/g, "from '$1'")
    .replace(/from\s+["'](@\/(?:components|hooks|lib|shared|entities|features)\/([^"']+))["']/g, "from '$1'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('patched', path.relative(root, file));
  }
}

console.log('done');
