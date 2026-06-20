import { User } from "../../auth/auth.model.js"
import { BoardDecision, BoardVote } from "../../board/board.model.js"
import { Chapter, FileAsset, Page } from "../../chapter/chapter.model.js"
import { Comment } from "../../comment/comment.model.js"
import { AssistantEarning } from "../../payroll/payroll.model.js"
import { Publication } from "../../publication/publication.model.js"
import { Ranking } from "../../ranking/ranking.model.js"
import { Submission } from "../../submission/submission.model.js"
import { Task } from "../../task/task.model.js"
import { Manuscript, SeriesMember } from "../series.model.js"

export async function getSeriesSummaryData(seriesId: string, ownerId: string) {
  const [
    owner,
    members,
    manuscripts,
    chapters,
    tasks,
    submissions,
    comments,
    boardDecision,
    boardVotes,
    ranking,
    earnings,
    publications,
  ] = await Promise.all([
    User.findById(ownerId).select("name displayName email").lean(),
    SeriesMember.find({ seriesId }).sort({ createdAt: 1 }).populate("userId", "name displayName email role").lean(),
    Manuscript.find({ seriesId }).sort({ version: -1 }).populate("uploadedBy", "name displayName email").lean(),
    Chapter.find({ seriesId }).sort({ chapterNumber: -1 }).lean(),
    Task.find({ seriesId }).sort({ updatedAt: -1 }).populate("assignedTo", "name displayName email").lean(),
    Submission.find({ seriesId }).sort({ createdAt: -1 }).populate("submittedBy", "name displayName email").lean(),
    Comment.find({ seriesId }).sort({ updatedAt: -1 }).populate("authorId", "name displayName email role").lean(),
    BoardDecision.findOne({ seriesId }).lean(),
    BoardVote.find({ seriesId }).lean(),
    Ranking.findOne({ seriesId }).sort({ period: -1 }).lean(),
    AssistantEarning.find({ seriesId }).lean(),
    Publication.find({ seriesId }).lean(),
  ])

  const chapterIds = chapters.map((chapter) => chapter._id)
  const pages = chapterIds.length > 0
    ? await Page.find({ chapterId: { $in: chapterIds } }).sort({ pageNumber: 1 }).lean()
    : []

  const files = await FileAsset.find({ seriesId, status: { $ne: "DELETED" } }).sort({ createdAt: -1 }).lean()

  return {
    owner,
    members,
    manuscripts,
    files,
    chapters,
    pages,
    tasks,
    submissions,
    comments,
    boardDecision,
    boardVotes,
    ranking,
    earnings,
    publications,
  }
}
