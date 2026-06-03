import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type AnnotationStatus = "OPEN" | "RESOLVED";
export type AnnotationType = "RECTANGLE";
export type AnnotationTargetType = "PAGE";

export type Annotation = {
  id: string;
  pageId: string;
  createdBy: string;
  targetType: AnnotationTargetType;
  targetId: string;
  regionId?: string;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  comment?: string;
  status: AnnotationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateAnnotationPayload = {
  x: number;
  y: number;
  width: number;
  height: number;
  comment?: string;
  regionId?: string;
};

export type UpdateAnnotationPayload = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  comment?: string | null;
  regionId?: string | null;
  status?: AnnotationStatus;
};

export async function listAnnotations(token: string, pageId: string): Promise<Annotation[]> {
  const response = await fetch(`${apiBaseUrl}/pages/${pageId}/annotations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Annotation[]>(response, "Failed to list annotations");
}

export async function createAnnotation(
  token: string,
  pageId: string,
  payload: CreateAnnotationPayload
): Promise<Annotation> {
  const response = await fetch(`${apiBaseUrl}/pages/${pageId}/annotations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      targetType: "PAGE",
      targetId: pageId,
      type: "RECTANGLE",
      ...payload
    })
  });
  return parseApiResponse<Annotation>(response, "Failed to create annotation");
}

export async function updateAnnotation(
  token: string,
  annotationId: string,
  payload: UpdateAnnotationPayload
): Promise<Annotation> {
  const response = await fetch(`${apiBaseUrl}/annotations/${annotationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseApiResponse<Annotation>(response, "Failed to update annotation");
}

export async function deleteAnnotation(token: string, annotationId: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/annotations/${annotationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await parseApiResponse<{ deleted: boolean }>(response, "Failed to delete annotation");
  return data.deleted;
}
