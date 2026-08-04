import { TodayQueue, type TodayQueueProps } from "@/components/today-queue"

type BoardTodayScreenProps = Omit<TodayQueueProps, "emptyTitle" | "emptyDescription">

// Board Today renders the backend-prioritized vote, re-vote, and Chair close
// work without re-sorting or deriving capabilities on the client.
export function BoardTodayScreen(props: BoardTodayScreenProps) {
  const inbox = props.inbox
    ? {
        ...props.inbox,
        items: props.inbox.items.filter(
          (item) => !(item.kind === "SESSION_FINALIZE" && item.status === "TIED"),
        ),
      }
    : undefined

  return (
    <TodayQueue
      {...props}
      inbox={inbox}
      emptyTitle="No Board decisions need your attention."
      emptyDescription="Votes, re-votes, and open-round Chair close actions will appear here."
      context="Board work"
    />
  )
}
