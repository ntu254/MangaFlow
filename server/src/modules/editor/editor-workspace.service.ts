import mongoose from "mongoose"
import { AtRiskDecisionRecord, BoardDecision } from "../board/board.model.js"
import { Chapter, Page } from "../chapter/chapter.model.js"
import { Ranking } from "../ranking/ranking.model.js"
import { Series, SeriesMember } from "../series/series.model.js"
import { Submission } from "../submission/submission.model.js"
import { Task } from "../task/task.model.js"
import type { UserRole } from "../auth/auth.types.js"

interface EditorActor {
  userId: string
  role: UserRole
}

const ACTIVE_TASK_STATUSES = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]
const BLOCKING_TASK_STATUSES = ["SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value)
}

function idOf(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (value instanceof mongoose.Types.ObjectId) return String(value)
  if (typeof value === "object") {
    const record = value as { _id?: unknown; id?: unknown; toString?: () => string }
    if (record.id) return String(record.id)
    if (record._id) return String(record._id)
    return record.toString?.() ?? ""
  }
  return String(value)
}

function safeSeries(series: any) {
  return {
    id: idOf(series._id ?? series.id),
    title: series.title,
    slug: series.slug,
    synopsis: series.synopsis,
    logline: series.logline,
    requestedPublicationType: series.requestedPublicationType,
    publicationType: series.publicationType,
    genres: series.genres ?? [],
    tags: series.tags ?? [],
    status: series.status,
    updatedAt: series.updatedAt,
    createdAt: series.createdAt,
  }
}

async function managedSeriesIds(actor: EditorActor) {
  if (actor.role === "ADMIN") {
    const series = await Series.find({ status: { $in: ["ONGOING", "AT_RISK", "BOARD_REVIEW", "EDITOR_REVIEW"] } })
      .select("_id")
      .lean()
    return series.map((item) => item._id)
  }

  const memberships = await SeriesMember.find({
    userId: toObjectId(actor.userId),
    role: "EDITOR",
    status: "ACTIVE",
  })
    .select("seriesId")
    .lean()

  return memberships.map((item) => item.seriesId)
}

function latestBySeries<T extends { seriesId: unknown; updatedAt?: Date; createdAt?: Date }>(items: T[]) {
  const map = new Map<string, T>()
  for (const item of items) {
    const key = idOf(item.seriesId)
    if (!map.has(key)) map.set(key, item)
  }
  return map
}

function groupBySeries<T extends { seriesId: unknown }>(items: T[]) {
  return items.reduce<Map<string, T[]>>((map, item) => {
    const key = idOf(item.seriesId)
    map.set(key, [...(map.get(key) ?? []), item])
    return map
  }, new Map())
}

export async function listEditorManagedSeriesService(actor: EditorActor) {
  const seriesIds = await managedSeriesIds(actor)
  if (seriesIds.length === 0) return []

  const [series, chapters, tasks, rankings] = await Promise.all([
    Series.find({ _id: { $in: seriesIds } }).sort({ updatedAt: -1 }).lean(),
    Chapter.find({ seriesId: { $in: seriesIds } }).sort({ updatedAt: -1 }).lean(),
    Task.find({ seriesId: { $in: seriesIds } }).sort({ dueDate: 1 }).lean(),
    Ranking.find({ seriesId: { $in: seriesIds } }).sort({ period: -1, updatedAt: -1 }).lean(),
  ])

  const latestChapter = latestBySeries(chapters)
  const tasksBySeries = groupBySeries(tasks)
  const latestRanking = latestBySeries(rankings)
  const now = Date.now()
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000

  return series.map((item) => {
    const key = idOf(item._id)
    const seriesTasks = tasksBySeries.get(key) ?? []
    const activeTasks = seriesTasks.filter((task) => ACTIVE_TASK_STATUSES.includes(task.status))
    const pendingFinalReviews = seriesTasks.filter((task) => task.status === "MANGAKA_APPROVED")
    const deadlineRisk = activeTasks.filter((task) => {
      const due = task.dueDate ? new Date(task.dueDate).getTime() : 0
      return due > 0 && due - now <= threeDaysMs
    })

    return {
      series: safeSeries(item),
      currentChapter: latestChapter.get(key)
        ? {
            id: idOf(latestChapter.get(key)!._id),
            title: latestChapter.get(key)!.title,
            chapterNumber: latestChapter.get(key)!.chapterNumber,
            status: latestChapter.get(key)!.status,
            updatedAt: latestChapter.get(key)!.updatedAt,
          }
        : null,
      pendingFinalReviews: pendingFinalReviews.length,
      activeTasks: activeTasks.length,
      blockers: seriesTasks.filter((task) => BLOCKING_TASK_STATUSES.includes(task.status)).length,
      deadlineRisk: deadlineRisk.length,
      latestRanking: latestRanking.get(key)
        ? {
            id: idOf(latestRanking.get(key)!._id),
            period: latestRanking.get(key)!.period,
            voteCount: latestRanking.get(key)!.voteCount,
            readerScore: latestRanking.get(key)!.readerScore,
            finalScore: latestRanking.get(key)!.finalScore,
            status: latestRanking.get(key)!.status,
          }
        : null,
    }
  })
}

