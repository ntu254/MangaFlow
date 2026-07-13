import { UserModel } from "../../../db/models.js";

export function listUserRecords() {
  return UserModel.find({}).sort({ role: 1, name: 1 }).lean();
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
