import { model, Schema } from "mongoose";
import type {
  RequestedSystemRole,
  SystemRole,
  UserStatus
} from "../auth/auth.service.js";

export type UserDocument = {
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: SystemRole | null;
  requestedSystemRole: RequestedSystemRole | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: null
    },
    systemRole: {
      type: String,
      enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD", null],
      default: null,
      index: true
    },
    requestedSystemRole: {
      type: String,
      enum: ["MANGAKA", "ASSISTANT", null],
      default: null
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<UserDocument>("User", userSchema);

