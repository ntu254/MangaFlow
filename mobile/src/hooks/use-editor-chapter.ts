import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  approveChapter,
  getEditorChapterDetail,
  rejectChapter,
  requestChapterRevision,
  type EditorChapterDetail,
} from "@/services/editor-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

export const editorChapterKeys = {
  detail: (id: string) => ["editor", "chapter", id] as const,
}

export function useEditorChapter(
  chapterId: string,
  getDetail: (id: string) => Promise<EditorChapterDetail> = getEditorChapterDetail,
) {
  const queryClient = useQueryClient()

  const detail = useQuery({
    queryKey: editorChapterKeys.detail(chapterId),
    queryFn: () => getDetail(chapterId),
  })

  // No optimistic status change; refresh chapter, inbox, and readiness from
  // the server so mobile always reflects canonical state.
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: editorChapterKeys.detail(chapterId) })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("editor") })
  }

  const requestRevision = useMutation({
    mutationFn: (input: { comment: string }) => requestChapterRevision(chapterId, input),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: (input: { comment: string }) => rejectChapter(chapterId, input),
    onSuccess: invalidate,
  })
  const approve = useMutation({
    mutationFn: () => approveChapter(chapterId),
    onSuccess: invalidate,
  })

  return { detail, requestRevision, reject, approve }
}
