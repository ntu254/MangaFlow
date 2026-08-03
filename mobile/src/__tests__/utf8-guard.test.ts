import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

const guardPath = resolve(__dirname, "../../scripts/check-utf8.mjs");

function runGuard(directory: string) {
  return spawnSync(process.execPath, [guardPath, directory], {
    encoding: "utf8",
  });
}

describe("UTF-8 source guard", () => {
  let fixtureDirectory: string;

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), "mangaflow-utf8-"));
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  it("accepts valid Vietnamese source text", () => {
    writeFileSync(
      join(fixtureDirectory, "valid.ts"),
      'const title = "T\u00f4i l\u00e0 series";',
      "utf8",
    );

    const result = runGuard(fixtureDirectory);

    expect(result.status).toBe(0);
  });

  it("reports mojibake source text", () => {
    writeFileSync(
      join(fixtureDirectory, "broken.ts"),
      Buffer.from('const title = "\u00c3\u00b4";', "utf8"),
    );

    const result = runGuard(fixtureDirectory);
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain("broken.ts");
    expect(output).toContain("mojibake");
  });
});
