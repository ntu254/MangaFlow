export type MobileRole = "EDITOR" | "BOARD";

export type EditorTab = "Home" | "Series" | "Reviews" | "Publication" | "Notifications";
export type BoardTab = "Home" | "Approvals" | "Ranking" | "Decisions" | "Notifications";
export type MobileTab = EditorTab | BoardTab;

export type SeriesStatus =
  | "EDITOR_REVIEW"
  | "BOARD_REVIEW"
  | "READY_FOR_PUBLICATION"
  | "AT_RISK"
  | "APPROVED";

export type CommentStatus =
  | "OPEN"
  | "FIXED_BY_ASSISTANT"
  | "VERIFIED_BY_MANGAKA"
  | "RESOLVED_BY_EDITOR";

export type VoteChoice = "APPROVE" | "REJECT" | "NEEDS_REVISION";

export type SeriesSummary = {
  id: string;
  title: string;
  mangaka: string;
  genre: string[];
  status: SeriesStatus;
  currentChapter: string;
  progress: number;
  ranking: number;
  risk: "NORMAL" | "WARNING" | "AT_RISK";
  editorRecommendation: string;
  submittedAt: string;
  voteProgress: string;
};

export type ReviewItem = {
  id: string;
  type: "MANUSCRIPT" | "PAGE" | "COMMENT";
  title: string;
  seriesTitle: string;
  dueLabel: string;
  status: string;
  priority: "normal" | "high";
};

export type CommentItem = {
  id: string;
  seriesTitle: string;
  pageLabel: string;
  status: CommentStatus;
  text: string;
};

export type ReadinessItem = {
  label: string;
  complete: boolean;
};

export type RankingItem = {
  id: string;
  rank: number;
  previousRank: number;
  seriesTitle: string;
  voteCount: number;
  readerScore: number;
  status: "NORMAL" | "WARNING" | "AT_RISK";
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "high";
  unread: boolean;
};

