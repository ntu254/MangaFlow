import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { submissions, findTask, findChapter, findSeries, findStaff } from "@/entities";

export const Route = createFileRoute("/app/submissions")({
  component: () => (
    <div>
      <PageHeader
        title="Submissions"
        jp="提出物"
        description="Two-round approval: Mangaka first, Editor seals."
      />
      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Series / Chapter</span>
          <span>Task</span>
          <span>Assistant</span>
          <span>Mangaka</span>
          <span>Editor</span>
          <span>Submitted</span>
        </div>
        {submissions.map((sm) => {
          const t = findTask(sm.taskId)!;
          const ch = findChapter(t.chapterId)!;
          const s = findSeries(ch.seriesId)!;
          return (
            <div
              key={sm.id}
              className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] hover:bg-accent/40 last:border-b-0"
            >
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-[11px] text-foreground/55">{ch.number}</div>
              </div>
              <span>
                {t.type} · {t.pageRange}
              </span>
              <span className="text-foreground/70">{findStaff(t.assigneeId)?.name}</span>
              <Pill ok={sm.mangakaApproved} label={sm.mangakaApproved ? "Approved" : "Pending"} />
              <Pill ok={sm.editorApproved} label={sm.editorApproved ? "Approved" : "Pending"} />
              <span className="text-[11px] text-foreground/55">{sm.submittedAt}</span>
            </div>
          );
        })}
      </div>
    </div>
  ),
});

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${
        ok
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-foreground/5 text-foreground/55"
      }`}
    >
      {label}
    </span>
  );
}
