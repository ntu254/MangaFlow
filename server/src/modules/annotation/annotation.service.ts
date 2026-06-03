import type { AnnotationRepository } from "./annotation.repository.js";
import type { AnnotationStatus, AnnotationTargetType, AnnotationType } from "./annotation.model.js";

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

export type CreateAnnotationInput = {
  pageId: string;
  createdBy: string;
  targetType?: AnnotationTargetType;
  targetId?: string;
  regionId?: string;
  type?: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  comment?: string;
  status?: AnnotationStatus;
};

export type UpdateAnnotationInput = {
  regionId?: string | null;
  type?: AnnotationType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  comment?: string | null;
  status?: AnnotationStatus;
};

export class AnnotationServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const annotationTypes = new Set<AnnotationType>(["RECTANGLE"]);
const annotationStatuses = new Set<AnnotationStatus>(["OPEN", "RESOLVED"]);
const annotationTargetTypes = new Set<AnnotationTargetType>(["PAGE"]);

function isUnitInterval(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function assertNormalizedBox(input: Pick<CreateAnnotationInput, "x" | "y" | "width" | "height">) {
  if (!isUnitInterval(input.x) || !isUnitInterval(input.y)) {
    throw new AnnotationServiceError("INVALID_COORDINATES", "Annotation coordinates must be normalized from 0 to 1");
  }
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width <= 0 || input.height <= 0) {
    throw new AnnotationServiceError("INVALID_COORDINATES", "Annotation width and height must be greater than 0");
  }
  if (input.width > 1 || input.height > 1 || input.x + input.width > 1 || input.y + input.height > 1) {
    throw new AnnotationServiceError("INVALID_COORDINATES", "Annotation rectangle must stay inside the page bounds");
  }
}

function assertEnums(input: { targetType?: AnnotationTargetType; type?: AnnotationType; status?: AnnotationStatus }) {
  if (input.targetType && !annotationTargetTypes.has(input.targetType)) {
    throw new AnnotationServiceError("INVALID_TARGET_TYPE", "Only PAGE annotations are supported");
  }
  if (input.type && !annotationTypes.has(input.type)) {
    throw new AnnotationServiceError("INVALID_ANNOTATION_TYPE", "Only RECTANGLE annotations are supported");
  }
  if (input.status && !annotationStatuses.has(input.status)) {
    throw new AnnotationServiceError("INVALID_STATUS", "Invalid annotation status");
  }
}

function normalizeComment(comment: string | null | undefined) {
  if (comment === null || comment === undefined) return comment;
  const trimmed = comment.trim();
  if (trimmed.length > 1000) {
    throw new AnnotationServiceError("INVALID_COMMENT", "Annotation comment must be 1000 characters or less");
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createAnnotationService(repository: AnnotationRepository) {
  return {
    async createAnnotation(input: CreateAnnotationInput) {
      if (!input.pageId) {
        throw new AnnotationServiceError("INVALID_PAGE", "Page id is required");
      }
      if (!input.createdBy) {
        throw new AnnotationServiceError("INVALID_USER", "Created by user id is required");
      }
      const targetType = input.targetType ?? "PAGE";
      const targetId = input.targetId ?? input.pageId;
      if (targetType !== "PAGE" || targetId !== input.pageId) {
        throw new AnnotationServiceError("INVALID_TARGET", "Page annotations must target the route page");
      }
      assertEnums(input);
      assertNormalizedBox(input);

      return repository.createAnnotation({
        ...input,
        targetType,
        targetId,
        type: input.type ?? "RECTANGLE",
        status: input.status ?? "OPEN",
        comment: normalizeComment(input.comment) ?? undefined
      });
    },

    async listByPage(pageId: string) {
      return repository.findByPage(pageId);
    },

    async getById(annotationId: string) {
      const annotation = await repository.findById(annotationId);
      if (!annotation) {
        throw new AnnotationServiceError("NOT_FOUND", "Annotation not found", 404);
      }
      return annotation;
    },

    async updateAnnotation(annotationId: string, input: UpdateAnnotationInput) {
      const current = await this.getById(annotationId);
      assertEnums(input);

      const nextBox = {
        x: input.x ?? current.x,
        y: input.y ?? current.y,
        width: input.width ?? current.width,
        height: input.height ?? current.height
      };
      assertNormalizedBox(nextBox);

      const updated = await repository.updateAnnotation(annotationId, {
        ...input,
        comment: normalizeComment(input.comment) as string | null | undefined
      });
      if (!updated) {
        throw new AnnotationServiceError("NOT_FOUND", "Annotation not found for update", 404);
      }
      return updated;
    },

    async deleteAnnotation(annotationId: string) {
      await this.getById(annotationId);
      return repository.deleteAnnotation(annotationId);
    }
  };
}

export type AnnotationService = ReturnType<typeof createAnnotationService>;
