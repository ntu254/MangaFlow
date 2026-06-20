export type RegionStatus =
  | "created"
  | "ai-suggested"
  | "accepted"
  | "rejected"
  | "linked-to-task";

export type RegionType = "panel" | "bubble" | "sfx" | "background";

/**
 * Region coordinates normalized and clamped to the natural dimensions of the Working Image.
 * - `x` >= 0
 * - `y` >= 0
 * - `width` > 0
 * - `height` > 0
 * - `x` + `width` <= 1
 * - `y` + `height` <= 1
 */
export type NormalizedRegionBounds = {
  x: number; // 0..1 relative to working image width
  y: number; // 0..1 relative to working image height
  w: number; // 0..1 relative to working image width
  h: number; // 0..1 relative to working image height
};

export type Region = {
  id: string;
  pageId: string;
  status: RegionStatus;
  type: RegionType;
  coords: NormalizedRegionBounds;
  taskId?: string;
  source: "manual" | "ai";
  aiResultId?: string;
};

export const regions: Region[] = [
  { id: "rg_1", pageId: "pg_ch_g2_1", status: "linked-to-task", type: "panel", coords: { x: 0.05, y: 0.05, w: 0.9, h: 0.4 }, source: "manual", taskId: "t1" },
  { id: "rg_2", pageId: "pg_ch_g2_1", status: "accepted", type: "bubble", coords: { x: 0.3, y: 0.1, w: 0.25, h: 0.12 }, source: "ai", aiResultId: "ai_1" },
  { id: "rg_3", pageId: "pg_ch_g2_1", status: "ai-suggested", type: "sfx", coords: { x: 0.6, y: 0.5, w: 0.3, h: 0.15 }, source: "ai", aiResultId: "ai_1" },
  { id: "rg_4", pageId: "pg_ch_g2_2", status: "created", type: "background", coords: { x: 0, y: 0.55, w: 1, h: 0.45 }, source: "manual" },
  { id: "rg_5", pageId: "pg_ch_g2_2", status: "ai-suggested", type: "bubble", coords: { x: 0.1, y: 0.2, w: 0.2, h: 0.1 }, source: "ai", aiResultId: "ai_2" },
  { id: "rg_6", pageId: "pg_ch_ga2_1", status: "accepted", type: "panel", coords: { x: 0.05, y: 0.05, w: 0.9, h: 0.5 }, source: "ai", aiResultId: "ai_3" },
];

export const regionsByPage = (pageId: string) => regions.filter((r) => r.pageId === pageId);
