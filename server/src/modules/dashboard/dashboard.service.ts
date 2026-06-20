import mongoose from "mongoose"
import * as repository from "./dashboard.repository.js"
import { Series } from "../series/series.model.js"
import { Submission } from "../submission/submission.model.js"
import { Task } from "../task/task.model.js"

export async function getAdminSidebarSummaryService() {
  const [
    activeUsers,
    totalSeries,
    activeTasks,
    boardMembers,
    activeTaskTypes,
    suspendedUsers,
    seriesPendingReview,
    activeBoardChairs,
    inactiveTaskTypes,
    pendingPayrollConfirmations,
  ] = await Promise.all([
    repository.countActiveUsers(),
    repository.countSeries(),
    repository.countActiveTasks(),
    repository.countBoardMembers(),
    repository.countTaskTypes(),
    repository.countSuspendedUsers(),
    repository.countSeriesPendingReview(),
    repository.countActiveBoardChairs(),
    repository.countInactiveTaskTypes(),
    repository.countPendingPayrollConfirmations(),
  ])

  const aiStatus: string = "PENDING_INTEGRATION"
  const storageUsagePercent = 0
  const missingBoardChair = activeBoardChairs === 0
  const storageWarning = storageUsagePercent >= 80
  const aiUnhealthy = aiStatus !== "OPERATIONAL"
  const criticalAuditEvents = 0
  const systemWarnings = [missingBoardChair, storageWarning, aiUnhealthy].filter(Boolean).length
  const unreadNotifications = systemWarnings

  return {
    stats: { activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes },
    sidebarBadges: {
      suspendedUsers,
      seriesPendingReview,
      missingBoardChair,
      inactiveTaskTypes,
      taskRateWarnings: 0,
      pendingPayrollConfirmations,
      storageWarning,
      aiUnhealthy,
      criticalAuditEvents,
      systemWarnings,
      unreadNotifications,
    },
    systemHealth: [
      { key: "api", label: "API", status: "OPERATIONAL" },
      { key: "db", label: "Database", status: "OPERATIONAL" },
      { key: "storage", label: "Storage", status: storageWarning ? "WARNING" : "CONFIGURED" },
      { key: "ai", label: "AI Service", status: aiStatus },
    ],
    storage: { usedLabel: "MVP monitor", usagePercent: storageUsagePercent },
    auditPreview: [
      "Admin dashboard summary refreshed",
      "Admin can view counts but cannot override Board decisions",
      "Health endpoint remains available at /api/health",
    ],
  }
}

export async function getMangakaSummaryService(userId: string) {
  // Parallel fast queries
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const [
    seriesCount,
    seriesByStatus,
  ] = await Promise.all([
    repository.countSeries({ ownerId: userObjectId }),
    Series.aggregate([
      { $match: { ownerId: userObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ])

  // Map series status to pipeline counts
  const pipeline = { draft: 0, boardReview: 0, production: 0, published: 0 }
  seriesByStatus.forEach(stat => {
    if (stat._id === "DRAFT" || stat._id === "EDITOR_REVIEW") pipeline.draft += stat.count
    if (stat._id === "BOARD_REVIEW") pipeline.boardReview += stat.count
    if (stat._id === "ONGOING") pipeline.production += stat.count
    if (stat._id === "COMPLETED") pipeline.published += stat.count
  })

  // To properly filter tasks and submissions by owner's series:
  // Since we don't have a direct ownerId on Task/Submission, we find series first.
  const mySeriesIds = (await Series.find({ ownerId: userObjectId }).select("_id").lean()).map(s => s._id)
  
  const realPendingReviews = await Submission.countDocuments({ seriesId: { $in: mySeriesIds }, status: "SUBMITTED" })
  const realCompletedTasks = await Task.countDocuments({ seriesId: { $in: mySeriesIds }, status: { $in: ["MANGAKA_APPROVED", "EDITOR_APPROVED"] } })

  return {
    nextActions: [
      { id: "1", type: "REVIEW_SUBMISSION", label: "Review 2 assistant submissions", isUrgent: true, targetId: "series-1" },
      { id: "2", type: "UPLOAD_MANUSCRIPT", label: "Upload Chapter 12 manuscript", isUrgent: false, targetId: "series-1" }
    ],
    activeSeriesPipeline: pipeline,
    currentChapterProgress: { chapterId: "ch1", progressPercent: 65, totalPages: 20, completedPages: 13 },
    dueSoon: [],
    atRiskItems: [],
    quickStats: { activeSeries: seriesCount, completedTasks: realCompletedTasks, pendingReviews: realPendingReviews },
    recentActivity: []
  }
}

export async function getAssistantSummaryService(_userId: string) {
  return {
    nextActions: [
      { id: "1", type: "DO_TASK", label: "Complete background drawing for Page 5", isUrgent: true, targetId: "task-1" }
    ],
    myTasks: { dueToday: 2, inProgress: 1, revisionRequested: 0, submitted: 3, approved: 10 },
    dueSoon: [],
    quickStats: { totalEarnings: 1250, completedTasks: 42, activeTasks: 3 },
    recentActivity: []
  }
}


export async function getEditorSummaryService(userId: string) {
  const assignedSeries = await Series.countDocuments({ editorId: userId })
  const pendingApprovals = await Submission.countDocuments({ status: "EDITOR_FINAL_REVIEW" })
  
  return {
    nextActions: [],
    reviewQueue: { manuscripts: 0, productions: pendingApprovals, publications: 0 },
    dueSoon: [],
    atRiskItems: [],
    quickStats: { assignedSeries, pendingApprovals },
    recentActivity: []
  }
}

export async function getBoardSummaryService(_userId: string) {
  const pendingVotes = await Series.countDocuments({ status: "BOARD_REVIEW" })
  const atRiskReviews = await Series.countDocuments({ status: "AT_RISK" })
  
  return {
    nextActions: [],
    boardQueue: { pendingVotes, atRiskReviews },
    dueSoon: [],
    quickStats: { activeSeries: await Series.countDocuments(), totalVotesCast: 0 },
    recentActivity: []
  }
}
