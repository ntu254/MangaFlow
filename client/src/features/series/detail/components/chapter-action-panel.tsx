import { useState } from "react";
import { toast } from "sonner";
import { useAuth, findUserById, MANGAKAS, ASSISTANTS } from "@/shared/auth";
import { allowedChapterActions, checkChapterAction } from "../model/chapter-machine";
import {
  CHAPTER_ACTION_LABEL,
  type Chapter,
  type ChapterAction,
  type ProductionSeries,
} from "@/entities/series/model/series-types";
import { fromDateInputValue, toDateInputValue } from "@/shared/lib/format-date";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { useChapterActionMutation, mapApiError } from "../../api/series-queries";
import { DialogDescription } from "@radix-ui/react-dialog";

const TONES: Partial<Record<ChapterAction, string>> = {
  START_DRAFT: "bg-blue-700 text-white hover:bg-blue-800",
  SUBMIT_REVIEW: "bg-foreground text-background hover:bg-foreground/90",
  RESUBMIT: "bg-foreground text-background hover:bg-foreground/90",
  REQUEST_REVISION: "bg-amber-600 text-white hover:bg-amber-700",
  APPROVE: "bg-emerald-700 text-white hover:bg-emerald-800",
  SCHEDULE: "bg-indigo-700 text-white hover:bg-indigo-800",
  PUBLISH: "bg-rose-700 text-white hover:bg-rose-800",
  REASSIGN: "bg-card border border-border text-foreground hover:bg-muted",
};

export function ChapterActionPanel({
  chapter,
  series,
}: {
  chapter: Chapter;
  series: ProductionSeries;
}) {
  const user = useAuth((s) => s.user);
  const chapterActionMutation = useChapterActionMutation(chapter.id, series.id);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState(
    toDateInputValue(chapter.scheduledAt) || toDateInputValue(new Date().toISOString()),
  );
  const [assigneeId, setAssigneeId] = useState(chapter.assigneeId);

  if (!user) return null;
  const actions = allowedChapterActions(user, chapter, series);
  const selfApprovalBlocked = user.id === chapter.assigneeId;

  const run = async (a: ChapterAction) => {
    if (a === "REQUEST_REVISION") return setRevisionOpen(true);
    if (a === "SCHEDULE") return setScheduleOpen(true);
    if (a === "REASSIGN") return setReassignOpen(true);
    try {
      await chapterActionMutation.mutateAsync({ action: a });
      toast.success(`${CHAPTER_ACTION_LABEL[a]} thành công.`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const candidates = [...MANGAKAS, ...ASSISTANTS, findUserById(series.authorId)]
    .filter(Boolean)
    .filter((u, i, arr) => arr.findIndex((x) => x!.id === u!.id) === i);

  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Chapter actions
      </p>
      {actions.length === 0 ? (
        <p className="text-xs text-muted-foreground">Không có action khả dụng.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => {
            const c = checkChapterAction(a, user, chapter, series);
            const disabledBySeparation = a === "APPROVE" && selfApprovalBlocked;
            return (
              <button
                key={a}
                disabled={!c.ok || disabledBySeparation || chapterActionMutation.isPending}
                onClick={() => run(a)}
                title={
                  disabledBySeparation
                    ? "Bạn không thể duyệt submission do chính mình nộp."
                    : c.reason
                }
                className={`rounded px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${TONES[a] ?? "bg-card text-foreground border border-border hover:bg-muted"}`}
              >
                {chapterActionMutation.isPending ? "Đang xử lý..." : CHAPTER_ACTION_LABEL[a]}
              </button>
            );
          })}
        </div>
      )}
      {selfApprovalBlocked && actions.includes("APPROVE") ? (
        <div className="mt-3">
          <SeparationOfDutiesWarning reason="SELF_APPROVAL_BLOCKED" />
        </div>
      ) : null}

      <Dialog open={revisionOpen} onOpenChange={(v) => !v && setRevisionOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu chỉnh sửa chapter {chapter.number}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Dialog description</DialogDescription>
          <div className="space-y-2">
            <Label htmlFor="rev-note">Ghi chú revision (bắt buộc)</Label>
            <Textarea
              id="rev-note"
              rows={5}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Ghi rõ điểm cần chỉnh…"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setRevisionOpen(false)}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Huỷ
            </button>
            <button
              disabled={chapterActionMutation.isPending}
              onClick={async () => {
                if (reviewNote.trim().length < 8) {
                  toast.error("Ghi chú quá ngắn.");
                  return;
                }
                try {
                  await chapterActionMutation.mutateAsync({
                    action: "REQUEST_REVISION",
                    payload: { reviewNote: reviewNote.trim() },
                  });
                  toast.success("Đã yêu cầu chỉnh sửa.");
                  setRevisionOpen(false);
                  setReviewNote("");
                } catch (e) {
                  toast.error(mapApiError(e));
                }
              }}
              className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-55"
            >
              {chapterActionMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={(v) => !v && setScheduleOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule chapter {chapter.number}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Dialog description</DialogDescription>
          <div className="space-y-2">
            <Label htmlFor="sched">Ngày publish</Label>
            <Input
              id="sched"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setScheduleOpen(false)}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Huỷ
            </button>
            <button
              disabled={chapterActionMutation.isPending}
              onClick={async () => {
                try {
                  await chapterActionMutation.mutateAsync({
                    action: "SCHEDULE",
                    payload: { scheduledAt: fromDateInputValue(scheduledAt) },
                  });
                  toast.success("Đã schedule.");
                  setScheduleOpen(false);
                } catch (e) {
                  toast.error(mapApiError(e));
                }
              }}
              className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-55"
            >
              {chapterActionMutation.isPending ? "Đang xử lý..." : "Schedule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reassignOpen} onOpenChange={(v) => !v && setReassignOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi assignee — chapter {chapter.number}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Dialog description</DialogDescription>
          <div className="space-y-2">
            <Label htmlFor="re-as">Assignee mới</Label>
            <select
              id="re-as"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {candidates.map((u) => (
                <option key={u!.id} value={u!.id}>
                  {u!.name} ({u!.role})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <button
              onClick={() => setReassignOpen(false)}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Huỷ
            </button>
            <button
              disabled={chapterActionMutation.isPending}
              onClick={async () => {
                const next = findUserById(assigneeId);
                if (!next) return;
                try {
                  await chapterActionMutation.mutateAsync({
                    action: "REASSIGN",
                    payload: { newAssigneeId: next.id, newAssigneeName: next.name },
                  });
                  toast.success("Đã đổi assignee.");
                  setReassignOpen(false);
                } catch (e) {
                  toast.error(mapApiError(e));
                }
              }}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-55"
            >
              {chapterActionMutation.isPending ? "Đang lưu..." : "Lưu"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
