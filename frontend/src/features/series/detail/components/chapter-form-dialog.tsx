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

function addCalendarDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayDateInputValue(): string {
  const date = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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
  const [targetPages, setTargetPages] = useState(20);
  const [draftDue, setDraftDue] = useState("");
  const [reviewDue, setReviewDue] = useState("");

  const todayStr = todayDateInputValue();
  const reviewMin = draftDue ? addCalendarDays(draftDue, 1) : todayStr;

  const submit = () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (draftDue && draftDue < todayStr) {
      toast.error("Draft deadline cannot be set in the past.");
      return;
    }
    if (reviewDue && reviewDue < todayStr) {
      toast.error("Review deadline cannot be set in the past.");
      return;
    }
    if (draftDue && reviewDue && reviewDue < reviewMin) {
      toast.error("Allow Tantou at least one full day after the draft is ready.");
      return;
    }
    createChapterMutation.mutate(
      {
        number,
        title: title.trim(),
        targetPages: targetPages || 20,
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
          toast.success(`Chapter ${number} created (${targetPages || 20} planned pages).`);
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
            Set up the chapter and estimated page count. Assign assistants later from Studio tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
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
              <Label htmlFor="ch-pages">Target Pages</Label>
              <Input
                id="ch-pages"
                type="number"
                value={targetPages}
                min={1}
                max={200}
                onChange={(e) => setTargetPages(parseInt(e.target.value, 10) || 20)}
                placeholder="20"
              />
            </div>
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
              <Label htmlFor="ch-draft">Draft ready for Tantou</Label>
              <Input
                id="ch-draft"
                type="date"
                value={draftDue}
                min={todayStr}
                onChange={(e) => {
                  const nextDraftDue = e.target.value;
                  setDraftDue(nextDraftDue);
                  if (nextDraftDue && (!reviewDue || reviewDue < addCalendarDays(nextDraftDue, 1))) {
                    setReviewDue(addCalendarDays(nextDraftDue, 2));
                  }
                }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">When your draft is ready to hand off.</p>
            </div>
            <div>
              <Label htmlFor="ch-review">Tantou review complete</Label>
              <Input
                id="ch-review"
                type="date"
                value={reviewDue}
                min={reviewMin}
                onChange={(e) => setReviewDue(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">At least one day after draft delivery.</p>
            </div>
          </div>
          {!draftDue && !reviewDue ? (
            <p className="text-xs text-muted-foreground">
              Optional for now — add dates when you are ready to plan the handoff.
            </p>
          ) : null}
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
