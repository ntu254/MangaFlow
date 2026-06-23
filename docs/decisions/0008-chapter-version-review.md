# 0008: Chapter Version Review Is Separate From Assistant Submission Review

## Status

Accepted

## Context

MangaFlow supports two chapter production branches after Board approval:

- Assistant-assisted production, where task-level `Submission` versions are
  reviewed by Mangaka and Editor.
- Direct final-page production, where Mangaka uploads completed pages and sends
  the whole chapter to Editor.

The direct branch needs chapter-level version history so Editor review can
request revision without overwriting earlier packages.

## Decision

Introduce `ChapterVersion` and `ChapterReviewAnnotation` as chapter-level review
entities. Keep Assistant `Submission` unchanged and scoped to task lifecycle.

An approved `ChapterVersion` is locked and stored as
`Chapter.publishingCandidateVersionId`. New `Publication` records store
`chapterVersionId` so publication source is the approved immutable package, not
mutable current chapter pages.

## Consequences

- Direct final-page chapters no longer depend on Assistant `Submission` records.
- Existing Assistant tasks, if any, must be `EDITOR_APPROVED` before Mangaka can
  submit a chapter version.
- Editor UI has a separate chapter review queue from task final review.
- Publication records can trace exactly which approved version was published.
