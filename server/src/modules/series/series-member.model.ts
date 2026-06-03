import { model, Schema, Types } from "mongoose";

export const SERIES_MEMBER_ROLES = [
  "OWNER_MANGAKA",
  "CO_MANGAKA",
  "EDITOR",
  "ASSISTANT",
  "REVIEWER"
] as const;

export type SeriesMemberRole = typeof SERIES_MEMBER_ROLES[number];

export const SERIES_MEMBER_STATUSES = ["INVITED", "ACTIVE", "REMOVED"] as const;
export type SeriesMemberStatus = typeof SERIES_MEMBER_STATUSES[number];

export type SeriesMemberDocument = {
  _id: Types.ObjectId;
  seriesId: Types.ObjectId;
  userId: Types.ObjectId;
  role: SeriesMemberRole;
  status: SeriesMemberStatus;
  createdAt: Date;
  updatedAt: Date;
};

const seriesMemberSchema = new Schema<SeriesMemberDocument>(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: "Series",
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: SERIES_MEMBER_ROLES,
      required: true
    },
    status: {
      type: String,
      enum: SERIES_MEMBER_STATUSES,
      default: "INVITED"
    }
  },
  {
    timestamps: true
  }
);

// A user should only have one role per series (or at least we should query efficiently)
seriesMemberSchema.index({ seriesId: 1, userId: 1 }, { unique: true });

export const SeriesMemberModel = model<SeriesMemberDocument>(
  "SeriesMember",
  seriesMemberSchema
);
