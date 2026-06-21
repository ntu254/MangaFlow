export type TaskStatus =
  | "todo"
  | "in-progress"
  | "submitted"
  | "revision-requested"
  | "mangaka-approved"
  | "editor-approved"
  | "rejected"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  seriesId?: string;
  chapterId: string;
  type: "Linework" | "Tone" | "Background" | "Lettering" | "FX";
  assigneeId: string;
  pageRange: string;
  deadline: string;
  payout: number;
  status: TaskStatus;
  title?: string;
  assigneeName?: string;
  regionId?: string;
  pageId?: string;
  pageNumber?: number;
  priority?: TaskPriority;
  assignedById?: string;
  instruction?: string;
  description?: string;
  currentVersion?: number;
  requiredFiles?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export const tasks: Task[] = [
  {
    id: "t1",
    chapterId: "ch_g2",
    type: "Background",
    assigneeId: "s_as_jubei",
    pageRange: "p. 1–8",
    deadline: "Jun 19",
    payout: 18000,
    status: "in-progress",
    title: "Cityscape background pass",
    pageId: "pg_ch_g2_1",
    pageNumber: 1,
    regionId: "rg_4",
    priority: "high",
    assignedById: "s_man_kei",
    instruction: "Render full cityscape backgrounds for the rooftop chase. Match lighting on p.3.",
    currentVersion: 1,
    requiredFiles: ["PSD with layers", "Flattened PNG"],
  },
  {
    id: "t2",
    chapterId: "ch_g2",
    type: "Tone",
    assigneeId: "s_as_akemi",
    pageRange: "p. 9–16",
    deadline: "Jun 19",
    payout: 15000,
    status: "todo",
    title: "Screentone interior scenes",
    assignedById: "s_man_kei",
    currentVersion: 0,
  },
  {
    id: "t3",
    chapterId: "ch_g2",
    type: "Linework",
    assigneeId: "s_as_jotaro",
    pageRange: "p. 17–24",
    deadline: "Jun 20",
    payout: 22000,
    status: "submitted",
    title: "Action sequence linework",
    assignedById: "s_man_kei",
    currentVersion: 1,
  },
  {
    id: "t4",
    chapterId: "ch_gk2",
    type: "Background",
    assigneeId: "s_as_jubei",
    pageRange: "p. 1–10",
    deadline: "Jun 21",
    payout: 20000,
    status: "submitted",
    title: "Street backgrounds — round 2",
    pageId: "pg_ch_gk2_1",
    pageNumber: 1,
    priority: "medium",
    assignedById: "s_man_sano",
    currentVersion: 2,
  },
  {
    id: "t5",
    chapterId: "ch_ga2",
    type: "FX",
    assigneeId: "s_as_akemi",
    pageRange: "p. 11–23",
    deadline: "Jun 22",
    payout: 16500,
    status: "todo",
  },
  {
    id: "t6",
    chapterId: "ch_ga1",
    type: "Lettering",
    assigneeId: "s_as_jotaro",
    pageRange: "p. 1–21",
    deadline: "Jun 14",
    payout: 9000,
    status: "editor-approved",
  },
  {
    id: "t7",
    chapterId: "ch_sd1",
    type: "Background",
    assigneeId: "s_as_jubei",
    pageRange: "p. 1–25",
    deadline: "Jun 24",
    payout: 28000,
    status: "in-progress",
    title: "Court backgrounds — full chapter",
    priority: "medium",
    assignedById: "s_man_kei",
    currentVersion: 1,
  },
  // Extended seed for Assistant workspace coverage
  {
    id: "t8",
    chapterId: "ch_ga2",
    type: "Lettering",
    assigneeId: "s_as_jubei",
    pageRange: "p. 5–9",
    deadline: "Jun 17",
    payout: 7500,
    status: "revision-requested",
    title: "Speech bubble cleanup",
    pageId: "pg_ch_ga2_1",
    pageNumber: 5,
    priority: "high",
    assignedById: "s_man_kei",
    instruction: "Mangaka wants tighter kerning on action SFX and rounder bubbles.",
    currentVersion: 2,
    requiredFiles: ["Layered PSD"],
  },
  {
    id: "t9",
    chapterId: "ch_g2",
    type: "Tone",
    assigneeId: "s_as_jubei",
    pageRange: "p. 17–20",
    deadline: "Jun 18",
    payout: 11000,
    status: "mangaka-approved",
    title: "Mood tone — flashback",
    priority: "medium",
    assignedById: "s_man_kei",
    currentVersion: 1,
  },
  {
    id: "t10",
    chapterId: "ch_ga1",
    type: "FX",
    assigneeId: "s_as_jubei",
    pageRange: "p. 14–18",
    deadline: "Jun 10",
    payout: 14000,
    status: "editor-approved",
    title: "Impact FX — final round",
    priority: "low",
    assignedById: "s_man_kei",
    currentVersion: 3,
  },
  {
    id: "t11",
    chapterId: "ch_gk1",
    type: "Background",
    assigneeId: "s_as_jubei",
    pageRange: "p. 4–6",
    deadline: "Jun 02",
    payout: 8000,
    status: "editor-approved",
    title: "Alley background",
    priority: "low",
    assignedById: "s_man_sano",
    currentVersion: 2,
  },
  {
    id: "t12",
    chapterId: "ch_v1",
    type: "Linework",
    assigneeId: "s_as_jubei",
    pageRange: "p. 1–4",
    deadline: "Jun 12",
    payout: 6000,
    status: "cancelled",
    title: "Cancelled — chapter restructured",
    assignedById: "s_man_takezo",
    currentVersion: 0,
  },
];

export const findTask = (id: string) => tasks.find((t) => t.id === id);
export const tasksByAssignee = (assigneeId: string) =>
  tasks.filter((t) => t.assigneeId === assigneeId);
