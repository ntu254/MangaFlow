import mongoose from "mongoose";

export type SessionDocument = {
  _id: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
};

const sessionSchema = new mongoose.Schema<SessionDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revokedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const SessionModel = mongoose.model<SessionDocument>("RefreshToken", sessionSchema);

export type SessionRepository = {
  createSession(userId: string, expiresAt: Date): Promise<SessionDocument>;
  findValidSession(id: string): Promise<SessionDocument | null>;
  revokeSession(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
};

export const createSessionRepository = (): SessionRepository => {
  return {
    async createSession(userId, expiresAt) {
      const session = new SessionModel({
        userId: new mongoose.Types.ObjectId(userId),
        expiresAt,
      });
      await session.save();
      return session;
    },

    async findValidSession(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const session = await SessionModel.findById(id).exec();
      if (!session || session.revokedAt) return null;
      if (session.expiresAt < new Date()) return null;
      return session;
    },

    async revokeSession(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return;
      await SessionModel.findByIdAndUpdate(id, {
        revokedAt: new Date(),
      }).exec();
    },

    async revokeAllForUser(userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      await SessionModel.updateMany(
        { userId: userObjectId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      ).exec();
    }
  };
};
