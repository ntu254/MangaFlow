import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
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
  const [draftDue, setDraftDue] = useState("");
  const [reviewDue, setReviewDue] = useState("");

  const submit = () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    createChapterMutation.mutate(
      {
        number,
        title: title.trim(),
        // Chapter ownership stays with the Mangaka. Assistant assignment is
        // created separately per page/region in Studio.
        assigneeId: series.authorId,
        assigneeName: series.authorName,
        draftDueAt: draftDue ? fromDateInputValue(draftDue) : undefined,
        reviewDueAt: reviewDue ? fromDateInputValue(reviewDue) : undefined,
        plannedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(`Chapter ${number} created.`);
          setTitle("");
          setNumber(number + 1);
          onClose();
        },
        onError: (err) => {
          toast.error(`Error: ${mapApiError(err)}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new chapter — {series.title}</DialogTitle>
          <DialogDescription>
            Set up the chapter and initial production deadlines. Assign assistants later from Studio
            tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
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
            <Label htmlFor="ch-title">Title</Label>
            <Input
              id="ch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ch-draft">Draft deadline</Label>
              <Input
                id="ch-draft"
                type="date"
                value={draftDue}
                onChange={(e) => setDraftDue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ch-review">Review deadline</Label>
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
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            Create
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