export async function listEditorProductionProgressService(actor: EditorActor) {
  const seriesIds = await managedSeriesIds(actor)
  if (seriesIds.length === 0) return []

  const [series, chapters, pages, tasks] = await Promise.all([
    Series.find({ _id: { $in: seriesIds } }).sort({ updatedAt: -1 }).lean(),
    Chapter.find({ seriesId: { $in: seriesIds } }).sort({ chapterNumber: -1 }).lean(),
    Page.find({ chapterId: { $in: await Chapter.find({ seriesId: { $in: seriesIds } }).select("_id").lean().then((items) => items.map((item) => item._id)) } }).lean(),
    Task.find({ seriesId: { $in: seriesIds } }).sort({ dueDate: 1 }).lean(),
  ])

  const chaptersBySeries = groupBySeries(chapters)
  const tasksBySeries = groupBySeries(tasks)
  const pagesByChapter = pages.reduce<Map<string, any[]>>((map, page) => {
    const key = idOf(page.chapterId)
    map.set(key, [...(map.get(key) ?? []), page])
    return map
  }, new Map())

  return series.map((item) => {
    const key = idOf(item._id)
    const seriesChapters = chaptersBySeries.get(key) ?? []
    const seriesTasks = tasksBySeries.get(key) ?? []
    return {
      series: safeSeries(item),
      chapters: seriesChapters.slice(0, 5).map((chapter) => {
        const chapterPages = pagesByChapter.get(idOf(chapter._id)) ?? []
        const chapterTasks = seriesTasks.filter((task) => idOf(task.chapterId) === idOf(chapter._id))
        const approvedTasks = chapterTasks.filter((task) => task.status === "EDITOR_APPROVED").length
        return {
          id: idOf(chapter._id),
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
          status: chapter.status,
          pagesTotal: chapterPages.length,
          pagesApproved: chapterPages.filter((page) => page.status === "APPROVED").length,
          pages: chapterPages
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .slice(0, 8)
            .map((page) => ({
              id: idOf(page._id),
              pageNumber: page.pageNumber,
              status: page.status,
              hasWorkingFile: Boolean(page.workingFileAssetId),
            })),
          tasksTotal: chapterTasks.length,
          tasksApproved: approvedTasks,
          pendingEditorReviews: chapterTasks.filter((task) => task.status === "MANGAKA_APPROVED").length,
          readinessPercent: chapterTasks.length ? Math.round((approvedTasks / chapterTasks.length) * 100) : 0,
          updatedAt: chapter.updatedAt,
        }
      }),
    }
  })
}

export async function listEditorRankingRiskService(actor: EditorActor) {
  const seriesIds = await managedSeriesIds(actor)
  if (seriesIds.length === 0) return []

  const [series, rankings, decisions] = await Promise.all([
    Series.find({ _id: { $in: seriesIds } }).sort({ title: 1 }).lean(),
    Ranking.find({ seriesId: { $in: seriesIds } }).sort({ period: -1, updatedAt: -1 }).lean(),
    AtRiskDecisionRecord.find({ seriesId: { $in: seriesIds } }).sort({ createdAt: -1 }).lean(),
  ])
  const rankingsBySeries = groupBySeries(rankings)
  const decisionsBySeries = groupBySeries(decisions)

  return series.map((item) => {
    const key = idOf(item._id)
    const history = (rankingsBySeries.get(key) ?? []).map((ranking) => ({
      id: idOf(ranking._id),
      period: ranking.period,
      voteCount: ranking.voteCount,
      readerScore: ranking.readerScore,
      finalScore: ranking.finalScore,
      status: ranking.status,
      updatedAt: ranking.updatedAt,
    }))
    const latest = history[0] ?? null
    return {
      series: safeSeries(item),
      latestRanking: latest,
      riskLevel: item.status === "AT_RISK" || (latest?.finalScore ?? 100) < 55 ? "HIGH" : (latest?.finalScore ?? 100) < 70 ? "WATCH" : "STABLE",
      trend: history.slice(0, 6),
      latestDecision: decisionsBySeries.get(key)?.[0]
        ? {
            id: idOf(decisionsBySeries.get(key)![0]._id),
            decision: decisionsBySeries.get(key)![0].decision,
            note: decisionsBySeries.get(key)![0].note,
            createdAt: decisionsBySeries.get(key)![0].createdAt,
          }
        : null,
    }
  })
}

