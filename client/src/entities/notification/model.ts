export type NotificationItem = {
  id: string;
  userId: string; // recipient staff id
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  at: string;
};

export const seedNotifications: NotificationItem[] = [
  {
    id: "n_1",
    userId: "s_man_kei",
    type: "EDITOR_REQUESTED_REVISION",
    title: "Editor requested a revision",
    body: "Slam Dunk · v1 — tighten team dynamics in chapter 2.",
    link: "/app/series/se_slam/revisions",
    read: false,
    at: "Jun 15 · 09:30",
  },
  {
    id: "n_2",
    userId: "s_man_kei",
    type: "BOARD_VOTE_CAST",
    title: "Board vote cast",
    body: "Kojiro voted approve on Ghost Fixers.",
    link: "/app/series/se_ghost",
    read: false,
    at: "Jun 14 · 09:11",
  },
  {
    id: "n_3",
    userId: "s_man_kei",
    type: "PAGES_UPLOADED",
    title: "Pages uploaded",
    body: "8 pages processed for Ch. 20.",
    link: "/app/chapters/ch_g2",
    read: true,
    at: "Jun 10 · 12:30",
  },
  {
    id: "n_4",
    userId: "s_ed_otsu",
    type: "SERIES_SUBMITTED_TO_EDITOR",
    title: "Slam Dunk submitted",
    body: "Kei Urana submitted Slam Dunk for review.",
    link: "/app/editor/series/se_slam/review",
    read: false,
    at: "Jun 12 · 09:20",
  },
  {
    id: "n_5",
    userId: "s_bd_sekishu",
    type: "SERIES_FORWARDED_TO_BOARD",
    title: "Steel Ball Run forwarded",
    body: "Otsu forwarded SBR for board vote.",
    link: "/app/board/series/se_jojo/vote",
    read: false,
    at: "Jun 13 · 16:02",
  },
  {
    id: "n_6",
    userId: "s_as_jubei",
    type: "ASSISTANT_ADDED_TO_TEAM",
    title: "Added to Gachiakuta team",
    body: "You can now receive tasks for Gachiakuta.",
    link: "/app/series/se_gachi/team",
    read: true,
    at: "Jan 23 · 10:00",
  },
  {
    id: "n_7",
    userId: "s_as_jubei",
    type: "TASK_ASSIGNED",
    title: "New task: Background",
    body: "Ghost Fixers Ch. 20 · p. 1–8 · due Jun 19.",
    link: "/app/tasks",
    read: false,
    at: "Jun 16 · 14:00",
  },
  {
    id: "n_8",
    userId: "s_man_sano",
    type: "AI_SEGMENTATION_FAILED",
    title: "AI segmentation failed",
    body: "Service timeout on Gokuragukai Ch. 21 p.1.",
    link: "/app/pages/pg_ch_gk2_1/studio",
    read: false,
    at: "Jun 18 · 09:02",
  },
];
