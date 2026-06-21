import { api } from "./_client";
import type { Region, AIResult, Page } from "@/entities";

const IMG_W = 800;
const IMG_H = 1131;

export interface PageStudioResponse {
  page: Page;
  workingFileAsset: any;
  originalFileAsset: any;
  thumbnailFileAsset: any;
  regions: Region[];
  aiResults: AIResult[];
  tasks: any[];
  feedbackPoints: any[];
  collaborators: any[];
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

function normalizeRegion(region: RawRegion): Region {
  const bbox = region.bbox;
  return {
    id: normalizeId(region.id ?? region._id),
    pageId: normalizeId(region.pageId),
    status: kebab(region.status) as Region["status"],
    type: kebab(region.type) as Region["type"],
    coords: region.coords ?? {
      x: bbox ? bbox.x / IMG_W : 0,
      y: bbox ? bbox.y / IMG_H : 0,
      w: bbox ? bbox.width / IMG_W : 0,
      h: bbox ? bbox.height / IMG_H : 0,
    },
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
    acceptedCount: suggestions.filter((suggestion) => suggestion.decision === "ACCEPTED").length,
    note: result.error,
  };
}

function aiSuggestionRegions(result: RawAIResult): Region[] {
  const aiResultId = normalizeId(result.id ?? result._id);
  const pageId = normalizeId(result.pageId);
  return (result.suggestions ?? [])
    .filter((suggestion) => suggestion.decision === "PENDING" && !suggestion.regionId)
    .map((suggestion) => ({
      id: `${aiResultId}:suggestion:${suggestion.suggestionIndex}`,
      pageId,
      status: "ai-suggested",
      type: kebab(suggestion.type) as Region["type"],
      coords: {
        x: suggestion.bbox.x / IMG_W,
        y: suggestion.bbox.y / IMG_H,
        w: suggestion.bbox.width / IMG_W,
        h: suggestion.bbox.height / IMG_H,
      },
      source: "ai",
      aiResultId,
    }));
}

export async function getPageStudio(pageId: string): Promise<PageStudioResponse> {
  const { data } = await api.get<{ data: PageStudioResponse }>(`/pages/${pageId}/studio`);
  const rawAIResults = data.data.aiResults as unknown as RawAIResult[];
  return {
    ...data.data,
    page: {
      ...data.data.page,
      id: normalizeId((data.data.page as any).id ?? (data.data.page as any)._id),
      chapterId: normalizeId(data.data.page.chapterId),
    },
    regions: [
      ...(data.data.regions as unknown as RawRegion[]).map(normalizeRegion),
      ...rawAIResults.flatMap(aiSuggestionRegions),
    ],
    aiResults: rawAIResults.map(normalizeAIResult),
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
