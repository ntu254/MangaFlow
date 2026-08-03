import { readFileSync, readdirSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const scanRoot = process.argv[2] ?? projectRoot;
const supportedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md"]);
const ignoredDirectoryNames = new Set(["node_modules", "dist", ".expo"]);
const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];
let scannedFiles = 0;

function scanDirectory(directory) {
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const file = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        scanDirectory(file);
      }
      continue;
    }

    if (!entry.isFile() || !supportedExtensions.has(extname(entry.name))) {
      continue;
    }

    scannedFiles += 1;
    const displayPath = relative(scanRoot, file);
    let text;

    try {
      text = decoder.decode(readFileSync(file));
    } catch {
      failures.push(`${displayPath}: invalid UTF-8`);
      continue;
    }

    if (/[\u00C3\u0192\u201A][\u0080-\u00BF]|\uFFFD/.test(text)) {
      failures.push(`${displayPath}: mojibake`);
    }
  }
}

scanDirectory(scanRoot);

if (failures.length > 0) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  console.log(`UTF-8 check passed: scanned ${scannedFiles} files.`);
}
