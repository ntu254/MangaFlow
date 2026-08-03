import { describe, expect, it } from "vitest";
import {
  chapterReadiness,
  chapterReviewVersion,
  pageHasUploadedAsset,
} from "../services/chapter-readiness.service.js";

describe("Chapter readiness bounded context", () => {
  it("does not expose or enforce a Supporting Material readiness check", () => {
    const result = chapterReadiness(
      {
        id: "chapter-material-independent",
        status: "IN_PRODUCTION",
        pages: [{ id: "page-1", fileKey: "r2/page.png", status: "UPLOADED" }],
      },
      [],
      [],
      [],
    );

    expect(result.items.map((item) => item.key)).not.toContain("reviewMaterialActive");
    expect(result.ready).toBe(true);
  });

  it("recognizes durable and legacy uploaded page assets", () => {
    expect(pageHasUploadedAsset({ fileKey: "r2/chapter/page.png", status: "UPLOADED" })).toBe(true);
    expect(
      pageHasUploadedAsset({ imageUrl: "https://cdn.test/page.png", status: "UPLOADED" }),
    ).toBe(true);
    expect(pageHasUploadedAsset({ fileKey: "", status: "PENDING_UPLOAD" })).toBe(false);
  });

  it("uses StudioComment input and does not infer blockers from reviewNotes", () => {
    const result = chapterReadiness(
      {
        id: "chapter-ready",
        status: "IN_PRODUCTION",
        reviewNotes: [{ resolved: false, text: "Legacy note" }],
        pages: [{ id: "page-1", fileKey: "r2/page.png", status: "UPLOADED" }],
      },
      [],
      [],
      [],
    );

    expect(result.ready).toBe(true);
    expect(result.items.find((item) => item.key === "allCommentsResolved")?.passed).toBe(true);
  });

  it("blocks only unresolved blocking comments and validates the review snapshot", () => {
    const chapter = {
      id: "chapter-blocked",
      status: "TANTOU_REVIEW",
      reviewSnapshot: { chapterVersionId: "chapter:chapter-blocked:page-1:v1" },
      pages: [{ id: "page-1", fileKey: "r2/page.png", status: "UPLOADED" }],
    };
    const result = chapterReadiness(
      chapter,
      [{ id: "comment-1", isBlocking: true, status: "OPEN" }],
      [],
      [],
    );

    expect(result.ready).toBe(false);
    expect(result.items.find((item) => item.key === "allCommentsResolved")?.passed).toBe(false);
    expect(result.items.find((item) => item.key === "reviewSnapshotExists")?.passed).toBe(true);
    expect(chapterReviewVersion(chapter)).toContain("chapter-blocked");
  });

  it("does not let a terminal REJECTED task block the chapter once its replacement is approved", () => {
    const result = chapterReadiness(
      {
        id: "chapter-rejected-leftover",
        status: "IN_PRODUCTION",
        pages: [{ id: "page-1", fileKey: "r2/page.png", status: "UPLOADED" }],
      },
      [],
      [
        // Old submission got rejected; task is a terminal dead-end (cannot reopen).
        { id: "task-rejected", isRequired: true, status: "REJECTED", currentSubmissionId: "sub-r" },
        // Replacement task on the same region was redone and approved.
        { id: "task-ok", isRequired: true, status: "MANGAKA_APPROVED", currentSubmissionId: "sub-ok" },
      ],
      [
        { id: "sub-r", taskId: "task-rejected", status: "REJECTED" },
        { id: "sub-ok", taskId: "task-ok", status: "MANGAKA_APPROVED" },
      ],
    );

    expect(result.items.find((item) => item.key === "allTasksApproved")?.passed).toBe(true);
    expect(result.items.find((item) => item.key === "allSubmissionsApproved")?.passed).toBe(true);
    expect(result.ready).toBe(true);
  });

  it("keeps an ADDRESSED blocking comment pending until Tantou verification", () => {
    const result = chapterReadiness(
      {
        id: "chapter-addressed",
        status: "TANTOU_REVIEW",
        reviewSnapshot: { chapterVersionId: "v1" },
        pages: [{ id: "page-1", fileKey: "r2/page.png", status: "UPLOADED" }],
      },
      [{ id: "comment-addressed", isBlocking: true, status: "ADDRESSED" }],
      [],
      [],
    );

    expect(result.ready).toBe(false);
    expect(result.items.find((item) => item.key === "allCommentsResolved")?.passed).toBe(false);
  });
});
