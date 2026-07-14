import { UserModel } from "../../../db/models.js";

export function listUserRecords({
  filter = {},
  sort = { role: 1, name: 1 },
  skip,
  limit,
}: {
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
} = {}) {
  let query = UserModel.find(filter).sort(sort).lean();
  if (typeof skip === "number") query = query.skip(skip);
  if (typeof limit === "number") query = query.limit(limit);
  return query;
}

export function countUserRecords(filter: Record<string, unknown> = {}) {
  return UserModel.countDocuments(filter);
}

export function findUserRecordById(userId: string) {
  return UserModel.findOne({ id: userId }).lean();
}

export function findUserRecordByEmail(email: string) {
  return UserModel.findOne({ email }).lean();
}

export function createUserRecord(record: Record<string, unknown>) {
  return UserModel.create(record);
}

export function patchUserRecord(userId: string, patch: Record<string, unknown>) {
  return UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
}
