import { describe, expect, it } from "vitest";
import { selectPageAssetId } from "./page-image";

describe("selectPageAssetId", () => {
  it("uses thumbnail priority for list views", () => {
    expect(
      selectPageAssetId({
        thumbnailFileAssetId: "thumb",
        workingFileAssetId: "working",
        originalFileAssetId: "original",
      }),
    ).toBe("thumb");
  });

  it("falls back to working and original thumbnails", () => {
    expect(selectPageAssetId({ workingFileAssetId: "working", originalFileAssetId: "original" })).toBe(
      "working",
    );
    expect(selectPageAssetId({ originalFileAssetId: "original" })).toBe("original");
  });

  it("uses working priority for preview views", () => {
    expect(
      selectPageAssetId(
        {
          thumbnailFileAssetId: "thumb",
          workingFileAssetId: "working",
          originalFileAssetId: "original",
        },
        "preview",
      ),
    ).toBe("working");
  });

  it("uses exact submitted assets for comparison", () => {
    expect(selectPageAssetId({ submittedFileAssetId: "submitted", workingFileAssetId: "working" }, "submitted")).toBe(
      "submitted",
    );
  });

  it("accepts populated file asset objects", () => {
    expect(
      selectPageAssetId({
        thumbnailFileAssetId: { _id: "thumb-object" },
        workingFileAssetId: { id: "working-object" },
      }),
    ).toBe("thumb-object");
  });
});
