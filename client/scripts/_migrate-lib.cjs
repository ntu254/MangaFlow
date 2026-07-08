const fs = require("fs");
const path = require("path");
const SRC = "E:/storyboard-nexus/src";

// source (relative to src) -> destination (relative to src)
const moves = [
  // pure domain types -> entities
  ["lib/studio-types.ts",              "entities/series/model/studio-types.ts"],
  ["lib/board-types.ts",               "entities/board/model/board-types.ts"],
  ["lib/proposal-types.ts",            "entities/proposal/model/proposal-types.ts"],
  ["lib/series-types.ts",              "entities/series/model/series-types.ts"],
  ["lib/voting-types.ts",              "entities/board/model/voting-types.ts"],
  ["lib/assistant-types.ts",           "entities/task/model/assistant-types.ts"],
  ["lib/chapter-pages.ts",             "entities/chapter/model/chapter-pages.ts"],
  ["lib/materials/map-material.ts",    "entities/proposal/model/map-material.ts"],
  // feature-specific machines / access / adapters / helpers -> features
  ["lib/board-adapters.ts",            "features/board/model/board-adapters.ts"],
  ["lib/proposal-machine.ts",          "features/proposals/model/proposal-machine.ts"],
  ["lib/editor-access.ts",             "features/editor/model/editor-access.ts"],
  ["lib/assistant-access.ts",          "features/assistant/model/assistant-access.ts"],
  ["lib/board-access.ts",              "features/board/model/board-access.ts"],
  ["lib/studio-permissions.ts",        "features/series/detail/model/studio-permissions.ts"],
  ["lib/series-production-helpers.ts", "features/series/detail/model/series-production-helpers.ts"],
  ["lib/chapter-machine.ts",           "features/series/detail/model/chapter-machine.ts"],
  ["lib/voting-machine.ts",            "features/board/sessions/model/voting-machine.ts"],
  ["lib/workflow/at-risk-decision-utils.ts", "features/board/at-risk/model/at-risk-decision-utils.ts"],
  ["lib/workflow/ranking-source-utils.ts",   "features/board/rankings/model/ranking-source-utils.ts"],
];

// Rewrite relative imports in a lib file to absolute @/lib/... paths so they
// chain through the shims that remain in src/lib after migration.
function rewriteImports(content, srcRelDir) {
  return content.replace(/from\s+(["'])(\.\.?\/[^"']+)\1/g, (full, q, spec) => {
    // resolve spec relative to the source file's directory (relative to src)
    const resolved = path.posix.normalize(path.posix.join(srcRelDir, spec));
    return `from ${q}@/${resolved}${q}`;
  });
}

for (const [srcRel, dstRel] of moves) {
  const srcAbs = SRC + "/" + srcRel;
  const dstAbs = SRC + "/" + dstRel;
  if (!fs.existsSync(srcAbs)) { console.log("SKIP missing " + srcRel); continue; }

  const original = fs.readFileSync(srcAbs, "utf8");
  const srcRelDir = path.posix.dirname(srcRel); // e.g. "lib" or "lib/workflow"
  const moved = rewriteImports(original, srcRelDir);

  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  fs.writeFileSync(dstAbs, moved, "utf8");

  // shim: re-export everything from new location
  const dstNoExt = dstRel.replace(/\.ts$/, "");
  const shim = `// Moved to @/${dstNoExt} (FDM migration Pass 09/14). Kept as re-export shim for backward compatibility.\nexport * from "@/${dstNoExt}";\n`;
  fs.writeFileSync(srcAbs, shim, "utf8");

  console.log("MOVED " + srcRel + " -> " + dstRel);
}
console.log("DONE");
