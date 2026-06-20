export type ManuscriptStatus =
  | "draft"
  | "submitted"
  | "under-editor-review"
  | "revision-requested"
  | "forwarded-to-board"
  | "approved"
  | "rejected";

export type Manuscript = {
  id: string;
  proposalId: string;
  seriesId: string;
  status: ManuscriptStatus;
  currentVersionId: string;
};

export type ManuscriptVersion = {
  id: string;
  manuscriptId: string;
  version: number;
  fileName: string;
  pageCount: number;
  uploadedBy: string;
  uploadedAt: string;
  note?: string;
};

export const manuscripts: Manuscript[] = [
  { id: "ms_jojo", proposalId: "pr_jojo", seriesId: "se_jojo", status: "forwarded-to-board", currentVersionId: "mv_jojo_2" },
  { id: "ms_slam", proposalId: "pr_slam", seriesId: "se_slam", status: "under-editor-review", currentVersionId: "mv_slam_1" },
  { id: "ms_grand", proposalId: "pr_grand", seriesId: "se_grand", status: "draft", currentVersionId: "mv_grand_1" },
  { id: "ms_ghost", proposalId: "pr_ghost", seriesId: "se_ghost", status: "approved", currentVersionId: "mv_ghost_1" },
  { id: "ms_gachi", proposalId: "pr_gachi", seriesId: "se_gachi", status: "approved", currentVersionId: "mv_gachi_1" },
];

export const manuscriptVersions: ManuscriptVersion[] = [
  { id: "mv_jojo_1", manuscriptId: "ms_jojo", version: 1, fileName: "sbr-v1.pdf", pageCount: 32, uploadedBy: "s_man_sano", uploadedAt: "Jun 04, 2026", note: "Initial submission." },
  { id: "mv_jojo_2", manuscriptId: "ms_jojo", version: 2, fileName: "sbr-v2.pdf", pageCount: 36, uploadedBy: "s_man_sano", uploadedAt: "Jun 11, 2026", note: "Reworked opening per Editor feedback." },
  { id: "mv_slam_1", manuscriptId: "ms_slam", version: 1, fileName: "slam-v1.pdf", pageCount: 28, uploadedBy: "s_man_kei", uploadedAt: "Jun 12, 2026" },
  { id: "mv_grand_1", manuscriptId: "ms_grand", version: 1, fileName: "grand-v1.pdf", pageCount: 18, uploadedBy: "s_man_sano", uploadedAt: "Jun 10, 2026", note: "Rough draft." },
  { id: "mv_ghost_1", manuscriptId: "ms_ghost", version: 1, fileName: "ghost-v1.pdf", pageCount: 40, uploadedBy: "s_man_kei", uploadedAt: "Feb 02, 2026" },
  { id: "mv_gachi_1", manuscriptId: "ms_gachi", version: 1, fileName: "gachi-v1.pdf", pageCount: 42, uploadedBy: "s_man_kei", uploadedAt: "Jan 15, 2026" },
];

export const versionsByManuscript = (manuscriptId: string) =>
  manuscriptVersions.filter((v) => v.manuscriptId === manuscriptId).sort((a, b) => a.version - b.version);

export const manuscriptBySeries = (seriesId: string) =>
  manuscripts.find((m) => m.seriesId === seriesId);

export const findManuscriptVersion = (id: string) => manuscriptVersions.find((v) => v.id === id);
