import { TodayQueue, type TodayQueueProps } from "@/components/today-queue"

type EditorTodayScreenProps = Omit<TodayQueueProps, "emptyTitle" | "emptyDescription">

// Foundation slice: Editor Today shows proposal-review work. Later plans add
// chapter, comment, and publication items from the same inbox.
export function EditorTodayScreen(props: EditorTodayScreenProps) {
  return (
    <TodayQueue
      {...props}
      emptyTitle="No decisions need your attention."
      emptyDescription="New proposals and reviews will appear here."
    />
  )
}
