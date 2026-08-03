import { z } from "zod";

export const addMemberSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1)
}).strict();

export const updateMemberSchema = z.object({
  scope: z.string().optional(),
  assignedChapterIds: z.array(z.string()).optional(),
  assignedTaskIds: z.array(z.string()).optional()
}).strict();

export const inviteAssistantSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  scope: z.enum(["Full chapter", "Task only", "Read only"]).optional()
});
