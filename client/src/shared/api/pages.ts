import { api } from "./_client";
import type { Region, AIResult, Page, Task } from "@/entities";

const IMG_W = 800;
const IMG_H = 1131;

export interface PageStudioResponse {
  page: Page;
  chapter?: {
    id: string;
    seriesId: string;
  };
  workingFileAsset: any;
  originalFileAsset: any;
  thumbnailFileAsset: any;
  regions: Region[];
  aiResults: AIResult[];
  tasks: Task[];
  feedbackPoints: any[];
  collaborators: PageStudioCollaborator[];
}

export interface PageStudioCollaborator {
  id: string;
  memberId?: string;
  role: string;
  status: string;
  name: string;
  email?: string;
}

type RawRegion = {
  _id?: string;
  id?: string;
  pageId: string;
  type: string;
  status: string;
  source?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  coords?: Region["coords"];
  aiResultId?: string;
};

type RawAIResult = {
  _id?: string;
  id?: string;
  pageId: string;
  status: string;
  requestedBy: string;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
  suggestions?: Array<{
    suggestionIndex: number;
    type: string;
    bbox: { x: number; y: number; width: number; height: number };
    decision: string;
    regionId?: string;
  }>;
};

type RawCollaborator = {
  _id?: string;
  id?: string;
  memberId?: string;
  role?: string;
  status?: string;
  name?: string;
  displayName?: string;
  email?: string;
};

type RawTask = {
  _id?: string;
  id?: string;
  seriesId?: unknown;
  chapterId?: unknown;
  pageId?: unknown;
  regionId?: unknown;
  taskTypeId?:
    | string
    | { _id?: string; id?: string; name?: string; code?: string; baseRate?: number };
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?:
    | string
    | { _id?: string; id?: string; name?: string; displayName?: string; email?: string };
  assignedBy?: string | { _id?: string; id?: string };
  baseRate?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as { _id?: string; id?: string; toString?: () => string };
    return record.id ?? record._id ?? record.toString?.() ?? "";
  }
  return String(value);
}

