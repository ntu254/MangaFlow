import type { EditorialChecklist } from "@/entities/proposal/model/proposal-types";

export const EDITORIAL_CHECKLIST_KEYS = [
  "hook",
  "characterMotivation",
  "audienceFit",
  "storyboardFlow",
  "manuscriptQuality",
  "serializePotential",
] as const satisfies readonly (keyof EditorialChecklist)[];

export const EDITORIAL_CRITERIA: Array<{
  key: (typeof EDITORIAL_CHECKLIST_KEYS)[number];
  label: string;
  description: string;
}> = [
  {
    key: "hook",
    label: "Distinct, understandable hook",
    description: "The logline clearly states the premise and what makes the series worth opening.",
  },
  {
    key: "characterMotivation",
    label: "Character goal and stakes",
    description:
      "The protagonist has an identifiable goal, motivation, and consequence of failure.",
  },
  {
    key: "audienceFit",
    label: "Audience and genre fit",
    description:
      "The target audience and selected genres are consistent with the submitted content.",
  },
  {
    key: "storyboardFlow",
    label: "Readable narrative flow",
    description:
      "The sample demonstrates coherent sequencing, pacing, and scene-to-scene progression.",
  },
  {
    key: "manuscriptQuality",
    label: "Reviewable submission package",
    description:
      "Required manuscript, sample pages, and supporting files open and meet minimum quality.",
  },
  {
    key: "serializePotential",
    label: "Serialization viability",
    description: "The story direction and production plan can support an ongoing release schedule.",
  },
];

export function isEditorialChecklistComplete(checklist?: EditorialChecklist) {
  return EDITORIAL_CHECKLIST_KEYS.every((key) => checklist?.[key] === true);
}
