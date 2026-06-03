import mongoose from "mongoose";
import { AnnotationModel, type AnnotationDocument } from "./annotation.model.js";
import type { Annotation, CreateAnnotationInput, UpdateAnnotationInput } from "./annotation.service.js";

function serializeAnnotation(document: AnnotationDocument & { _id: unknown }): Annotation {
  return {
    id: String(document._id),
    pageId: String(document.pageId),
    createdBy: String(document.createdBy),
    targetType: document.targetType,
    targetId: String(document.targetId),
    regionId: document.regionId ? String(document.regionId) : undefined,
    type: document.type,
    x: document.x,
    y: document.y,
    width: document.width,
    height: document.height,
    comment: document.comment,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoAnnotationRepository() {
  return {
    async createAnnotation(data: CreateAnnotationInput): Promise<Annotation> {
      const annotation = await AnnotationModel.create({
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
      return serializeAnnotation(annotation);
    },

    async findByPage(pageId: string): Promise<Annotation[]> {
      if (!mongoose.isValidObjectId(pageId)) return [];
      const annotations = await AnnotationModel.find({ pageId }).sort({ createdAt: -1 });
      return annotations.map(serializeAnnotation);
    },

    async findById(annotationId: string): Promise<Annotation | null> {
      if (!mongoose.isValidObjectId(annotationId)) return null;
      const annotation = await AnnotationModel.findById(annotationId);
      return annotation ? serializeAnnotation(annotation) : null;
    },

    async updateAnnotation(annotationId: string, data: UpdateAnnotationInput): Promise<Annotation | null> {
      if (!mongoose.isValidObjectId(annotationId)) return null;
      const updateData: Record<string, unknown> = {};
      if (data.regionId !== undefined) updateData.regionId = data.regionId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.x !== undefined) updateData.x = data.x;
      if (data.y !== undefined) updateData.y = data.y;
      if (data.width !== undefined) updateData.width = data.width;
      if (data.height !== undefined) updateData.height = data.height;
      if (data.comment !== undefined) updateData.comment = data.comment;
      if (data.status !== undefined) updateData.status = data.status;

      const annotation = await AnnotationModel.findByIdAndUpdate(annotationId, { $set: updateData }, { new: true });
      return annotation ? serializeAnnotation(annotation) : null;
    },

    async deleteAnnotation(annotationId: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(annotationId)) return false;
      const result = await AnnotationModel.deleteOne({ _id: annotationId });
      return result.deletedCount > 0;
    }
  };
}

export type AnnotationRepository = ReturnType<typeof createMongoAnnotationRepository>;
