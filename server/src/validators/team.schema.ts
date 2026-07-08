import { z } from "zod";

export const addMemberSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  role: z.string().optional(),
  scope: z.string().optional(),
  status: z.string().optional(),
  assignedChapterIds: z.array(z.string()).optional(),
  assignedTaskIds: z.array(z.string()).optional()
});

export const updateMemberSchema = z.object({
  role: z.string().optional(),
  scope: z.string().optional(),
  status: z.string().optional(),
  assignedChapterIds: z.array(z.string()).optional(),
  assignedTaskIds: z.array(z.string()).optional()
});

export const inviteAssistantSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  scope: z.enum(["Full chapter", "Task only", "Read only"]).optional()
});
