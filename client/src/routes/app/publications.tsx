import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { Loader2, CalendarDays, Globe, XCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import {
  usePublications,
  useCancelPublication,
  usePublishNow,
  useSchedulePublication,
} from "@/shared/queries/usePublications";
import type { Publication, PublicationChapter } from "@/shared/api/publications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";

export const Route = createFileRoute("/app/publications")({
  component: PublicationsPage,
});

function getChapterInfo(chapterId: string | PublicationChapter) {
  if (typeof chapterId === "object" && chapterId !== null) {
    return { number: chapterId.chapterNumber, title: chapterId.title };
  }
  return { number: "—", title: "Chapter" };
}

function PublicationsPage() {
  const { data: publications = [], isLoading } = usePublications();
  const cancelMutation = useCancelPublication();
  const publishMutation = usePublishNow();
  const scheduleMutation = useSchedulePublication();

  const [publishDialog, setPublishDialog] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const handlePublish = () => {
    if (!publishDialog) return;
    publishMutation.mutate(publishDialog, { onSuccess: () => setPublishDialog(null) });
  };

  const handleCancel = () => {
    if (!cancelDialog) return;
    cancelMutation.mutate(cancelDialog, { onSuccess: () => setCancelDialog(null) });
  };

  const handleReschedule = () => {
    if (!rescheduleDialog || !rescheduleDate) return;
    scheduleMutation.mutate(
      { publicationId: rescheduleDialog, scheduledFor: new Date(rescheduleDate).toISOString() },
      { onSuccess: () => { setRescheduleDialog(null); setRescheduleDate(""); } },
    );
  };

  return (
    <div>
      <PageHeader
        title="Publications"
        jp="刊行スケジュール"
        description="Schedule, unschedule, mark production-ready or publish now."
      />

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Series / Chapter</span>
          <span>Chapter info</span>
          <span>Scheduled</span>
          <span>State</span>
          <span />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-foreground/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading publications…
          </div>
        )}

        {!isLoading && publications.length === 0 && (
          <EmptyState
            title="No publications yet"
            hint="Create a publication once a chapter is READY_FOR_PUBLICATION."
            icon={BookOpen}
          />
        )}

        {publications.map((pub: Publication) => {
          const chap = getChapterInfo(pub.chapterId);
          const isPublished = pub.status === "PUBLISHED";
          const isCancelled = pub.status === "CANCELLED";
          const scheduledLabel = pub.scheduledFor
            ? new Date(pub.scheduledFor).toLocaleString()
            : "—";

          return (
            <div
              key={pub.id}
              className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-medium">
                Ch. {chap.number} — {chap.title}
              </span>
              <span className="text-foreground/60 text-xs">{pub.seriesId}</span>
              <span className="text-foreground/70 text-sm">{scheduledLabel}</span>
              <StatusBadge status={pub.status} />
              <div className="flex gap-2">
                {!isPublished && !isCancelled && (
                  <>
                    <button
                      onClick={() => setRescheduleDialog(pub.id)}
                      className="inline-flex items-center gap-1 rounded border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5"
                    >
                      <CalendarDays className="h-3 w-3" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => setPublishDialog(pub.id)}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Globe className="h-3 w-3" />
                      Publish
                    </button>
                    <button
                      onClick={() => setCancelDialog(pub.id)}
                      className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/5"
                    >
                      <XCircle className="h-3 w-3" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Publish Confirm Dialog */}
      <AlertDialog open={!!publishDialog} onOpenChange={(o) => !o && setPublishDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Chapter Now</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately publish the chapter and make it visible to readers. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Confirm Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirm Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={(o) => !o && setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this publication schedule? The chapter will remain
              READY_FOR_PUBLICATION and can be rescheduled later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Cancel publication
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleDialog}
        onOpenChange={(o) => { if (!o) { setRescheduleDialog(null); setRescheduleDate(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Publication</DialogTitle>
            <DialogDescription>
              Choose a new scheduled date and time for this publication.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
              New scheduled date
            </label>
            <input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-foreground/30 outline-none"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => { setRescheduleDialog(null); setRescheduleDate(""); }}
              className="h-9 rounded-md border border-foreground/15 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={!rescheduleDate || scheduleMutation.isPending}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
              ) : null}
              Save schedule
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

