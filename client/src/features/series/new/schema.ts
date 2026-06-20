import { z } from "zod";

export const TARGET_AUDIENCES = [
  "Shounen",
  "Seinen",
  "Shoujo",
  "Josei",
  "Kodomo",
  "General",
] as const;

export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export const CADENCES = ["WEEKLY", "MONTHLY", "NONE"] as const;
export type Cadence = (typeof CADENCES)[number];

export const WIZARD_STEPS = ["basic", "pitch", "manuscript", "review"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export const basicSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  logline: z
    .string()
    .trim()
    .min(1, "Logline is required")
    .max(140, "Max 140 characters"),
  targetAudience: z.enum(TARGET_AUDIENCES, {
    errorMap: () => ({ message: "Pick a target audience" }),
  }),
  genres: z.array(z.string()).min(1, "Add at least one genre").max(10, "Max 10 genres"),
  preferredCadence: z.enum(CADENCES),
});

export const pitchSchema = z.object({
  synopsis: z
    .string()
    .trim()
    .min(1, "Synopsis is required")
    .max(2000, "Max 2000 characters"),
  premise: z.string().trim().max(2000),
  mainCharacters: z.string().trim().max(2000),
  centralConflict: z.string().trim().max(2000),
});

export const reviewSchema = z.object({
  editorNote: z.string().trim().max(2000),
});

export const fullProposalSchema = basicSchema
  .merge(pitchSchema)
  .merge(reviewSchema);

export type ProposalFormValues = z.infer<typeof fullProposalSchema>;

export const defaultProposalValues: ProposalFormValues = {
  title: "",
  logline: "",
  targetAudience: "Shounen",
  genres: [],
  preferredCadence: "NONE",
  synopsis: "",
  premise: "",
  mainCharacters: "",
  centralConflict: "",
  editorNote: "",
};
