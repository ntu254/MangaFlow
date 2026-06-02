import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { storageService } from "./storage.service.js";

const testRoot = "mf-008-storage-test";
const uploadRoot = path.join(process.cwd(), "uploads", testRoot);

afterEach(() => {
  fs.rmSync(uploadRoot, { recursive: true, force: true });
});

describe("storage service local fallback", () => {
  it("writes, signs, copies, checks, and deletes local fallback files", async () => {
    const sourceKey = `${testRoot}/source.txt`;
    const copyKey = `${testRoot}/copy.txt`;

    const url = await storageService.uploadFile(sourceKey, Buffer.from("mangaflow"), "text/plain");

    expect(url).toBe(`http://localhost:5000/uploads/${sourceKey}`);
    expect(fs.readFileSync(path.join(process.cwd(), "uploads", sourceKey), "utf8")).toBe("mangaflow");
    await expect(storageService.getSignedUrl(url)).resolves.toBe(url);
    await expect(storageService.fileExists(url)).resolves.toBe(true);

    await storageService.copyFile(url, copyKey);
    expect(fs.readFileSync(path.join(process.cwd(), "uploads", copyKey), "utf8")).toBe("mangaflow");

    await storageService.deleteFile(url);
    await storageService.deleteFile(copyKey);

    expect(fs.existsSync(path.join(process.cwd(), "uploads", sourceKey))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "uploads", copyKey))).toBe(false);
  });
});
