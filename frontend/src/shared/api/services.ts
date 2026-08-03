import { apiRequest } from "./client";

export interface CreateProposalRequest {
  title: string;
  description: string;
  seriesId?: string;
  [key: string]: unknown;
}

export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UpdateSeriesRequest {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CreateRegionRequest {
  chapterId: string;
  pageId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  [key: string]: unknown;
}

export interface UpdateRegionRequest {
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CreateTaskRequest {
  chapterId: string;
  pageId: string;
  title: string;
  type: string;
  assigneeId: string;
  rateCode: string;
  quantity?: number;
  dueAt: string;
  priority: "low" | "normal" | "high";
  instructions: string;
  [key: string]: unknown;
}

export interface UpdateTaskRequest {
  title?: string;
  type?: string;
  assigneeId?: string;
  dueAt?: string;
  priority?: "low" | "normal" | "high";
  instructions?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CreateCommentRequest {
  chapterId: string;
  pageId: string;
  regionId?: string;
  taskId?: string;
  text: string;
  x?: number;
  y?: number;
  isBlocking?: boolean;
  [key: string]: unknown;
}

export interface CreateSubmissionRequest {
  taskId: string;
  expectedCurrentSubmissionId: string | null;
  idempotencyKey?: string;
  fileKey?: string;
  fileName?: string;
  fileUrl?: string;
  note?: string;
  [key: string]: unknown;
}

export interface CreateMaterialRequest {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  proposalId?: string;
  title?: string;
  kind?: string;
  type?: string;
  category?: string;
  description?: string;
  fileKey?: string;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  tags?: string[];
  metadata?: unknown;
  [key: string]: unknown;
}

export interface UpdateMaterialRequest {
  title?: string;
  kind?: string;
  chapterId?: string | null;
  type?: string;
  category?: string;
  description?: string;
  fileKey?: string;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  tags?: string[];
  metadata?: unknown;
  [key: string]: unknown;
}

export interface CreateMaterialVersionRequest {
  fileKey: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface CreateVotingSessionRequest {
  title: string;
  mode: "AD_HOC";
  proposalIds: string[];
  [key: string]: unknown;
}

export interface UpdateVotingSessionRequest {
  title?: string;
  mode?: "AD_HOC" | "SCHEDULED";
  scheduledFor?: string;
  proposalIds?: string[];
  [key: string]: unknown;
}

export interface CastVoteRequest {
  decision: "APPROVE" | "REJECT";
  reason?: string;
  [key: string]: unknown;
}

export interface TieBreakRequest {
  decision: string;
  reason?: string;
  [key: string]: unknown;
}

export interface AtRiskDecisionRequest {
  rankingId: string;
  decision: string;
  note?: string;
  [key: string]: unknown;
}

export interface ImportRankingsRequest {
  csvData?: string;
  rankings?: Array<{ seriesId: string; rank: number; [key: string]: unknown }>;
  source?: string;
  period?: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  password?: string;
  [key: string]: unknown;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  audienceType?: string;
  audienceRole?: string;
  userId?: string;
  priority?: string;
  kind?: string;
  targetRole?: string;
  type?: string;
  [key: string]: unknown;
}

export interface UpdateNotificationRequest {
  targetRole?: string;
  type?: string;
  title?: string;
  message?: string;
  status?: string;
  [key: string]: unknown;
}

export interface OverrideRequest {
  action: string;
  targetId?: string;
  reason: string;
}

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  downloadUrl: string;
  publicUrl?: string;
  method: "PUT";
  headers?: Record<string, string>;
  persistent: boolean;
  storage: "r2" | "metadata-only" | "local";
};

export type FileDisplayUrl = {
  key: string;
  url: string;
  expiresAt: string;
};

export { bootstrapApi, proposalsApi, seriesApi } from "./workflow";
export { studioApi, assistantApi, materialsApi } from "./production";
export { boardApi } from "./governance";
export { adminApi, assistantEarningsApi, notificationsApi } from "./account";
export { rateTableApi } from "./rate-table";
export type {
  CreateRateTableRequest,
  PatchRateTableRequest,
  RateTableEntry,
  RateTableStatus,
} from "./rate-table";
export { filesApi, assistantAiApi } from "./media";
