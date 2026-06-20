import { api } from "./_client";
import type { Region, AIResult, Page } from "@/entities";

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

export async function getPageStudio(pageId: string): Promise<PageStudioResponse> {
  const { data } = await api.get<{ data: PageStudioResponse }>(`/pages/${pageId}/studio`);
  return data.data;
}

export async function runAISegmentation(pageId: string): Promise<AIResult> {
  const { data } = await api.post<{ data: AIResult }>(`/files/pages/${pageId}/ai/segment`);
  return data.data;
}