export async function listEditorDecisionHistoryService(actor: EditorActor) {
  const seriesIds = await managedSeriesIds(actor)
  if (seriesIds.length === 0) return []

  const [boardDecisions, atRiskDecisions] = await Promise.all([
    BoardDecision.find({ seriesId: { $in: seriesIds } })
      .sort({ finalizedAt: -1, updatedAt: -1 })
      .populate("seriesId", "title slug status")
      .populate("decidedBy", "name displayName email")
      .lean(),
    AtRiskDecisionRecord.find({ seriesId: { $in: seriesIds } })
      .sort({ createdAt: -1 })
      .populate("seriesId", "title slug status")
      .populate("decidedBy", "name displayName email")
      .lean(),
  ])

  const boardItems = boardDecisions.map((decision) => {
    const series = decision.seriesId as any
    const actorUser = decision.decidedBy as any
    return {
      id: idOf(decision._id),
      type: "Series Approval",
      seriesId: idOf(series?._id ?? decision.seriesId),
      seriesTitle: series?.title ?? "Series",
      result: decision.status,
      detail: decision.note ?? decision.result ?? decision.publicationType ?? "",
      actor: actorUser?.displayName ?? actorUser?.name ?? actorUser?.email,
      decidedAt: decision.finalizedAt ?? decision.updatedAt,
    }
  })

  const riskItems = atRiskDecisions.map((decision) => {
    const series = decision.seriesId as any
    const actorUser = decision.decidedBy as any
    return {
      id: idOf(decision._id),
      type: "Cancellation Review",
      seriesId: idOf(series?._id ?? decision.seriesId),
      seriesTitle: series?.title ?? "Series",
      result: decision.decision,
      detail: decision.note ?? "",
      actor: actorUser?.displayName ?? actorUser?.name ?? actorUser?.email,
      decidedAt: decision.createdAt,
    }
  })

  return [...boardItems, ...riskItems].sort((a, b) => String(b.decidedAt ?? "").localeCompare(String(a.decidedAt ?? "")))
}

export async function listEditorActivityService(actor: EditorActor) {
  const seriesIds = await managedSeriesIds(actor)
  if (seriesIds.length === 0) return []

  const [series, tasks, submissions, chapters] = await Promise.all([
    Series.find({ _id: { $in: seriesIds } }).select("title").lean(),
    Task.find({ seriesId: { $in: seriesIds } }).sort({ updatedAt: -1 }).limit(20).lean(),
    Submission.find({ seriesId: { $in: seriesIds } }).sort({ updatedAt: -1 }).limit(20).lean(),
    Chapter.find({ seriesId: { $in: seriesIds } }).sort({ updatedAt: -1 }).limit(20).lean(),
  ])
  const titleById = new Map(series.map((item) => [idOf(item._id), item.title]))
  const events = [
    ...tasks.map((task) => ({
      id: `task-${idOf(task._id)}`,
      type: task.status === "MANGAKA_APPROVED" ? "Task waiting Editor final review" : "Task updated",
      seriesId: idOf(task.seriesId),
      seriesTitle: titleById.get(idOf(task.seriesId)) ?? "Series",
      detail: task.title,
      at: task.updatedAt,
    })),
    ...submissions.map((submission) => ({
      id: `submission-${idOf(submission._id)}`,
      type: submission.status === "EDITOR_APPROVED" ? "Editor approved submission" : "Submission updated",
      seriesId: idOf(submission.seriesId),
      seriesTitle: titleById.get(idOf(submission.seriesId)) ?? "Series",
      detail: `Submission v${submission.version} ${submission.status}`,
      at: submission.updatedAt,
    })),
    ...chapters.map((chapter) => ({
      id: `chapter-${idOf(chapter._id)}`,
      type: "Chapter status updated",
      seriesId: idOf(chapter.seriesId),
      seriesTitle: titleById.get(idOf(chapter.seriesId)) ?? "Series",
      detail: `Chapter ${chapter.chapterNumber}: ${chapter.status}`,
      at: chapter.updatedAt,
    })),
  ]

  return events.sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? ""))).slice(0, 30)
}
