import mongoose from "mongoose";
import type { PublicationStatus } from "../../types.js";
import { looseSchema } from "../schema.js";

export type PublicationRecord = {
  id: string;
  seriesId: string;
  chapterId: string;
  status: PublicationStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  scheduledById?: string;
  publishedById?: string;
  createdAt: Date;
  updatedAt: Date;
};

const publicationSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  chapterId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    required: true,
    enum: ["DRAFT", "SCHEDULED", "PUBLISHED", "CANCELLED"],
    default: "DRAFT",
    index: true,
  },
  scheduledAt: { type: Date, index: true },
  publishedAt: { type: Date, index: true },
  scheduledById: { type: String },
  publishedById: { type: String },
});

publicationSchema.index({ status: 1, scheduledAt: 1 });
publicationSchema.index({ seriesId: 1, status: 1 });

export const PublicationModel = mongoose.model<any>("Publication", publicationSchema);
