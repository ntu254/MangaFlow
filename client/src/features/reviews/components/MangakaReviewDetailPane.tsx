import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

import { taskApi } from "@/features/chapters/services/task.api"
import { submissionApi } from "@/features/reviews/services/submission.api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMangakaApprove, useMangakaRequestRevision, useMangakaReject } from "@/features/reviews/hooks/useMangakaReview"

import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Badge } from "@/shared/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"

export function MangakaReviewDetailPane({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const [reviewNote, setReviewNote] = useState("")
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  const approveMutation = useMangakaApprove()
  const revisionMutation = useMangakaRequestRevision()
  const rejectMutation = useMangakaReject()

  const { data: taskData, isLoading: isTaskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId),
    enabled: !!taskId,
  })

  const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ["task-submissions", taskId],
    queryFn: () => submissionApi.listByTask(taskId),
    enabled: !!taskId,
  })

  const task = taskData?.data?.data
  const submissions = submissionsData?.data?.data || []
  const currentSubmission = submissions.find((s: any) => s.id === task?.currentSubmissionId) || submissions[0]

  const isBusy = approveMutation.isPending || revisionMutation.isPending || rejectMutation.isPending
  const isLoading = isTaskLoading || isSubmissionsLoading

  const handleApprove = async () => {
    if (!currentSubmission) return
    try {
      await approveMutation.mutateAsync({ submissionId: currentSubmission.id, reviewerNote: reviewNote })
      toast.success("Task approved successfully")
      queryClient.invalidateQueries({ queryKey: ['mangaka-review-queue'] })
      setReviewNote("")
    } catch {
      toast.error("Failed to approve task")
    }
  }

  const handleRequestRevision = async () => {
    if (!currentSubmission) return
    if (!reviewNote.trim()) {
      toast.error("Feedback note is required to request a revision")
      return
    }
    try {
      await revisionMutation.mutateAsync({ submissionId: currentSubmission.id, reviewerNote: reviewNote })
      toast.success("Revision requested successfully")
      setIsRevisionDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mangaka-review-queue'] })
      setReviewNote("")
    } catch {
      toast.error("Failed to request revision")
    }
  }

  const handleReject = async () => {
    if (!currentSubmission) return
    if (!reviewNote.trim()) {
      toast.error("Rejection reason is required")
      return
    }
    try {
      await rejectMutation.mutateAsync({ submissionId: currentSubmission.id, reviewerNote: reviewNote })
      toast.success("Task rejected")
      setIsRejectDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mangaka-review-queue'] })
      setReviewNote("")
    } catch {
      toast.error("Failed to reject task")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!task || !currentSubmission) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <AlertCircle className="mb-4 h-8 w-8 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-slate-900">Submission not found</h2>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-none border-b border-border bg-slate-50/50 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Task Assignment • Version {currentSubmission.version}
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            {task.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <h3 className="mb-2 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Original Instructions</h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-700 leading-relaxed">
            {task.description || "No description provided."}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Submission Result</h3>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-[14px] text-slate-700 min-h-[120px]">
              {currentSubmission.resultText || "No text result."}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Attached File</h3>
            {currentSubmission.fileAssetId ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center h-[120px]">
                <span className="text-[14px] font-bold text-slate-700">File attached</span>
                <span className="text-[12px] text-slate-500 mt-1">Preview not available in MVP</span>
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-[14px] text-slate-500">
                No file attached
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Your Review Note (Optional for Approve)</h3>
          <Textarea
            placeholder="Great job! / Please fix the shading here..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="min-h-[120px] resize-none rounded-xl border-slate-200 bg-white focus-visible:ring-violet-500 text-[14px]"
          />
        </div>
      </div>

      <div className="flex-none border-t border-border bg-white px-6 py-4 flex items-center justify-between">
        <Button
          variant="destructive"
          onClick={() => setIsRejectDialogOpen(true)}
          disabled={isBusy || task.status !== "SUBMITTED"}
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 h-10 px-5 rounded-lg font-bold"
        >
          <XCircle className="mr-2 h-[18px] w-[18px]" />
          Reject Task
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsRevisionDialogOpen(true)}
            disabled={isBusy || task.status !== "SUBMITTED"}
            className="h-10 px-5 rounded-lg font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <AlertCircle className="mr-2 h-[18px] w-[18px]" />
            Request Revision
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isBusy || task.status !== "SUBMITTED"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 rounded-lg font-bold shadow-sm"
          >
            <CheckCircle2 className="mr-2 h-[18px] w-[18px]" />
            Approve Submission
          </Button>
        </div>
      </div>

      <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              This will send the task back to the assistant. You must provide clear feedback on what needs to be changed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsRevisionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestRevision} disabled={isBusy || !reviewNote.trim()} className="bg-violet-600 text-white hover:bg-violet-700">Confirm Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2"><AlertCircle size={20} /> Reject Task</DialogTitle>
            <DialogDescription className="pt-3">
              Are you sure you want to reject this task? This means the assistant will not be paid and the work is discarded.
              A reason must be provided.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isBusy || !reviewNote.trim()}>Reject Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
