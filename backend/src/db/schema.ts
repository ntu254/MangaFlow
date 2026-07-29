import { Schema } from "mongoose";

const looseOptions = {
  strict: false,
  minimize: false,
  timestamps: true,
  versionKey: false,
  suppressReservedKeysWarning: true,
  toJSON: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
} as const;

export function looseSchema(extra: Record<string, unknown> = {}) {
  return new Schema(
    {
      id: { type: String, required: true, unique: true, index: true },
      ...extra,
    },
    looseOptions,
  ) as Schema<any>;
}
