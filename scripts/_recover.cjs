const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const SRC = "E:/storyboard-nexus/src";

// Only the 3 corrupted files. originalLibPath -> destination
const recover = [
  ["src/lib/studio-types.ts",   "entities/series/model/studio-types.ts"],
  ["src/lib/board-types.ts",    "entities/board/model/board-types.ts"],
  ["src/lib/proposal-types.ts", "entities/proposal/model/proposal-types.ts"],
];

function rewriteImports(content, srcRelDir) {
  return content.replace(/from\s+(["'])(\.\.?\/[^"']+)\1/g, (full, q, spec) => {
    const resolved = path.posix.normalize(path.posix.join(srcRelDir, spec));
    return `from ${q}@/${resolved}${q}`;
  });
}

for (const [libPath, dstRel] of recover) {
  // get original content from git HEAD
  const original = execSync('git -C E:/storyboard-nexus show HEAD:"' + libPath + '"', { encoding: "utf8" });
  const srcRelDir = "lib"; // these all live in src/lib
  const moved = rewriteImports(original, srcRelDir);
  const dstAbs = SRC + "/" + dstRel;
  fs.writeFileSync(dstAbs, moved, "utf8");
  console.log("RECOVERED " + dstRel + " (" + moved.split("\n").length + " lines)");

  // ensure the lib shim points to destination (not self/circular)
  const dstNoExt = dstRel.replace(/\.ts$/, "");
  const shim = `// Moved to @/${dstNoExt} (FDM migration Pass 09/14). Kept as re-export shim for backward compatibility.\nexport * from "@/${dstNoExt}";\n`;
  fs.writeFileSync(SRC + "/" + libPath.replace("src/", ""), shim, "utf8");
}
console.log("DONE");
