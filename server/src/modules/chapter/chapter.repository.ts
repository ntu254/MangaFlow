import mongoose from "mongoose";
import { ChapterModel, type ChapterDocument, type ChapterStatus } from "./chapter.model.js";
import type { Chapter, CreateChapterInput, UpdateChapterInput } from "./chapter.service.js";

function serializeChapter(document: ChapterDocument & { _id: unknown }): Chapter {
  return {
    id: String(document._id),
    seriesId: String(document.seriesId),
    title: document.title,
    chapterNumber: document.chapterNumber,
    status: document.status,
    deadline: document.deadline ? document.deadline.toISOString() : undefined,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function createMongoChapterRepository() {
  return {
    async createChapter(data: CreateChapterInput) {
      const chapter = await ChapterModel.create({
        seriesId: data.seriesId,
        title: data.title,
        chapterNumber: data.chapterNumber,
        status: "DRAFT",
        deadline: data.deadline ? new Date(data.deadline) : undefined
      });
      return serializeChapter(chapter);
    },

    async findChaptersBySeries(seriesId: string) {
      if (!mongoose.isValidObjectId(seriesId)) return [];
      const chapters = await ChapterModel.find({ seriesId }).sort({ chapterNumber: 1 });
      return chapters.map(serializeChapter);
    },

    async findById(chapterId: string) {
      if (!mongoose.isValidObjectId(chapterId)) return null;
      const chapter = await ChapterModel.findById(chapterId);
      return chapter ? serializeChapter(chapter) : null;
    },

    async updateChapter(chapterId: string, data: UpdateChapterInput) {
      if (!mongoose.isValidObjectId(chapterId)) return null;
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.chapterNumber !== undefined) updateData.chapterNumber = data.chapterNumber;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;

      const chapter = await ChapterModel.findByIdAndUpdate(
        chapterId,
        { $set: updateData },
        { new: true }
      );
      return chapter ? serializeChapter(chapter) : null;
    },

    async deleteChapter(chapterId: string) {
      if (!mongoose.isValidObjectId(chapterId)) return false;
      const res = await ChapterModel.deleteOne({ _id: chapterId });
      return res.deletedCount > 0;
    }
  };
}

export type ChapterRepository = ReturnType<typeof createMongoChapterRepository>;
