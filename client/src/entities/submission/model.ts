export type SubmissionStatus =
  | "submitted"
  | "revision-requested"
  | "mangaka-approved"
  | "editor-approved"
  | "rejected";

export type Submission = {
  id: string;
  taskId: string;
  version: number;
  submittedAt: string;
  submittedByUserId: string;
  status: SubmissionStatus;
  mangakaApproved: boolean;
  editorApproved: boolean;
  rejected: boolean;
  note: string;
  files: string[];
  revisionRequestedBy?: {
    role: "mangaka" | "editor";
    userId: string;
    at: string;
    message: string;
  };
};

export const submissions: Submission[] = [
  {
    id: "sm1",
    taskId: "t3",
    version: 1,
    submittedAt: "Jun 17 · 14:22",
    submittedByUserId: "s_as_jotaro",
    status: "mangaka-approved",
    mangakaApproved: true,
    editorApproved: false,
    rejected: false,
    note: "Need Editor sign-off on panel flow.",
    files: ["linework_v1.psd", "linework_v1.png"],
  },
  {
    id: "sm2_v1",
    taskId: "t4",
    version: 1,
    submittedAt: "Jun 15 · 11:05",
    submittedByUserId: "s_as_jubei",
    status: "revision-requested",
    mangakaApproved: false,
    editorApproved: false,
    rejected: false,
    note: "First pass for review.",
    files: ["bg_v1.png"],
    revisionRequestedBy: {
      role: "mangaka",
      userId: "s_man_sano",
      at: "Jun 16 · 09:42",
      message: "Need more atmospheric perspective on p.4–p.6.",
    },
  },
  {
    id: "sm2",
    taskId: "t4",
    version: 2,
    submittedAt: "Jun 18 · 09:11",
    submittedByUserId: "s_as_jubei",
    status: "submitted",
    mangakaApproved: false,
    editorApproved: false,
    rejected: false,
    note: "Awaiting Mangaka review (round 2).",
    files: ["bg_v2.psd", "bg_v2.png"],
  },
  {
    id: "sm3",
    taskId: "t6",
    version: 1,
    submittedAt: "Jun 14 · 18:40",
    submittedByUserId: "s_as_jotaro",
    status: "editor-approved",
    mangakaApproved: true,
    editorApproved: true,
    rejected: false,
    note: "Approved.",
    files: ["letter_v1.psd"],
  },
  {
    id: "sm8_v1",
    taskId: "t8",
    version: 1,
    submittedAt: "Jun 12 · 16:01",
    submittedByUserId: "s_as_jubei",
    status: "revision-requested",
    mangakaApproved: false,
    editorApproved: false,
    rejected: false,
    note: "First pass.",
    files: ["bubbles_v1.psd"],
    revisionRequestedBy: {
      role: "mangaka",
      userId: "s_man_kei",
      at: "Jun 13 · 10:11",
      message: "Tighten kerning on the SFX, rounder bubble corners.",
    },
  },
  {
    id: "sm8_v2",
    taskId: "t8",
    version: 2,
    submittedAt: "Jun 15 · 09:30",
    submittedByUserId: "s_as_jubei",
    status: "revision-requested",
    mangakaApproved: false,
    editorApproved: false,
    rejected: false,
    note: "Second pass with corrections.",
    files: ["bubbles_v2.psd"],
    revisionRequestedBy: {
      role: "editor",
      userId: "s_ed_otsu",
      at: "Jun 16 · 12:05",
      message: "Editor: SFX still too thin on p.7. Bump weight 15%.",
    },
  },
  {
    id: "sm9",
    taskId: "t9",
    version: 1,
    submittedAt: "Jun 16 · 21:14",
    submittedByUserId: "s_as_jubei",
    status: "mangaka-approved",
    mangakaApproved: true,
    editorApproved: false,
    rejected: false,
    note: "Tone pass complete.",
    files: ["tone_v1.psd"],
  },
  {
    id: "sm10",
    taskId: "t10",
    version: 3,
    submittedAt: "Jun 08 · 13:22",
    submittedByUserId: "s_as_jubei",
    status: "editor-approved",
    mangakaApproved: true,
    editorApproved: true,
    rejected: false,
    note: "Final FX.",
    files: ["fx_v3.psd", "fx_v3.png"],
  },
  {
    id: "sm11",
    taskId: "t11",
    version: 2,
    submittedAt: "Jun 01 · 10:10",
    submittedByUserId: "s_as_jubei",
    status: "editor-approved",
    mangakaApproved: true,
    editorApproved: true,
    rejected: false,
    note: "Alley BG done.",
    files: ["alley_v2.png"],
  },
];

export const submissionsByTask = (taskId: string) =>
  submissions
    .filter((s) => s.taskId === taskId)
    .sort((a, b) => a.version - b.version);

export const latestSubmission = (taskId: string) => {
  const all = submissionsByTask(taskId);
  return all.length > 0 ? all[all.length - 1] : null;
};