function kebab(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeBbox(
  bbox: { x: number; y: number; width: number; height: number } | undefined,
): Region["coords"] {
  if (!bbox) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  const isAlreadyNormalized =
    bbox.x >= 0 &&
    bbox.y >= 0 &&
    bbox.width >= 0 &&
    bbox.height >= 0 &&
    bbox.x <= 1 &&
    bbox.y <= 1 &&
    bbox.width <= 1 &&
    bbox.height <= 1;

  if (isAlreadyNormalized) {
    return {
      x: clamp01(bbox.x),
      y: clamp01(bbox.y),
      w: clamp01(bbox.width),
      h: clamp01(bbox.height),
    };
  }

  return {
    x: clamp01(bbox.x / IMG_W),
    y: clamp01(bbox.y / IMG_H),
    w: clamp01(bbox.width / IMG_W),
    h: clamp01(bbox.height / IMG_H),
  };
}

function normalizeRegion(region: RawRegion): Region {
  const bbox = region.bbox;
  return {
    id: normalizeId(region.id ?? region._id),
    pageId: normalizeId(region.pageId),
    status: kebab(region.status) as Region["status"],
    type: kebab(region.type) as Region["type"],
    coords: region.coords ?? normalizeBbox(bbox),
    source: kebab(region.source ?? "manual") as Region["source"],
    aiResultId: region.aiResultId ? normalizeId(region.aiResultId) : undefined,
  };
}

function normalizeAIResult(result: RawAIResult): AIResult {
  const suggestions = result.suggestions ?? [];
  return {
    id: normalizeId(result.id ?? result._id),
    pageId: normalizeId(result.pageId),
    status: kebab(result.status) as AIResult["status"],
    requestedBy: normalizeId(result.requestedBy),
    at: result.createdAt ? new Date(result.createdAt).toLocaleString() : "",
    suggestionsCount: suggestions.length,
    acceptedCount: suggestions.filter(
      (suggestion) => suggestion.decision?.toUpperCase() === "ACCEPTED",
    ).length,
    note: result.error,
  };
}

function normalizeCollaborator(collaborator: RawCollaborator): PageStudioCollaborator {
  return {
    id: normalizeId(collaborator.id ?? collaborator._id),
    memberId: collaborator.memberId,
    role: collaborator.role ?? "ASSISTANT",
    status: collaborator.status ?? "ACTIVE",
    name: collaborator.displayName ?? collaborator.name ?? collaborator.email ?? "Assistant",
    email: collaborator.email,
  };
}

function normalizeTaskStatus(status?: string): Task["status"] {
  switch (status) {
    case "IN_PROGRESS":
      return "in-progress";
    case "SUBMITTED":
      return "submitted";
    case "MANGAKA_APPROVED":
      return "mangaka-approved";
    case "EDITOR_APPROVED":
      return "editor-approved";
    case "REVISION_REQUESTED":
      return "revision-requested";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "TODO":
    default:
      return "todo";
  }
}

function normalizeTaskPriority(priority?: string): Task["priority"] {
  if (priority === "HIGH" || priority === "URGENT") return "high";
  if (priority === "LOW") return "low";
  return "medium";
}

function normalizeTaskType(task: RawTask): Task["type"] {
  const taskType = typeof task.taskTypeId === "string" ? undefined : task.taskTypeId;
  const source =
    `${taskType?.name ?? ""} ${taskType?.code ?? ""} ${task.title ?? ""}`.toLowerCase();
  if (source.includes("tone")) return "Tone";
  if (source.includes("background")) return "Background";
  if (source.includes("letter")) return "Lettering";
  if (source.includes("fx") || source.includes("sfx")) return "FX";
  return "Linework";
}

function formatTaskDeadline(dueDate?: string): string {
  if (!dueDate) return "No due date";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeTask(task: RawTask): Task {
  const assignedTo = task.assignedTo;
  const assignedBy = task.assignedBy;
  const taskType = typeof task.taskTypeId === "string" ? undefined : task.taskTypeId;
  const pageId = normalizeId(task.pageId);

  return {
    id: normalizeId(task.id ?? task._id),
    seriesId: normalizeId(task.seriesId),
    chapterId: normalizeId(task.chapterId),
    type: normalizeTaskType(task),
    assigneeId:
      typeof assignedTo === "string" ? assignedTo : normalizeId(assignedTo?.id ?? assignedTo?._id),
    assigneeName:
      typeof assignedTo === "string"
        ? "Assigned assistant"
        : (assignedTo?.displayName ??
          assignedTo?.name ??
          assignedTo?.email ??
          "Assigned assistant"),
    pageRange: pageId ? `Page ${pageId}` : "Full Chapter",
    deadline: formatTaskDeadline(task.dueDate),
    payout: task.baseRate ?? taskType?.baseRate ?? 0,
    status: normalizeTaskStatus(task.status),
    title: task.title,
    priority: normalizeTaskPriority(task.priority),
    assignedById:
      typeof assignedBy === "string" ? assignedBy : normalizeId(assignedBy?.id ?? assignedBy?._id),
    instruction: task.description,
    description: task.description,
    pageId,
    regionId: normalizeId(task.regionId),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function aiSuggestionRegions(result: RawAIResult): Region[] {
  const aiResultId = normalizeId(result.id ?? result._id);
  const pageId = normalizeId(result.pageId);
  return (result.suggestions ?? [])
    .filter(
      (suggestion) => suggestion.decision?.toUpperCase() === "PENDING" && !suggestion.regionId,
    )
    .map((suggestion) => ({
      id: `${aiResultId}:suggestion:${suggestion.suggestionIndex}`,
      pageId,
      status: "ai-suggested",
      type: kebab(suggestion.type) as Region["type"],
      coords: normalizeBbox(suggestion.bbox),
      source: "ai",
      aiResultId,
      aiSuggestionIndex: suggestion.suggestionIndex,
    }));
}

export async function getPageStudio(pageId: string): Promise<PageStudioResponse> {
  const { data } = await api.get<{ data: PageStudioResponse }>(`/pages/${pageId}/studio`);
  const rawAIResults = (data.data.aiResults ?? []) as unknown as RawAIResult[];
  return {
    ...data.data,
    page: {
      ...data.data.page,
      id: normalizeId((data.data.page as any).id ?? (data.data.page as any)._id),
      chapterId: normalizeId(data.data.page.chapterId),
    },
    chapter: data.data.chapter
      ? {
          id: normalizeId((data.data.chapter as any).id ?? (data.data.chapter as any)._id),
          seriesId: normalizeId(data.data.chapter.seriesId),
        }
      : undefined,
    regions: [
      ...((data.data.regions ?? []) as unknown as RawRegion[]).map(normalizeRegion),
      ...rawAIResults.flatMap(aiSuggestionRegions),
    ],
    aiResults: rawAIResults.map(normalizeAIResult),
    tasks: ((data.data.tasks ?? []) as unknown as RawTask[]).map(normalizeTask),
    collaborators: ((data.data.collaborators ?? []) as unknown as RawCollaborator[]).map(
      normalizeCollaborator,
    ),
  };
}

export async function runAISegmentation(pageId: string): Promise<AIResult> {
  const { data } = await api.post<{ data: AIResult }>(`/files/pages/${pageId}/ai/segment`);
  return data.data;
}

export async function runAITextWhitening(pageId: string): Promise<any> {
  const { data } = await api.post<{ data: any }>(`/files/pages/${pageId}/ai/whiten-text`);
  return data.data;
}

export async function acceptAISuggestion(
  aiResultId: string,
  suggestionIndex: number,
): Promise<any> {
  const { data } = await api.post<{ data: any }>(`/files/ai-results/${aiResultId}/accept-region`, {
    suggestionIndex,
  });
  return data.data;
}

export async function rejectAISuggestion(
  aiResultId: string,
  suggestionIndex: number,
): Promise<any> {
  const { data } = await api.post<{ data: any }>(`/files/ai-results/${aiResultId}/reject-region`, {
    suggestionIndex,
  });
  return data.data;
}
