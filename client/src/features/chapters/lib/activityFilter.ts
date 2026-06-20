import type { Chapter, Task, Submission, Page } from "@/entities";
import { findStaff } from "@/entities";

export type ActivityEvent = {
  id: string;
  at: string;
  label: string;
  actor?: string;
  kind:
    | "page-uploaded"
    | "task-created"
    | "submission-submitted"
    | "submission-mangaka-approved"
    | "submission-editor-approved"
    | "submission-rejected"
    | "chapter-published";
};

// Derive a user-safe production timeline (NOT raw audit log).
export function buildActivity(
  chapter: Chapter,
  pages: Page[],
  tasks: Task[],
  subs: Submission[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  pages.slice(0, 3).forEach((p) =>
    events.push({
      id: `pg-${p.id}`,
      at: "—",
      kind: "page-uploaded",
      label: `Page ${p.order} uploaded`,
    }),
  );
  tasks.forEach((t) =>
    events.push({
      id: `tc-${t.id}`,
      at: t.deadline,
      kind: "task-created",
      label: `Task created · ${t.type} · ${t.pageRange}`,
      actor: findStaff(t.assigneeId)?.name,
    }),
  );
  subs.forEach((s) => {
    events.push({
      id: `ss-${s.id}`,
      at: s.submittedAt,
      kind: "submission-submitted",
      label: "Submission received",
    });
    if (s.mangakaApproved)
      events.push({
        id: `sm-${s.id}`,
        at: s.submittedAt,
        kind: "submission-mangaka-approved",
        label: "Mangaka approved submission",
      });
    if (s.editorApproved)
      events.push({
        id: `se-${s.id}`,
        at: s.submittedAt,
        kind: "submission-editor-approved",
        label: "Editor approved submission",
      });
    if (s.rejected)
      events.push({
        id: `sr-${s.id}`,
        at: s.submittedAt,
        kind: "submission-rejected",
        label: "Submission rejected",
      });
  });
  if (chapter.publishedAt)
    events.push({
      id: "pub",
      at: chapter.publishedAt,
      kind: "chapter-published",
      label: "Chapter published",
    });
  return events;
}
