import mongoose from "mongoose";
import { PageModel, type PageDocument, type PageStatus } from "./page.model.js";
import type { Page, CreatePageInput, UpdatePageInput } from "./page.service.js";

function serializePage(document: PageDocument & { _id: unknown }): Page {
  return {
    id: String(document._id),
    chapterId: String(document.chapterId),
    pageNumber: document.pageNumber,
    originalFileUrl: document.originalFileUrl,
    previewUrl: document.previewUrl,
    thumbnailUrl: document.thumbnailUrl,
    processedFileUrl: document.processedFileUrl,
    width: document.width,
    height: document.height,
    currentVersion: document.currentVersion,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function createMongoPageRepository() {
  return {
    async createPage(data: CreatePageInput) {
      const page = await PageModel.create({
        chapterId: data.chapterId,
        pageNumber: data.pageNumber,
        originalFileUrl: data.originalFileUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        processedFileUrl: data.processedFileUrl,
        width: data.width ?? 1200,
        height: data.height ?? 1600,
        currentVersion: 1,
        status: "UPLOADED"
      });
      return serializePage(page);
    },

    async findPagesByChapter(chapterId: string) {
      if (!mongoose.isValidObjectId(chapterId)) return [];
      const pages = await PageModel.find({ chapterId }).sort({ pageNumber: 1 });
      return pages.map(serializePage);
    },

    async findById(pageId: string) {
      if (!mongoose.isValidObjectId(pageId)) return null;
      const page = await PageModel.findById(pageId);
      return page ? serializePage(page) : null;
    },

    async updatePage(pageId: string, data: UpdatePageInput) {
      if (!mongoose.isValidObjectId(pageId)) return null;
      const updateData: any = {};
      if (data.pageNumber !== undefined) updateData.pageNumber = data.pageNumber;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.originalFileUrl !== undefined) updateData.originalFileUrl = data.originalFileUrl;
      if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl;
      if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
      if (data.processedFileUrl !== undefined) updateData.processedFileUrl = data.processedFileUrl;
      if (data.currentVersion !== undefined) updateData.currentVersion = data.currentVersion;

      const page = await PageModel.findByIdAndUpdate(
        pageId,
        { $set: updateData },
        { returnDocument: "after" }
      );
      return page ? serializePage(page) : null;
    },

    async deletePage(pageId: string) {
      if (!mongoose.isValidObjectId(pageId)) return false;
      const res = await PageModel.deleteOne({ _id: pageId });
      return res.deletedCount > 0;
    }
  };
}

export type PageRepository = ReturnType<typeof createMongoPageRepository>;
