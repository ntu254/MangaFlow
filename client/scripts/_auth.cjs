const fs = require("fs");
const path = require("path");
const SRC = "E:/storyboard-nexus/src";

// 1. Move auth.ts content -> shared/auth/auth-store.ts with fixed internal imports
const orig = fs.readFileSync(SRC + "/lib/auth.ts", "utf8");
const moved = orig
  .replace(/from\s+(["'])\.\/api\/client\1/g, 'from "@/shared/api/client"')
  .replace(/from\s+(["'])\.\/api\/auth\1/g, 'from "@/shared/api/auth"');
fs.mkdirSync(SRC + "/shared/auth", { recursive: true });
fs.writeFileSync(SRC + "/shared/auth/auth-store.ts", moved, "utf8");
fs.writeFileSync(SRC + "/shared/auth/index.ts", 'export * from "./auth-store";\n', "utf8");
console.log("moved auth.ts -> shared/auth/auth-store.ts (" + moved.split("\n").length + " lines)");

// 2. Shim src/lib/auth.ts
fs.writeFileSync(SRC + "/lib/auth.ts", '// Moved to @/shared/auth (FDM migration). Kept as re-export shim for backward compatibility.\nexport * from "@/shared/auth/auth-store";\n', "utf8");
console.log("shimmed src/lib/auth.ts");

// 3. Repoint all @/lib/auth consumers -> @/shared/auth
function walk(d,out){for(const f of fs.readdirSync(d)){const fp=d+"/"+f;const st=fs.statSync(fp);if(st.isDirectory())walk(fp,out);else if(/\.(ts|tsx)$/.test(f))out.push(fp);}return out;}
const files = walk(SRC, []);
let changed = 0;
for (const f of files) {
  const rel = f.replace(SRC + "/", "");
  if (rel === "lib/auth.ts" || rel === "shared/auth/auth-store.ts" || rel === "shared/auth/index.ts") continue;
  let c = fs.readFileSync(f, "utf8");
  if (c.includes('"@/lib/auth"') || c.includes("'@/lib/auth'")) {
    c = c.split('"@/lib/auth"').join('"@/shared/auth"').split("'@/lib/auth'").join("'@/shared/auth'");
    fs.writeFileSync(f, c, "utf8");
    changed++;
  }
}
console.log("repointed @/lib/auth consumers: " + changed);
