import type {
  AuthUser,
  ClerkUserProfile,
  SafeOnboardingInput,
  UserRepository
} from "./auth.service.js";
import { UserModel, type UserDocument } from "../user/user.model.js";

function serializeUser(document: UserDocument & { _id: unknown }): AuthUser {
  return {
    id: String(document._id),
    clerkId: document.clerkId,
    email: document.email,
    fullName: document.fullName,
    avatarUrl: document.avatarUrl,
    systemRole: document.systemRole,
    requestedSystemRole: document.requestedSystemRole,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoUserRepository(): UserRepository {
  return {
    async findByClerkId(clerkId) {
      const user = await UserModel.findOne({ clerkId });
      return user ? serializeUser(user) : null;
    },

    async upsertFromClerk(profile: ClerkUserProfile) {
      const user = await UserModel.findOneAndUpdate(
        { clerkId: profile.clerkId },
        {
          $set: {
            email: profile.email,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl
          },
          $setOnInsert: {
            systemRole: null,
            requestedSystemRole: null,
            status: "ACTIVE"
          }
        },
        {
          returnDocument: "after",
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      return serializeUser(user);
    },

    async updateOnboarding(clerkId: string, input: SafeOnboardingInput) {
      const update = {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.requestedSystemRole
          ? { requestedSystemRole: input.requestedSystemRole }
          : {})
      };

      const user = await UserModel.findOneAndUpdate(
        { clerkId },
        { $set: update },
        { returnDocument: "after" }
      );

      return user ? serializeUser(user) : null;
    },

    async listUsersForRoleReview(filters) {
      const query = {
        ...(filters.role === "pending" ? { systemRole: null } : {}),
        ...(filters.status ? { status: filters.status } : {})
      };

      const users = await UserModel.find(query).sort({ updatedAt: -1 }).limit(50);
      return users.map((user) => serializeUser(user));
    },

    async findById(id: string) {
      const user = await UserModel.findById(id);
      return user ? serializeUser(user) : null;
    },

    async assignSystemRole(userId, role) {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            systemRole: role,
            requestedSystemRole: null
          }
        },
        { returnDocument: "after" }
      );

      return user ? serializeUser(user) : null;
    },

    async updateUserStatus(userId, status) {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            status
          }
        },
        { returnDocument: "after" }
      );

      return user ? serializeUser(user) : null;
    }
  };
}
