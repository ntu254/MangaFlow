import { format } from "date-fns"
import { CheckCircle2, FileText, Image as ImageIcon, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import { useMangakaReviewQueue } from "@/features/reviews/hooks/useMangakaReview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

export default function MangakaReviewQueuePage() {
  const { data: queueData, isLoading } = useMangakaReviewQueue()
  
  const submissions = queueData ?? []

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading your review queue...</p>
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">
            Approve or request revisions for tasks submitted by your assistants.
          </p>
        </div>
        
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">You're all caught up!</h2>
          <p className="mt-2 text-muted-foreground">
            There are no pending submissions waiting for your review.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">
          You have {submissions.length} submission{submissions.length !== 1 ? 's' : ''} waiting for your review.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {submissions.map((item: any) => (
          <Card key={item.id} className="flex flex-col transition-colors hover:bg-muted/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                  Version {item.version}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(item.updatedAt), "MMM d, yyyy")}
                </div>
              </div>
              <CardTitle className="mt-2 line-clamp-1 text-lg">
                Task Review
              </CardTitle>
              <CardDescription className="line-clamp-1">
                Submitted by {item.submittedBy?.name || "Assistant"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end gap-4 pt-0">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="line-clamp-1 text-xs">Series: {item.seriesId}</span>
                </div>
                {item.fileAssetId && (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <ImageIcon className="h-4 w-4" />
                    <span className="line-clamp-1 text-xs">Has File Attachment</span>
                  </div>
                )}
              </div>
              
              <Button asChild className="w-full">
                <Link to={`/app/mangaka/tasks/${item.taskId}/review`}>
                  Review Submission
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
