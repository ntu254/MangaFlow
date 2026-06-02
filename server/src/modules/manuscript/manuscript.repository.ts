import mongoose from "mongoose";
import { ManuscriptModel, type ManuscriptDocument, type ManuscriptStatus } from "./manuscript.model.js";
import type { Manuscript, CreateManuscriptInput } from "./manuscript.service.js";

function serializeManuscript(document: ManuscriptDocument & { _id: unknown }): Manuscript {
  return {
    id: String(document._id),
    seriesId: String(document.seriesId),
    uploadedBy: String(document.uploadedBy),
    title: document.title,
    description: document.description,
    fileUrls: document.fileUrls,
    previewUrls: document.previewUrls,
    currentVersion: document.currentVersion,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function createMongoManuscriptRepository() {
  return {
    async createManuscript(data: CreateManuscriptInput & { uploadedBy: string }) {
      const manuscript = await ManuscriptModel.create({
        seriesId: data.seriesId,
        uploadedBy: data.uploadedBy,
        title: data.title,
        description: data.description,
        fileUrls: data.fileUrls,
        status: "DRAFT",
        currentVersion: 1
      });
      return serializeManuscript(manuscript);
    },

    async findManuscriptsBySeries(seriesId: string) {
      if (!mongoose.isValidObjectId(seriesId)) return [];
      const manuscripts = await ManuscriptModel.find({ seriesId }).sort({ createdAt: -1 });
      return manuscripts.map(serializeManuscript);
    },

    async findById(manuscriptId: string) {
      if (!mongoose.isValidObjectId(manuscriptId)) return null;
      const manuscript = await ManuscriptModel.findById(manuscriptId);
      return manuscript ? serializeManuscript(manuscript) : null;
    },

    async updateStatus(manuscriptId: string, status: ManuscriptStatus) {
      if (!mongoose.isValidObjectId(manuscriptId)) return null;
      const manuscript = await ManuscriptModel.findByIdAndUpdate(
        manuscriptId,
        { $set: { status } },
        { new: true }
      );
      return manuscript ? serializeManuscript(manuscript) : null;
    }
  };
}

export type ManuscriptRepository = ReturnType<typeof createMongoManuscriptRepository>;
