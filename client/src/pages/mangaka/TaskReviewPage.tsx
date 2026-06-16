import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

import { taskApi } from "@/api/task"
import { submissionApi } from "@/api/submission"
import { useQuery } from "@tanstack/react-query"
import { useMangakaApprove, useMangakaRequestRevision, useMangakaReject } from "@/hooks/useMangakaReview"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function MangakaTaskReviewPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  
  const [reviewNote, setReviewNote] = useState("")
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  const approveMutation = useMangakaApprove()
  const revisionMutation = useMangakaRequestRevision()
  const rejectMutation = useMangakaReject()

  const { data: taskData, isLoading: isTaskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId!),
    enabled: !!taskId,
  })

  const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ["task-submissions", taskId],
    queryFn: () => submissionApi.listByTask(taskId!),
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
      navigate("/app/mangaka/reviews")
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
      navigate("/app/mangaka/reviews")
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
      navigate("/app/mangaka/reviews")
    } catch {
      toast.error("Failed to reject task")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!task || !currentSubmission) {
    return (
      <div className="container py-10">
        <Button variant="ghost" onClick={() => navigate("/app/mangaka/reviews")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Queue
        </Button>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Task or Submission not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" onClick={() => navigate("/app/mangaka/reviews")} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Queue
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  Task Assignment • Version {currentSubmission.version}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                {task.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Original Instructions</h3>
              <div className="rounded-md bg-muted p-4 text-sm">
                {task.description || "No description provided."}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Submission Result</h3>
                <div className="rounded-md bg-muted/50 p-4 text-sm min-h-[100px]">
                  {currentSubmission.resultText || "No text result."}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Attached File</h3>
                {currentSubmission.fileAssetId ? (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center h-[100px]">
                    <span className="text-sm font-medium">File attached</span>
                    <span className="text-xs text-muted-foreground">Preview not available in MVP</span>
                  </div>
                ) : (
                  <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    No file attached
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Your Review Note (Optional for Approve)</h3>
              <Textarea
                placeholder="Great job! / Please fix the shading here..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
            <Button
              variant="destructive"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isBusy || task.status !== "SUBMITTED"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Task
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRevisionDialogOpen(true)}
                disabled={isBusy || task.status !== "SUBMITTED"}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Request Revision
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isBusy || task.status !== "SUBMITTED"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Submission
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              This will send the task back to the assistant. You must provide clear feedback on what needs to be changed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRevisionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestRevision} disabled={isBusy || !reviewNote.trim()}>Confirm Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Reject Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this task? This means the assistant will not be paid and the work is discarded.
              A reason must be provided.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isBusy || !reviewNote.trim()}>Reject Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
