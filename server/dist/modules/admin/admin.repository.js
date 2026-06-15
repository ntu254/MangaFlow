import { User } from "../auth/auth.model.js";
import { BoardMember } from "../board/board.model.js";
import { Series } from "../series/series.model.js";
import { Task, TaskType } from "../task/task.model.js";
export function listUsers() {
    return User.find().sort({ createdAt: -1 }).lean();
}
export function getUserById(userId) {
    return User.findById(userId);
}
export function getUserByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
}
export function createUser(input) {
    return User.create(input);
}
export function updateUser(userId, updates) {
    return User.findByIdAndUpdate(userId, updates, { new: true });
}
export function deleteUser(userId) {
    return User.findByIdAndDelete(userId);
}
export function listBoardMembers() {
    return BoardMember.find().sort({ isChair: -1, updatedAt: -1 }).populate("userId", "email name role isActive").lean();
}
export function getBoardMemberByUser(userId) {
    return BoardMember.findOne({ userId });
}
export function upsertBoardMember(userId) {
    return BoardMember.findOneAndUpdate({ userId }, { userId, isActive: true }, { new: true, upsert: true, setDefaultsOnInsert: true }).populate("userId", "email name role isActive");
}
export function updateBoardMember(userId, updates) {
    return BoardMember.findOneAndUpdate({ userId }, updates, { new: true }).populate("userId", "email name role isActive");
}
export function clearBoardChairs(exceptUserId) {
    const query = exceptUserId ? { userId: { $ne: exceptUserId } } : {};
    return BoardMember.updateMany(query, { isChair: false });
}
export function countActiveUsers() {
    return User.countDocuments({ isActive: true });
}
export function countSeries() {
    return Series.countDocuments();
}
export function countActiveTasks() {
    return Task.countDocuments({ status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"] } });
}
export function countBoardMembers() {
    return BoardMember.countDocuments({ isActive: true });
}
export function countTaskTypes() {
    return TaskType.countDocuments({ isActive: true });
}
export function listTaskTypes() {
    return TaskType.find().sort({ name: 1 }).lean();
}
export function getTaskType(taskTypeId) {
    return TaskType.findById(taskTypeId);
}
export function getTaskTypeByName(name) {
    return TaskType.findOne({ name });
}
export function createTaskType(input) {
    return TaskType.create(input);
}
export function updateTaskType(taskTypeId, updates) {
    return TaskType.findByIdAndUpdate(taskTypeId, updates, { new: true });
}
export function taskTypeInUse(taskTypeId) {
    return Task.exists({ taskTypeId });
}
export function deleteTaskType(taskTypeId) {
    return TaskType.findByIdAndDelete(taskTypeId);
}
//# sourceMappingURL=admin.repository.js.map