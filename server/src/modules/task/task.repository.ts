import mongoose from "mongoose";
import { TaskModel, type TaskDocument } from "./task.model.js";
import type { CreateTaskInput, Task, UpdateTaskInput } from "./task.service.js";

function serializeDate(value?: Date) {
  return value ? value.toISOString() : undefined;
}

function serializeTask(document: any): Task {
  const serializeUserField = (field: any) => {
    if (!field) return undefined;
    if (field && typeof field === "object" && field._id) {
      return {
        id: String(field._id),
        fullName: field.fullName,
        email: field.email
      };
    }
    return undefined;
  };

  const getUserIdString = (field: any) => {
    if (!field) return "";
    if (field && typeof field === "object" && field._id) {
      return String(field._id);
    }
    return String(field);
  };

  return {
    id: String(document._id),
    seriesId: String(document.seriesId),
    chapterId: String(document.chapterId),
    pageId: String(document.pageId),
    regionId: document.regionId ? String(document.regionId) : undefined,
    assignedBy: getUserIdString(document.assignedBy),
    assignedByUserInfo: serializeUserField(document.assignedBy),
    assignedTo: getUserIdString(document.assignedTo),
    assignedToUserInfo: serializeUserField(document.assignedTo),
    title: document.title,
    description: document.description,
    type: document.type,
    priority: document.priority,
    status: document.status,
    revisionRound: document.revisionRound,
    baseRate: document.baseRate,
    bonusAmount: document.bonusAmount,
    dueDate: serializeDate(document.dueDate),
    submittedAt: serializeDate(document.submittedAt),
    mangakaApprovedAt: serializeDate(document.mangakaApprovedAt),
    editorApprovedAt: serializeDate(document.editorApprovedAt),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoTaskRepository() {
  return {
    async createTask(data: CreateTaskInput): Promise<Task> {
      const task = await TaskModel.create({
        seriesId: data.seriesId,
        chapterId: data.chapterId,
        pageId: data.pageId,
        regionId: data.regionId,
        assignedBy: data.assignedBy,
        assignedTo: data.assignedTo,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority ?? "MEDIUM",
        status: "TODO",
        revisionRound: 0,
        baseRate: data.baseRate ?? 0,
        bonusAmount: data.bonusAmount ?? 0,
        dueDate: data.dueDate
      });
      const populated = await TaskModel.findById(task._id).populate("assignedTo").populate("assignedBy");
      return serializeTask(populated || task);
    },

    async findAll(): Promise<Task[]> {
      const tasks = await TaskModel.find().populate("assignedTo").populate("assignedBy").sort({ createdAt: -1 }).limit(100);
      return tasks.map(serializeTask);
    },

    async findByAssignedTo(userId: string): Promise<Task[]> {
      if (!mongoose.isValidObjectId(userId)) return [];
      const tasks = await TaskModel.find({ assignedTo: userId }).populate("assignedTo").populate("assignedBy").sort({ createdAt: -1 }).limit(100);
      return tasks.map(serializeTask);
    },

    async findBySeriesIds(seriesIds: string[]): Promise<Task[]> {
      const validSeriesIds = seriesIds.filter((seriesId) => mongoose.isValidObjectId(seriesId));
      if (validSeriesIds.length === 0) return [];
      const tasks = await TaskModel.find({ seriesId: { $in: validSeriesIds } }).populate("assignedTo").populate("assignedBy").sort({ createdAt: -1 }).limit(100);
      return tasks.map(serializeTask);
    },

    async findById(taskId: string): Promise<Task | null> {
      if (!mongoose.isValidObjectId(taskId)) return null;
      const task = await TaskModel.findById(taskId).populate("assignedTo").populate("assignedBy");
      return task ? serializeTask(task) : null;
    },

    async updateTask(taskId: string, data: UpdateTaskInput): Promise<Task | null> {
      if (!mongoose.isValidObjectId(taskId)) return null;
      const updateData: Record<string, unknown> = {};
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.baseRate !== undefined) updateData.baseRate = data.baseRate;
      if (data.bonusAmount !== undefined) updateData.bonusAmount = data.bonusAmount;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt;

      const task = await TaskModel.findByIdAndUpdate(taskId, { $set: updateData }, { returnDocument: "after" }).populate("assignedTo").populate("assignedBy");
      return task ? serializeTask(task) : null;
    },

    async deleteTask(taskId: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(taskId)) return false;
      const result = await TaskModel.deleteOne({ _id: taskId });
      return result.deletedCount > 0;
    }
  };
}

export type TaskRepository = ReturnType<typeof createMongoTaskRepository>;
