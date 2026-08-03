export function pageReviewVersion(page: any) {
  return String(
    page?.version ??
      page?.pageVersionId ??
      page?.fileKey ??
      page?.fileUrl ??
      page?.imageUrl ??
      page?.uploadedAt ??
      "unversioned",
  );
}

export function chapterReviewVersion(chapter: any) {
  if (chapter?.version != null) return String(chapter.version);
  const pages = Array.isArray(chapter?.pages) ? chapter.pages : [];
  return `chapter:${chapter?.id ?? ""}:${pages
    .map((page: any) => `${page?.id ?? ""}:${pageReviewVersion(page)}`)
    .join("|")}`;
}

export function pageHasUploadedAsset(page: any) {
  const hasDurableFile = typeof page.fileKey === "string" && page.fileKey.trim().length > 0;
  const fallback = String(page.fileUrl ?? page.imageUrl ?? "");
  const hasLegacyFile =
    fallback.length > 0 &&
    !fallback.startsWith("metadata://signed-url-not-issued") &&
    !fallback.includes("placeholder-page");
  return (
    (hasDurableFile || hasLegacyFile) &&
    page.status !== "PENDING_UPLOAD" &&
    page.status !== "REVISION_REQUIRED"
  );
}

export function chapterReadiness(
  chapter: any,
  comments: any[] = [],
  tasks: any[] = [],
  submissions: any[] = [],
  materials: any[] = [],
) {
  const requiresTantouVerification = [
    "TANTOU_REVIEW",
    "READY_FOR_PUBLICATION",
    "PUBLISHED",
  ].includes(String(chapter.status));
  const items = [
    {
      key: "reviewMaterialActive",
      passed: materials.every((material: any) =>
        ["ACTIVE", "APPROVED"].includes(String(material.status)),
      ),
      reason: "Review materials must be ACTIVE or APPROVED before sending to editor review.",
    },
    {
      key: "allPagesUploaded",
      passed:
        Array.isArray(chapter.pages) &&
        chapter.pages.length > 0 &&
        chapter.pages.every(pageHasUploadedAsset),
      reason: "Every chapter page needs a valid uploaded image.",
    },
    {
      key: "allTasksApproved",
      passed: tasks
        .filter((task) => task.isRequired !== false)
        // CANCELLED and REJECTED tasks are terminal dead-ends (a rejected task
        // cannot be reopened; the region is freed for a replacement task), so
        // they must not block the chapter.
        .every((task) => ["MANGAKA_APPROVED", "CANCELLED", "REJECTED"].includes(task.status)),
      reason: "Every required assistant task must be approved by Mangaka.",
    },
    {
      key: "allSubmissionsApproved",
      passed: tasks
        .filter(
          (task) =>
            task.isRequired !== false &&
            task.status !== "CANCELLED" &&
            task.status !== "REJECTED",
        )
        .every((task) =>
          submissions.some(
            (submission) =>
              submission.id === task.currentSubmissionId &&
              submission.taskId === task.id &&
              submission.status === "MANGAKA_APPROVED",
          ),
        ),
      reason: "Every required assistant task must have a current Mangaka-approved submission.",
    },
    {
      key: "allCommentsResolved",
      passed: comments.every(
        (comment) =>
          !comment.isBlocking ||
          comment.status === "RESOLVED" ||
          (!requiresTantouVerification && comment.status === "ADDRESSED"),
      ),
      reason: requiresTantouVerification
        ? "Every blocking comment must be verified as RESOLVED by the assigned Tantou."
        : "Every blocking comment must be ADDRESSED before resubmission.",
    },
    {
      key: "reviewSnapshotExists",
      passed:
        Boolean(chapter.reviewSnapshot) ||
        !["TANTOU_REVIEW", "READY_FOR_PUBLICATION", "PUBLISHED"].includes(chapter.status),
      reason: "Chapter/Page snapshot must be frozen before Tantou review.",
    },
  ];
  return {
    chapterId: chapter.id,
    chapterStatus: chapter.status,
    ready: items.every((item) => item.passed),
    items,
  };
}
