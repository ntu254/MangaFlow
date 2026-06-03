import mongoose from "mongoose";
import type { Series, SeriesRepository, UpdateSeriesInput } from "./series.service.js";
import { SeriesModel, type SeriesDocument } from "./series.model.js";
import { SeriesMemberModel } from "./series-member.model.js";

function serializeSeries(document: SeriesDocument & { _id: unknown }): Series {
  return {
    id: String(document._id),
    title: document.title,
    slug: document.slug,
    description: document.description,
    genre: document.genre,
    coverUrl: document.coverUrl,
    ownerId: String(document.ownerId),
    status: document.status,
    publicationType: document.publicationType,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function createMongoSeriesRepository(): SeriesRepository {
  return {
    async createSeries(data) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const [series] = await SeriesModel.create(
          [
            {
              title: data.title,
              slug: data.slug,
              description: data.description,
              genre: data.genre,
              publicationType: data.publicationType,
              ownerId: data.ownerId,
              status: "DRAFT"
            }
          ],
          { session }
        );

        await SeriesMemberModel.create(
          [
            {
              seriesId: series._id,
              userId: data.ownerId,
              role: "OWNER_MANGAKA",
              status: "ACTIVE"
            }
          ],
          { session }
        );

        await session.commitTransaction();
        return serializeSeries(series);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },

    async findSeriesById(seriesId: string) {
      if (!mongoose.isValidObjectId(seriesId)) return null;
      const series = await SeriesModel.findById(seriesId);
      return series ? serializeSeries(series) : null;
    },

    async findSeriesBySlug(slug: string) {
      const series = await SeriesModel.findOne({ slug });
      return series ? serializeSeries(series) : null;
    },

    async listSeriesForUser(userId: string) {
      if (!mongoose.isValidObjectId(userId)) return [];
      
      const memberships = await SeriesMemberModel.find({ userId, status: "ACTIVE" });
      const seriesIds = memberships.map(m => m.seriesId);

      const seriesList = await SeriesModel.find({ _id: { $in: seriesIds } }).sort({ updatedAt: -1 });
      return seriesList.map(serializeSeries);
    },

    async updateSeries(seriesId: string, data: UpdateSeriesInput) {
      if (!mongoose.isValidObjectId(seriesId)) return null;
      
      const series = await SeriesModel.findByIdAndUpdate(
        seriesId,
        { $set: data },
        { returnDocument: "after" }
      );
      
      return series ? serializeSeries(series) : null;
    },

    async deleteSeries(seriesId: string) {
      if (!mongoose.isValidObjectId(seriesId)) return false;
      
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const result = await SeriesModel.deleteOne({ _id: seriesId }, { session });
        if (result.deletedCount === 0) {
          await session.abortTransaction();
          return false;
        }

        await SeriesMemberModel.deleteMany({ seriesId }, { session });

        await session.commitTransaction();
        return true;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },

    async getSeriesMemberRole(seriesId: string, userId: string) {
      if (!mongoose.isValidObjectId(seriesId) || !mongoose.isValidObjectId(userId)) return null;
      const member = await SeriesMemberModel.findOne({ seriesId, userId, status: "ACTIVE" });
      return member ? member.role : null;
    }
  };
}
