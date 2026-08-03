import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  postponeChapterPublication,
  publishChapterNow,
  scheduleChapterPublication,
} from "@/services/editor-mobile-data-source"
import { editorChapterKeys } from "@/hooks/use-editor-chapter"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

// Publication decisions call canonical chapter actions. Chapter status is never
// changed locally; the inbox and chapter detail refresh from the server.
export function useEditorPublications(chapterId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: editorChapterKeys.detail(chapterId) })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("editor") })
  }

  const schedule = useMutation({
    mutationFn: (input: { scheduledAt: string }) => scheduleChapterPublication(chapterId, input),
    onSuccess: invalidate,
  })
  const postpone = useMutation({
    mutationFn: () => postponeChapterPublication(chapterId),
    onSuccess: invalidate,
  })
  const publish = useMutation({
    mutationFn: () => publishChapterNow(chapterId),
    onSuccess: invalidate,
  })

  return { schedule, postpone, publish }
}
