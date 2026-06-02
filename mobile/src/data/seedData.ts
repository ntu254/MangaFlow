import type {
  CommentItem,
  NotificationItem,
  RankingItem,
  ReadinessItem,
  ReviewItem,
  SeriesSummary
} from "../types";

export const editorSeries: SeriesSummary[] = [
  {
    id: "series-aurora-ink",
    title: "Aurora Ink",
    mangaka: "Hana Mori",
    genre: ["Fantasy", "Drama"],
    status: "EDITOR_REVIEW",
    currentChapter: "Chapter 12",
    progress: 72,
    ranking: 8,
    risk: "NORMAL",
    editorRecommendation: "Strong pacing; page 18 needs comment verification.",
    submittedAt: "2026-06-02",
    voteProgress: "0/5"
  },
  {
    id: "series-paper-moon",
    title: "Paper Moon Arcade",
    mangaka: "Kaito Ren",
    genre: ["Comedy", "Slice of Life"],
    status: "READY_FOR_PUBLICATION",
    currentChapter: "Chapter 7",
    progress: 94,
    ranking: 14,
    risk: "WARNING",
    editorRecommendation: "Ready if final comment queue is cleared.",
    submittedAt: "2026-06-01",
    voteProgress: "0/5"
  }
];

export const urgentReviews: ReviewItem[] = [
  {
    id: "review-manuscript-1",
    type: "MANUSCRIPT",
    title: "Manuscript v3 summary",
    seriesTitle: "Aurora Ink",
    dueLabel: "Due in 6h",
    status: "EDITOR_REVIEW",
    priority: "high"
  },
  {
    id: "review-page-18",
    type: "PAGE",
    title: "Page 18 final approval",
    seriesTitle: "Paper Moon Arcade",
    dueLabel: "Due today",
    status: "NEEDS_COMMENT_CHECK",
    priority: "high"
  },
  {
    id: "review-comment-4",
    type: "COMMENT",
    title: "Verify fixed lettering comment",
    seriesTitle: "Aurora Ink",
    dueLabel: "Tomorrow",
    status: "VERIFIED_BY_MANGAKA",
    priority: "normal"
  }
];

export const editorComments: CommentItem[] = [
  {
    id: "comment-1",
    seriesTitle: "Aurora Ink",
    pageLabel: "Chapter 12 / Page 18",
    status: "VERIFIED_BY_MANGAKA",
    text: "Speech bubble cleanup confirmed by Mangaka. Needs editor resolve."
  },
  {
    id: "comment-2",
    seriesTitle: "Paper Moon Arcade",
    pageLabel: "Chapter 7 / Page 09",
    status: "OPEN",
    text: "Panel border overlaps assistant cleanup area."
  }
];

export const publicationReadiness: ReadinessItem[] = [
  { label: "All pages uploaded", complete: true },
  { label: "All tasks approved", complete: true },
  { label: "All comments resolved", complete: false },
  { label: "Editor final approval", complete: true },
  { label: "Publication date set", complete: true }
];

export const boardSeries: SeriesSummary[] = [
  {
    id: "series-star-lantern",
    title: "Star Lantern Guild",
    mangaka: "Mio Tachibana",
    genre: ["Adventure", "Fantasy"],
    status: "BOARD_REVIEW",
    currentChapter: "Pilot",
    progress: 61,
    ranking: 5,
    risk: "NORMAL",
    editorRecommendation: "Approve for monthly run. Strong concept and clean production scope.",
    submittedAt: "2026-06-02",
    voteProgress: "3/5"
  },
  {
    id: "series-silent-rain",
    title: "Silent Rain Room",
    mangaka: "Ren Sato",
    genre: ["Mystery"],
    status: "AT_RISK",
    currentChapter: "Chapter 21",
    progress: 48,
    ranking: 27,
    risk: "AT_RISK",
    editorRecommendation: "Needs improvement plan before continuing.",
    submittedAt: "2026-05-30",
    voteProgress: "2/5"
  }
];

export const rankings: RankingItem[] = [
  {
    id: "ranking-1",
    rank: 1,
    previousRank: 2,
    seriesTitle: "Star Lantern Guild",
    voteCount: 18200,
    readerScore: 9.1,
    status: "NORMAL"
  },
  {
    id: "ranking-2",
    rank: 12,
    previousRank: 9,
    seriesTitle: "Aurora Ink",
    voteCount: 7400,
    readerScore: 7.8,
    status: "WARNING"
  },
  {
    id: "ranking-3",
    rank: 27,
    previousRank: 21,
    seriesTitle: "Silent Rain Room",
    voteCount: 2100,
    readerScore: 5.6,
    status: "AT_RISK"
  }
];

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Tie-break required",
    message: "Star Lantern Guild has a vote deadlock waiting for chair action.",
    priority: "high",
    unread: true
  },
  {
    id: "notif-2",
    title: "Publication blocker",
    message: "Paper Moon Arcade still has unresolved comments.",
    priority: "high",
    unread: true
  },
  {
    id: "notif-3",
    title: "Ranking warning",
    message: "Silent Rain Room entered at-risk review for this period.",
    priority: "normal",
    unread: false
  }
];

