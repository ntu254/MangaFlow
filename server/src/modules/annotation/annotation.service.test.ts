import { describe, expect, it } from "vitest";
import type { AnnotationRepository } from "./annotation.repository.js";
import { createAnnotationService, type Annotation, type CreateAnnotationInput, type UpdateAnnotationInput } from "./annotation.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: overrides.id ?? "annotation_1",
    pageId: overrides.pageId ?? "page_1",
    createdBy: overrides.createdBy ?? "user_1",
    targetType: overrides.targetType ?? "PAGE",
    targetId: overrides.targetId ?? overrides.pageId ?? "page_1",
    regionId: overrides.regionId,
    type: overrides.type ?? "RECTANGLE",
    x: overrides.x ?? 0.1,
    y: overrides.y ?? 0.2,
    width: overrides.width ?? 0.3,
    height: overrides.height ?? 0.4,
    comment: overrides.comment,
    status: overrides.status ?? "OPEN",
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Annotation[] = []) {
  const annotations = new Map(seed.map((annotation) => [annotation.id, annotation]));

  const repository: AnnotationRepository = {
    async createAnnotation(data: CreateAnnotationInput) {
      const annotation = createAnnotation({
        id: `annotation_${annotations.size + 1}`,
        pageId: data.pageId,
        createdBy: data.createdBy,
        targetType: data.targetType ?? "PAGE",
        targetId: data.targetId ?? data.pageId,
        regionId: data.regionId,
        type: data.type ?? "RECTANGLE",
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        comment: data.comment,
        status: data.status ?? "OPEN"
      });
      annotations.set(annotation.id, annotation);
      return annotation;
    },
    async findByPage(pageId) {
      return [...annotations.values()].filter((annotation) => annotation.pageId === pageId);
    },
    async findById(annotationId) {
      return annotations.get(annotationId) ?? null;
    },
    async updateAnnotation(annotationId, data: UpdateAnnotationInput) {
      const current = annotations.get(annotationId);
      if (!current) return null;
      const updated = {
        ...current,
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        updatedAt: now
      } as Annotation;
      if (data.regionId === null) updated.regionId = undefined;
      if (data.comment === null) updated.comment = undefined;
      annotations.set(annotationId, updated);
      return updated;
    },
    async deleteAnnotation(annotationId) {
      return annotations.delete(annotationId);
    }
  };

  return { repository, annotations };
}

describe("annotation service", () => {
  it("creates page rectangle annotations with defaults and trimmed comments", async () => {
    const { repository } = createRepository();
    const service = createAnnotationService(repository);

    await expect(
      service.createAnnotation({
        pageId: "page_1",
        createdBy: "user_1",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
        comment: "  Dialogue bubble needs revision  "
      })
    ).resolves.toMatchObject({
      targetType: "PAGE",
      targetId: "page_1",
      type: "RECTANGLE",
      status: "OPEN",
      comment: "Dialogue bubble needs revision"
    });
  });

  it("rejects non-page targets, invalid statuses, and out-of-bounds coordinates", async () => {
    const { repository } = createRepository();
    const service = createAnnotationService(repository);
    const input: CreateAnnotationInput = {
      pageId: "page_1",
      createdBy: "user_1",
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5
    };

    await expect(service.createAnnotation({ ...input, targetId: "other_page" })).rejects.toMatchObject({
      code: "INVALID_TARGET"
    });
    await expect(service.createAnnotation({ ...input, status: "DONE" as "OPEN" })).rejects.toMatchObject({
      code: "INVALID_STATUS"
    });
    await expect(service.createAnnotation({ ...input, x: 0.9, width: 0.2 })).rejects.toMatchObject({
      code: "INVALID_COORDINATES"
    });
  });

  it("validates merged update coordinates and deletes existing annotations", async () => {
    const { repository, annotations } = createRepository([createAnnotation({ id: "annotation_existing", width: 0.4 })]);
    const service = createAnnotationService(repository);

    await expect(service.updateAnnotation("annotation_existing", { x: 0.3, width: 0.5, status: "RESOLVED" })).resolves.toMatchObject({
      x: 0.3,
      width: 0.5,
      status: "RESOLVED"
    });
    await expect(service.updateAnnotation("annotation_existing", { x: 0.9 })).rejects.toMatchObject({
      code: "INVALID_COORDINATES"
    });
    await expect(service.deleteAnnotation("annotation_existing")).resolves.toBe(true);
    expect(annotations.has("annotation_existing")).toBe(false);
  });

  it("returns not found errors for missing annotations", async () => {
    const { repository } = createRepository();
    const service = createAnnotationService(repository);

    await expect(service.getById("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404
    });
  });
});
