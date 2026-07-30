import { TodayQueue, type TodayQueueProps } from "@/components/today-queue"

type BoardTodayScreenProps = Omit<TodayQueueProps, "emptyTitle" | "emptyDescription">

// Foundation slice: Board Today shows vote work. Later plans add finalization,
// re-vote, and at-risk items from the same inbox.
export function BoardTodayScreen(props: BoardTodayScreenProps) {
  return (
    <TodayQueue
      {...props}
      emptyTitle="No votes need your attention."
      emptyDescription="Proposals awaiting your vote will appear here."
    />
  )
}
