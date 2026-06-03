import mongoose from "mongoose";
import { SubmissionModel, type SubmissionDocument } from "./submission.model.js";
import type { CreateSubmissionRecord, Submission } from "./submission.service.js";

function serializeSubmission(document: SubmissionDocument & { _id: unknown }): Submission {
  return {
    id: String(document._id),
    taskId: String(document.taskId),
    submittedBy: String(document.submittedBy),
    fileUrl: document.fileUrl,
    previewUrl: document.previewUrl,
    note: document.note,
    version: document.version,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoSubmissionRepository() {
  return {
    async createSubmission(data: CreateSubmissionRecord): Promise<Submission> {
      const submission = await SubmissionModel.create({
        taskId: data.taskId,
        submittedBy: data.submittedBy,
        fileUrl: data.fileUrl,
        previewUrl: data.previewUrl,
        note: data.note,
        version: data.version,
        status: data.status
      });
      return serializeSubmission(submission);
    },

    async findAll(): Promise<Submission[]> {
      const submissions = await SubmissionModel.find().sort({ createdAt: -1 }).limit(100);
      return submissions.map(serializeSubmission);
    },

    async findByTaskId(taskId: string): Promise<Submission[]> {
      if (!mongoose.isValidObjectId(taskId)) return [];
      const submissions = await SubmissionModel.find({ taskId }).sort({ version: -1 });
      return submissions.map(serializeSubmission);
    },

    async findBySubmittedBy(userId: string): Promise<Submission[]> {
      if (!mongoose.isValidObjectId(userId)) return [];
      const submissions = await SubmissionModel.find({ submittedBy: userId }).sort({ createdAt: -1 }).limit(100);
      return submissions.map(serializeSubmission);
    },

    async findById(submissionId: string): Promise<Submission | null> {
      if (!mongoose.isValidObjectId(submissionId)) return null;
      const submission = await SubmissionModel.findById(submissionId);
      return submission ? serializeSubmission(submission) : null;
    },

    async getLatestVersionForTask(taskId: string): Promise<number> {
      if (!mongoose.isValidObjectId(taskId)) return 0;
      const latest = await SubmissionModel.findOne({ taskId }).sort({ version: -1 });
      return latest?.version ?? 0;
    }
  };
}

export type SubmissionRepository = ReturnType<typeof createMongoSubmissionRepository>;
