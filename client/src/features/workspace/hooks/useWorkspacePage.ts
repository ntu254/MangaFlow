import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import type { CommentThreadItem, SubmissionVersionItem } from "@/shared/components/domain"
import { getTask, getTaskComments, getTaskSubmissions, type Task } from "@/features/task/api/task.api"
import { mapCommentToThread, mapSubmissionToVersion } from "../utils/workspace.mappers"

export function useWorkspacePage() {
  const { taskId } = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<CommentThreadItem[]>([])
  const [submissions, setSubmissions] = useState<SubmissionVersionItem[]>([])
  const [loading, setLoading] = useState(Boolean(taskId))
  const [error, setError] = useState("")

  const loadTask = useCallback(async () => {
    if (!taskId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await getTask(taskId)
      if (!response.success || !response.data) {
        setTask(null)
        setComments([])
        setSubmissions([])
        setError(response.message ?? "Could not load task workspace.")
        return
      }
      setTask(response.data)

      const [commentsRes, submissionsRes] = await Promise.all([
        getTaskComments(taskId),
        getTaskSubmissions(taskId),
      ])
      setComments(commentsRes.success && commentsRes.data ? commentsRes.data.map(mapCommentToThread) : [])
      setSubmissions(submissionsRes.success && submissionsRes.data ? submissionsRes.data.map(mapSubmissionToVersion) : [])
    } catch {
      setTask(null)
      setComments([])
      setSubmissions([])
      setError("Could not reach MangaFlow task workspace API.")
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  const isLive = useMemo(() => Boolean(task), [task])

  return { taskId, task, comments, submissions, loading, error, isLive, loadTask }
}
