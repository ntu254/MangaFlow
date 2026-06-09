import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { getChapterReadiness, listPagesByChapter, type Page } from "../api/chapter.api"
import { createPublication, publishPublication, schedulePublication } from "../api/publication.api"
import { listTasksByChapter, type Task } from "@/features/task/api/task.api"
import type { PublicationReadinessItem } from "@/shared/components/domain"
import {
  fallbackReadinessItems,
  toChapterActions,
  toPageRows,
} from "../utils/chapter-detail.mappers"

export function useChapterDetail() {
  const { id } = useParams()
  const chapterId = id ?? ""
  const [activeTab, setActiveTab] = useState("pages")
  const [pages, setPages] = useState<Page[]>([])
  const [pagesLoading, setPagesLoading] = useState(Boolean(chapterId))
  const [pagesError, setPagesError] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(Boolean(chapterId))
  const [tasksError, setTasksError] = useState("")
  const [readinessItems, setReadinessItems] = useState<PublicationReadinessItem[]>(fallbackReadinessItems)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const [readinessMessage, setReadinessMessage] = useState("Readiness will load from backend when a real chapter id is available.")
  const [publicationId, setPublicationId] = useState("")
  const [scheduleInput, setScheduleInput] = useState("2026-06-24T00:00:00.000Z")
  const [publicationMessage, setPublicationMessage] = useState("No publication API action run yet.")
  const [publicationActionLoading, setPublicationActionLoading] = useState(false)

  const loadPages = useCallback(async () => {
    if (!chapterId) {
      setPagesLoading(false)
      return
    }

    setPagesLoading(true)
    setPagesError("")
    try {
      const response = await listPagesByChapter(chapterId)
      if (!response.success || !response.data) {
        setPagesError(response.message ?? "Could not load pages.")
        setPages([])
        return
      }
      setPages(response.data)
    } catch {
      setPagesError("Could not reach MangaFlow pages API.")
      setPages([])
    } finally {
      setPagesLoading(false)
    }
  }, [chapterId])

  const loadReadiness = useCallback(async () => {
    if (!chapterId) return
    setReadinessLoading(true)
    try {
      const response = await getChapterReadiness(chapterId)
      if (!response.success || !response.data) {
        setReadinessMessage(response.message ?? "Could not load readiness.")
        setReadinessItems(fallbackReadinessItems)
      } else {
        setReadinessItems(response.data.items.map((item) => ({
          id: item.key,
          label: item.key.replace(/([A-Z])/g, " $1"),
          passed: item.passed,
          description: item.reason,
        })))
        setReadinessMessage(response.data.ready ? "Backend says this chapter is ready for publication." : "Backend says this chapter is still blocked for publication.")
      }
    } catch {
      setReadinessMessage("Could not reach MangaFlow readiness API.")
      setReadinessItems(fallbackReadinessItems)
    } finally {
      setReadinessLoading(false)
    }
  }, [chapterId])

  const loadTasks = useCallback(async () => {
    if (!chapterId) {
      setTasksLoading(false)
      return
    }

    setTasksLoading(true)
    setTasksError("")
    try {
      const response = await listTasksByChapter(chapterId)
      if (!response.success || !response.data) {
        setTasksError(response.message ?? "Could not load chapter tasks.")
        setTasks([])
        return
      }
      setTasks(response.data)
    } catch {
      setTasksError("Could not reach MangaFlow chapter task API.")
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    void loadPages()
    void loadTasks()
  }, [loadPages, loadTasks])

  useEffect(() => {
    if (activeTab === "readiness") {
      void loadReadiness()
    }
  }, [activeTab, loadReadiness])

  const handleCreatePublication = useCallback(async () => {
    if (!chapterId) return
    setPublicationActionLoading(true)
    try {
      const response = await createPublication(chapterId, scheduleInput)
      if (!response.success || !response.data) {
        setPublicationMessage(response.message ?? "Could not create publication.")
        return
      }
      setPublicationId(response.data.id)
      setPublicationMessage("Publication record created via backend.")
      await loadReadiness()
    } catch {
      setPublicationMessage("Could not reach MangaFlow publication API.")
    } finally {
      setPublicationActionLoading(false)
    }
  }, [chapterId, loadReadiness, scheduleInput])

  const handleSchedulePublication = useCallback(async () => {
    if (!publicationId) {
      setPublicationMessage("Create a publication record first.")
      return
    }
    setPublicationActionLoading(true)
    try {
      const response = await schedulePublication(publicationId, scheduleInput)
      setPublicationMessage(response.success ? "Publication schedule updated via backend." : response.message ?? "Could not schedule publication.")
      await loadReadiness()
    } catch {
      setPublicationMessage("Could not reach MangaFlow publication API.")
    } finally {
      setPublicationActionLoading(false)
    }
  }, [loadReadiness, publicationId, scheduleInput])

  const handlePublishPublication = useCallback(async () => {
    if (!publicationId) {
      setPublicationMessage("Create a publication record first.")
      return
    }
    setPublicationActionLoading(true)
    try {
      const response = await publishPublication(publicationId)
      setPublicationMessage(response.success ? "Chapter published through backend publication flow." : response.message ?? "Could not publish chapter.")
      await loadReadiness()
    } catch {
      setPublicationMessage("Could not reach MangaFlow publication API.")
    } finally {
      setPublicationActionLoading(false)
    }
  }, [loadReadiness, publicationId])

  const readinessSummaryTone = useMemo<"success" | "warning">(() => readinessItems.every((item) => item.passed) ? "success" : "warning", [readinessItems])
  const pageRows = useMemo(() => toPageRows(pages), [pages])
  const selectedPage = pages[0] ?? null
  const featuredTask = tasks[0] ?? null
  const chapterActions = useMemo(() => toChapterActions(tasks), [tasks])

  return {
    id,
    chapterId,
    activeTab,
    pagesLoading,
    pagesError,
    tasksLoading,
    tasksError,
    readinessItems,
    readinessLoading,
    readinessMessage,
    publicationId,
    scheduleInput,
    publicationMessage,
    publicationActionLoading,
    tasks,
    readinessSummaryTone,
    pageRows,
    selectedPage,
    featuredTask,
    chapterActions,
    setActiveTab,
    setScheduleInput,
    loadPages,
    loadTasks,
    loadReadiness,
    handleCreatePublication,
    handleSchedulePublication,
    handlePublishPublication,
  }
}
