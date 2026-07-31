import { afterEach, describe, expect, it } from "vitest";
import { createDisplayUrl, createLocalUploadUrl } from "../services/file-access.service.js";

describe("file access URLs", () => {
  afterEach(() => {
    delete process.env.PUBLIC_API_BASE_URL;
  });

  it("returns absolute API URLs for display and local upload routes", () => {
    process.env.PUBLIC_API_BASE_URL = "http://localhost:3001";

    const displayUrl = createDisplayUrl("covers/demo.jpg", "demo.jpg");
    const uploadUrl = createLocalUploadUrl("covers/demo.jpg", "image/jpeg", "demo.jpg");

    expect(displayUrl.url).toContain("http://localhost:3001/api/files/display/");
    expect(uploadUrl).toContain("http://localhost:3001/api/files/local-upload/");
  });
});
