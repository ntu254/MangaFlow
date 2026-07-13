import { z } from "zod";

export const schedulePublicationSchema = z
  .object({
    scheduledAt: z.string().min(1),
    note: z.string().max(2000).optional(),
  })
  .strict();

export const publicationNoteSchema = z
  .object({
    note: z.string().max(2000).optional(),
  })
  .strict();
