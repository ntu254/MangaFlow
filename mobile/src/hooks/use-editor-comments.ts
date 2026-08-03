import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createEditorComment,
  replyEditorComment,
  reopenEditorComment,
  resolveEditorComment,
  type CreateEditorCommentInput,
} from "@/services/editor-mobile-data-source"
import { editorChapterKeys } from "@/hooks/use-editor-chapter"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

// Comment mutations for a chapter's thread. Every change refreshes the chapter
// detail (readiness depends on blocking-comment state) and the Editor inbox.
export function useEditorComments(chapterId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: editorChapterKeys.detail(chapterId) })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("editor") })
  }

  const create = useMutation({
    mutationFn: (input: CreateEditorCommentInput) => createEditorComment(input),
    onSuccess: invalidate,
  })
  const reply = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      replyEditorComment(commentId, { body }),
    onSuccess: invalidate,
  })
  const resolve = useMutation({
    mutationFn: (commentId: string) => resolveEditorComment(commentId),
    onSuccess: invalidate,
  })
  const reopen = useMutation({
    mutationFn: (commentId: string) => reopenEditorComment(commentId),
    onSuccess: invalidate,
  })

  return { create, reply, resolve, reopen }
}
