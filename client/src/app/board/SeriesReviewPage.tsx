import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileText, Vote, Flag } from "lucide-react"

import { useBoardActions } from "@/features/reviews/hooks/useBoardFlow"
import { seriesApi } from "@/features/series/services/series.api"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { RankingReportCard } from "@/features/board/components/RankingReportCard"
import { VoteSummary } from "@/features/board/components/VoteSummary"
import { BoardDecisionPanel } from "@/features/board/components/BoardDecisionPanel"
import { ReasonRequiredComposer } from "@/features/board/components/ReasonRequiredComposer"

export default function BoardSeriesReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [voteNote, setVoteNote] = useState("")
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY" | "">("")
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false)
  const [finalizeDecision, setFinalizeDecision] = useState<"APPROVED" | "REJECTED" | "NEEDS_REVISION" | "">("")

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["series", id, "summary"],
    queryFn: () => seriesApi.getSummary(id!),
    enabled: !!id,
  })

  const { vote, finalize } = useBoardActions(id)
  
  const summary = summaryData?.data?.data
  const series = summary?.series
  const manuscript = summary?.currentManuscript
  
  // For MVP, if they are board, we let them cast vote. If there are enough votes, someone can finalize.

  const handleVote = async (value: "APPROVE" | "REJECT" | "NEEDS_REVISION") => {
    try {
      await vote.mutateAsync({ value, note: voteNote })
      setVoteNote("")
    } catch {
      // Error handled by hook
    }
  }

  const handleFinalize = async () => {
    if (!finalizeDecision) {
      toast.error("Please select a decision")
      return
    }
    if (finalizeDecision === "APPROVED" && !publicationType) {
      toast.error("Publication type is required when approving")
      return
    }

    try {
      await finalize.mutateAsync({
        decision: finalizeDecision,
        publicationType: finalizeDecision === "APPROVED" ? (publicationType as "WEEKLY" | "MONTHLY") : undefined,
        note: voteNote,
      })
      setIsFinalizeDialogOpen(false)
      navigate("/app/board/dashboard")
    } catch {
      // Error handled by hook
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Series not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-10">
      <Button variant="ghost" onClick={() => navigate("/app/board/dashboard")} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Queue
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <RankingReportCard data={{
             rank: (summary as any)?.ranking?.rank || '-', 
             score: (summary as any)?.ranking?.score || '-', 
             trend: (summary as any)?.ranking?.trend || 'UP', 
             trendValue: (summary as any)?.ranking?.trendValue || '+0',
             atRisk: (summary as any)?.ranking?.atRisk || false,
             atRiskReason: (summary as any)?.ranking?.atRiskReason
          }} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{series.title}</CardTitle>
                  <CardDescription className="mt-1">
                    By {summary?.owner?.name || "Unknown Author"}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {series.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Synopsis</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{series.synopsis}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Target Audience</h3>
                  <p className="text-sm text-muted-foreground">{series.targetAudience || "N/A"}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Genres</h3>
                  <div className="flex flex-wrap gap-1">
                    {series.genres?.map((g: string) => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Manuscript & Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              {manuscript ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Version {manuscript.version}</p>
                    <p className="text-sm text-muted-foreground">
                      {manuscript.file?.originalName || "No file attached"}
                    </p>
                  </div>
                  <Button variant="outline" disabled={!manuscript.file}>
                    Download
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No manuscript available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <VoteSummary 
             votes={(summary as any)?.boardReview?.votes || []}
             pendingCount={Math.max(0, 3 - (summary?.boardReview?.voteCount || 0))}
             isFinalized={summary?.boardReview?.status === "FINALIZED"}
          />

          <BoardDecisionPanel title="Cast Your Vote" icon={<Vote className="h-5 w-5 text-violet-600" />} tone="violet">
            <ReasonRequiredComposer 
              label="Review Notes" 
              value={voteNote}
              onChange={(e) => setVoteNote(e.target.value)}
              placeholder="Add your review notes here..." 
            />
            <div className="grid gap-2">
              <Button 
                onClick={() => handleVote("APPROVE")} 
                disabled={vote.isPending || summary?.boardReview?.status === "FINALIZED" || !voteNote.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button 
                onClick={() => handleVote("NEEDS_REVISION")}
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                disabled={vote.isPending || summary?.boardReview?.status === "FINALIZED" || !voteNote.trim()}
              >
                <AlertCircle className="mr-2 h-4 w-4" /> Request Revision
              </Button>
              <Button 
                onClick={() => handleVote("REJECT")}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={vote.isPending || summary?.boardReview?.status === "FINALIZED" || !voteNote.trim()}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </BoardDecisionPanel>

          <BoardDecisionPanel title="Finalize Decision" icon={<Flag className="h-5 w-5 text-amber-600" />} tone="amber">
            <div className="mb-4 rounded-md bg-amber-100/50 p-3">
              <p className="text-sm font-medium text-amber-900">Current Votes: {summary?.boardReview?.voteCount || 0}</p>
            </div>
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
              onClick={() => setIsFinalizeDialogOpen(true)}
              disabled={summary?.boardReview?.status === "FINALIZED"}
            >
              Finalize Results
            </Button>
          </BoardDecisionPanel>
        </div>
      </div>

      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Board Decision</DialogTitle>
            <DialogDescription>
              Select the final decision for this series. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Decision</label>
              <Select value={finalizeDecision} onValueChange={(v: any) => setFinalizeDecision(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve for Serialization</SelectItem>
                  <SelectItem value="NEEDS_REVISION">Request Major Revision</SelectItem>
                  <SelectItem value="REJECTED">Reject Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {finalizeDecision === "APPROVED" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Publication Schedule</label>
                <Select value={publicationType} onValueChange={(v: any) => setPublicationType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFinalizeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFinalize} disabled={finalize.isPending}>Confirm Decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
