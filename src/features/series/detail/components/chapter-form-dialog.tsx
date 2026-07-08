import { useState } from "react";
import { toast } from "sonner";
import { useAuth, MANGAKAS, ASSISTANTS, findUserById } from "@/shared/auth";
import { useCreateChapterMutation, mapApiError } from "../../api/series-queries";
import { fromDateInputValue } from "@/shared/lib/format-date";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ChapterFormDialog({
  series,
  open,
  onClose,
  nextNumber,
}: {
  series: ProductionSeries;
  open: boolean;
  onClose: () => void;
  nextNumber: number;
}) {
  const user = useAuth((s) => s.user);
  const createChapterMutation = useCreateChapterMutation(series.id);
  const [number, setNumber] = useState(nextNumber);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(series.authorId);
  const [draftDue, setDraftDue] = useState("");
  const [reviewDue, setReviewDue] = useState("");

  const candidates = [
    findUserById(series.authorId),
    ...series.assistantIds.map((id) => findUserById(id)),
    ...MANGAKAS.filter((m) => m.id !== series.authorId),
    ...ASSISTANTS.filter((a) => !series.assistantIds.includes(a.id)),
  ].filter(Boolean);

  const submit = () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Cần nhập tiêu đề.");
      return;
    }
    const assignee = findUserById(assigneeId);
    if (!assignee) {
      toast.error("Chưa chọn assignee.");
      return;
    }

    createChapterMutation.mutate(
      {
        number,
        title: title.trim(),
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        draftDueAt: draftDue ? fromDateInputValue(draftDue) : undefined,
        reviewDueAt: reviewDue ? fromDateInputValue(reviewDue) : undefined,
        plannedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(`Đã tạo chapter ${number}.`);
          setTitle("");
          setNumber(number + 1);
          onClose();
        },
        onError: (err) => {
          toast.error(`Lỗi: ${mapApiError(err)}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo chapter mới — {series.title}</DialogTitle>
          <DialogDescription>
            Thiết lập chapter, người phụ trách và deadline ban đầu cho production workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ch-num">Chapter #</Label>
              <Input
                id="ch-num"
                type="number"
                value={number}
                min={1}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="ch-assignee">Assignee</Label>
              <select
                id="ch-assignee"
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
          </div>
          <div>
            <Label htmlFor="ch-title">Tiêu đề</Label>
            <Input
              id="ch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên chương…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ch-draft">Hạn draft</Label>
              <Input
                id="ch-draft"
                type="date"
                value={draftDue}
                onChange={(e) => setDraftDue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ch-review">Hạn review</Label>
              <Input
                id="ch-review"
                type="date"
                value={reviewDue}
                onChange={(e) => setReviewDue(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded border border-border px-3 py-1.5 text-xs">
            Huỷ
          </button>
          <button
            onClick={submit}
            className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            Tạo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
