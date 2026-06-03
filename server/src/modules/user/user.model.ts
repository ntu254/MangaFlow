import { model, Schema } from "mongoose";
import type {
  SystemRole,
  UserStatus
} from "../auth/auth.service.js";

export type UserDocument = {
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: SystemRole;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
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
      enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<UserDocument>("User", userSchema);
