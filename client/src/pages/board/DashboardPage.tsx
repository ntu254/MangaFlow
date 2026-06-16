import { Link } from "react-router-dom"
import { useBoardQueue } from "@/hooks/useBoardFlow"
import { useAuthStore } from "@/store/authStore"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Users } from "lucide-react"

export default function BoardDashboardPage() {
  const { user } = useAuthStore()
  const { data: queueData, isLoading } = useBoardQueue()

  const pendingSeries = queueData?.filter(s => s.decisionStatus === "PENDING") ?? []
  const resolvedSeries = queueData?.filter(s => s.decisionStatus !== "PENDING") ?? []

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading board queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-10 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editorial Board</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Review and vote on series proposals.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Pending Reviews</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {pendingSeries.length} Actions Required
          </Badge>
        </div>

        {pendingSeries.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500/50" />
            <h3 className="text-lg font-semibold">Queue is empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are currently no series proposals awaiting board review.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingSeries.map((series) => (
              <Card key={series.id} className="flex flex-col transition-colors hover:bg-muted/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                      Voting Open
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(series.updatedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{series.seriesTitle}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {series.voteCount} vote(s) cast
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end pt-0 mt-4">
                  <Button asChild className="w-full">
                    <Link to={`/app/board/series/${series.id}/voting`}>
                      Review & Vote
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {resolvedSeries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recently Resolved</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resolvedSeries.map((series) => (
              <Card key={series.id} className="flex flex-col bg-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={series.decisionStatus === "APPROVED" ? "default" : "secondary"}>
                      {series.decisionStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1 text-base">{series.seriesTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="outline" className="w-full mt-2">
                    <Link to={`/app/board/series/${series.id}/summary`}>
                      View Summary
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
