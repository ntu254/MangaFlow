import { describe, expect, it } from "vitest";
import { qk } from "./keys";

describe("qk", () => {
  it("creates stable domain keys", () => {
    expect(qk.series.list()).toEqual(["series"]);
    expect(qk.series.summary("series-1")).toEqual(["series", "series-1", "summary"]);
    expect(qk.chapters.pages("chapter-1")).toEqual(["chapter-pages", "chapter-1"]);
    expect(qk.pages.studio("page-1")).toEqual(["page", "page-1", "studio"]);
    expect(qk.tasks.bySeries("series-1")).toEqual(["tasks", "series", "series-1"]);
    expect(qk.submissions.reviewQueue()).toEqual(["submissions", "review-queue", "all"]);
    expect(qk.files.downloadUrl("asset-1")).toEqual(["file-download-url", "asset-1"]);
  });
});
