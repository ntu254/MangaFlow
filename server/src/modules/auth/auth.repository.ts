import type {
  AuthUser,
  UserRepository,
  SystemRole,
  UserStatus
} from "./auth.service.js";
import { UserModel, type UserDocument } from "../user/user.model.js";
import mongoose from "mongoose";

function serializeUser(document: UserDocument & { _id: unknown }): AuthUser {
  const idStr = String(document._id);
  return {
    id: idStr,
    clerkId: idStr, // compatibility mapping clerkId -> MongoDB ID
    email: document.email,
    fullName: document.fullName,
    avatarUrl: document.avatarUrl,
    systemRole: document.systemRole,
    status: document.status,
    lastLoginAt: document.lastLoginAt?.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoUserRepository(): UserRepository {
  return {
    async findByClerkId(clerkId) {
      if (!mongoose.Types.ObjectId.isValid(clerkId)) return null;
      const user = await UserModel.findById(clerkId);
      return user ? serializeUser(user) : null;
    },

    async findById(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const user = await UserModel.findById(id);
      return user ? serializeUser(user) : null;
    },

    async findByEmail(email) {
      const user = await UserModel.findOne({ email });
      return user ? serializeUser(user) : null;
    },

    async findByEmailWithPassword(email) {
      const user = await UserModel.findOne({ email }).exec();
      if (!user) return null;
      return {
        user: serializeUser(user),
        passwordHash: user.passwordHash
      };
    },

    async createUser(input) {
      const user = new UserModel({
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        systemRole: input.systemRole,
        status: input.status
      });
      await user.save();
      return serializeUser(user);
    },

    async updateUser(id, input) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const update: any = {};
      if (input.fullName !== undefined) update.fullName = input.fullName;
      if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;

      const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: update },
        { returnDocument: "after" }
      );
      return user ? serializeUser(user) : null;
    },

    async changePassword(id, passwordHash) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const result = await UserModel.findByIdAndUpdate(id, {
        $set: { passwordHash }
      });
      return !!result;
    },

    async listAllUsers() {
      const users = await UserModel.find().sort({ updatedAt: -1 });
      return users.map(u => serializeUser(u));
    },

    async assignSystemRole(userId, role) {
      if (!mongoose.Types.ObjectId.isValid(userId)) return null;
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { systemRole: role } },
        { returnDocument: "after" }
      );
      return user ? serializeUser(user) : null;
    },

    async updateUserStatus(userId, status) {
      if (!mongoose.Types.ObjectId.isValid(userId)) return null;
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { status } },
        { returnDocument: "after" }
      );
      return user ? serializeUser(user) : null;
    },

    // Legacy / test compatibility implementations
    async upsertFromProfile(profile) {
      const user = await UserModel.findOneAndUpdate(
        { email: profile.email },
        {
          $set: {
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl
          },
          $setOnInsert: {
            passwordHash: "NOPASSWORD_MOCKED_SYNC",
            systemRole: "MANGAKA",
            status: "ACTIVE"
          }
        },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
      );
      return serializeUser(user);
    },

    async updateOnboarding(clerkId, input) {
      if (!mongoose.Types.ObjectId.isValid(clerkId)) return null;
      const user = await UserModel.findByIdAndUpdate(
        clerkId,
        {
          $set: {
            fullName: input.fullName,
            avatarUrl: input.avatarUrl
          }
        },
        { returnDocument: "after" }
      );
      return user ? serializeUser(user) : null;
    },

    async listUsersForRoleReview(filters) {
      const query: any = {};
      if (filters.status) query.status = filters.status;
      const users = await UserModel.find(query).sort({ updatedAt: -1 }).limit(50);
      return users.map(u => serializeUser(u));
    }
  };
}
