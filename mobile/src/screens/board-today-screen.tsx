import { TodayQueue, type TodayQueueProps } from "@/components/today-queue"

type BoardTodayScreenProps = Omit<TodayQueueProps, "emptyTitle" | "emptyDescription">

// Board Today renders the backend-prioritized vote, re-vote, and Chair close
// work without re-sorting or deriving capabilities on the client.
export function BoardTodayScreen(props: BoardTodayScreenProps) {
  return (
    <TodayQueue
      {...props}
      emptyTitle="No Board decisions need your attention."
      emptyDescription="Votes, re-votes, and Chair close actions will appear here."
      context="Board work"
    />
  )
}
