import type { Role } from "@/shared/auth";

export type ProposalStatus =
  | "DRAFT"
  | "PENDING_EDITOR"
  | "EDITOR_REVIEWING"
  | "CHANGES_REQUESTED"
  | "BOARD_REVIEW"
  | "PENDING_BOARD"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

/**
 * UI group mapping — maps canonical backend statuses to simplified display groups.
 * Backend keeps all 13 statuses; UI only shows these 8 groups.
 */
export type ProposalUIGroup =
  | "draft"
  | "editor_review"
  | "need_changes"
  | "board_review"
  | "approved"
  | "rejected"
  | "archived";

export const PROPOSAL_TO_UI_GROUP: Record<ProposalStatus, ProposalUIGroup> = {
  DRAFT: "draft",
  PENDING_EDITOR: "editor_review",
  EDITOR_REVIEWING: "editor_review",
  CHANGES_REQUESTED: "need_changes",
  BOARD_REVIEW: "board_review",
  PENDING_BOARD: "board_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "rejected",
  ARCHIVED: "archived",
};

export const PROPOSAL_UI_GROUP_LABEL: Record<ProposalUIGroup, string> = {
  draft: "Draft",
  editor_review: "Editor Review",
  need_changes: "Need Changes",
  board_review: "Board Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export type ProposalAction =
  | "SUBMIT"
  | "WITHDRAW"
  | "EDIT"
  | "CLAIM"
  | "RELEASE_CLAIM"
  | "REQUEST_CHANGES"
  | "RESUBMIT"
  | "FORWARD"
  | "REJECT"
  | "RECALL"
  | "VOTE"
;

export type VoteDecision = "APPROVE" | "REJECT";

export type BoardVote = {
  voterId: string;
  voterName: string;
  decision: VoteDecision;
  comment?: string;
  createdAt: string;
  weight?: number;
  isChair?: boolean;
};

export type ProposalEvent = {
  id: string;
  proposalId: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  type:
    | "CREATE"
    | "SUBMIT"
    | "REQUEST_CHANGES"
    | "RESUBMIT"
    | "FORWARD"
    | "RECALL"
    | "REJECT"
    | "VOTE"
    | "DECIDE"
    | "WITHDRAW"
    | "CLAIM"
    | "RELEASE_CLAIM"
    | "EDIT"
    | "MANUSCRIPT_UPLOAD"
;
  fromStatus?: ProposalStatus;
  toStatus?: ProposalStatus;
  comment?: string;
  createdAt: string;
};

export type ManuscriptVersion = {
  id: string;
  version: number;
  fileKey?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  sizeKB: number;
  pageCount?: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  note?: string;
  supersedes?: string;
};

export type SupportingMaterialKind = "character" | "world" | "reference" | "storyboard" | "other";

export type SupportingMaterial = {
  id: string;
  kind: SupportingMaterialKind;
  title: string;
  fileKey?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  sizeKB: number;
  uploadedAt: string;
  note?: string;
};

export type RequestedChangeItem = {
  id: string;
  text: string;
  resolved: boolean;
  response?: string;
};

export type RequestedChange = {
  id: string;
  editorId: string;
  editorName: string;
  items: RequestedChangeItem[];
  comment: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedInVersion?: number;
};

export type EditorialChecklist = {
  hook: boolean;
  characterMotivation: boolean;
  audienceFit: boolean;
  storyboardFlow: boolean;
  manuscriptQuality: boolean;
  serializePotential: boolean;
  completedById?: string;
  completedByName?: string;
  updatedAt?: string;
};

export type SeriesProposal = {
  id: string;
  slug: string;
  title: string;
  authorId: string;
  authorName: string;
  synopsis: string;
  genres: string[];
  targetAudience: "shounen" | "seinen" | "shoujo" | "josei";
  chaptersPlanned: number;
  coverUrl: string;
  coverFileKey?: string;
  sampleChapterUrl: string;
  requestedPublicationType?: "WEEKLY" | "MONTHLY";
  editorSuggestedPublicationType?: "WEEKLY" | "MONTHLY";
  publicationType?: "WEEKLY" | "MONTHLY";
  status: ProposalStatus;
  assignedEditorId?: string;
  assignedEditorName?: string;
  claimedByEditorId?: string | null;
  claimedByEditorName?: string | null;
  claimedAt?: string | null;
  reviewStartedAt?: string | null;
  editorialChecklist?: EditorialChecklist;
  editorDecisionNote?: string | null;
  editorForwardedAt?: string | null;
  votes: BoardVote[];
  history: ProposalEvent[];
  manuscripts: ManuscriptVersion[];
  materials: SupportingMaterial[];
  requestedChanges: RequestedChange[];
  revisionRound: number;
  createdAt: string;
  updatedAt: string;
  // MVP wizard additions ΓÇö all optional, backward compatible
  logline?: string;
  hook?: string;
  mainCharacters?: string;
  originalWorkConfirmed?: boolean;
  submissionNote?: string;
  advanced?: {
    worldSetting?: string;
    seriesDirection?: string;
    productionPlan?: string;
    assistantNeeds?: string;
    comparableTitles?: string;
    aiDisclosure?: string;
  };
};

export type ProposalVersion = {
  id: string;
  proposalId: string;
  proposalVersionId: string;
  versionNumber?: number;
  status: "DRAFT" | "FROZEN" | "SUPERSEDED";
  source: "PROPOSAL" | "VOTING_SESSION" | "MIGRATION";
  snapshot?: Record<string, unknown>;
  frozenById?: string;
  frozenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BoardTallySnapshot = {
  approve: number;
  reject: number;
  total: number;
  status: ProposalStatus | null;
  reason: string;
};

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  PENDING_EDITOR: "Awaiting Editor",
  EDITOR_REVIEWING: "Editor Reviewing",
  CHANGES_REQUESTED: "Changes Requested",
  BOARD_REVIEW: "Board Review",
  PENDING_BOARD: "Pending Board",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ARCHIVED: "Archived",
};

export const STATUS_FLOW: ProposalStatus[] = [
  "DRAFT",
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "PENDING_BOARD",
  "BOARD_REVIEW",
  "APPROVED",
];

export const BOARD_TOTAL = 5;
export const AUDIENCE_LABEL: Record<SeriesProposal["targetAudience"], string> = {
  shounen: "Shounen",
  seinen: "Seinen",
  shoujo: "Shoujo",
  josei: "Josei",
};

export const MATERIAL_KIND_LABEL: Record<SupportingMaterialKind, string> = {
  character: "Character sheet",
  world: "World bible",
  reference: "Reference",
  storyboard: "Storyboard / Name",
  other: "Other",
};

export const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Historical",
  "Psychological",
] as const;
