import { model, Schema, Types } from "mongoose";

export const SERIES_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "EDITOR_REVIEW",
  "BOARD_REVIEW",
  "APPROVED",
  "PUBLISHING",
  "ONGOING",
  "AT_RISK",
  "CANCELLED",
  "COMPLETED"
] as const;

export type SeriesStatus = typeof SERIES_STATUSES[number];

export const PUBLICATION_TYPES = ["WEEKLY", "MONTHLY"] as const;
export type PublicationType = typeof PUBLICATION_TYPES[number];

export type SeriesDocument = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  genre: string[];
  coverUrl: string | null;
  ownerId: Types.ObjectId;
  status: SeriesStatus;
  publicationType: PublicationType | null;
  createdAt: Date;
  updatedAt: Date;
};

const seriesSchema = new Schema<SeriesDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    genre: {
      type: [String],
      default: []
    },
    coverUrl: {
      type: String,
      default: null
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: SERIES_STATUSES,
      default: "DRAFT",
      index: true
    },
    publicationType: {
      type: String,
      enum: [...PUBLICATION_TYPES, null],
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const SeriesModel = model<SeriesDocument>("Series", seriesSchema);
