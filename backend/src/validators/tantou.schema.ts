import { z } from "zod";

export const assignEditorSchema = z.object({
  editorId: z.string().min(1, "editorId is required")
});

export type AssignEditorBody = z.infer<typeof assignEditorSchema>;
