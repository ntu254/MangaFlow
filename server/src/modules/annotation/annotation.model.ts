import mongoose, { Document, Schema } from "mongoose";

export const annotationTargetTypes = ["PAGE"] as const;
export type AnnotationTargetType = (typeof annotationTargetTypes)[number];

export const annotationTypes = ["RECTANGLE"] as const;
export type AnnotationType = (typeof annotationTypes)[number];

export const annotationStatuses = ["OPEN", "RESOLVED"] as const;
export type AnnotationStatus = (typeof annotationStatuses)[number];

export interface AnnotationDocument extends Document {
  pageId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  targetType: AnnotationTargetType;
  targetId: mongoose.Types.ObjectId;
  regionId?: mongoose.Types.ObjectId;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  comment?: string;
  status: AnnotationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const annotationSchema = new Schema<AnnotationDocument>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: annotationTargetTypes, required: true, default: "PAGE" },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true, sparse: true },
    type: { type: String, enum: annotationTypes, required: true, default: "RECTANGLE" },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    comment: { type: String },
    status: { type: String, enum: annotationStatuses, required: true, default: "OPEN", index: true }
  },
  { timestamps: true }
);

annotationSchema.index({ pageId: 1, createdAt: -1 });

export const AnnotationModel = mongoose.model<AnnotationDocument>("Annotation", annotationSchema);
