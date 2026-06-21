import { api } from "./_client";

type RegionCoords = { x: number; y: number; w: number; h: number };

function toServerType(type?: string): string | undefined {
  if (!type) return undefined;
  if (type === "polygon" || type === "background") return "AREA";
  return type.replace(/-/g, "_").toUpperCase();
}

function coordsToBbox(coords?: RegionCoords) {
  if (!coords) return undefined;
  const bounds = {
    x: coords.x,
    y: coords.y,
    width: coords.w,
    height: coords.h,
  };
  if (
    Object.values(bounds).some((value) => !Number.isFinite(value)) ||
    bounds.x < 0 ||
    bounds.y < 0 ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    bounds.x + bounds.width > 1 ||
    bounds.y + bounds.height > 1
  ) {
    throw new Error("Region bounds must be normalized within the working image");
  }
  return bounds;
}

function toRegionPayload(payload: any) {
  const bbox = payload.bbox ?? coordsToBbox(payload.coords);
  return {
    ...payload,
    type: toServerType(payload.type),
    bbox,
    coords: undefined,
  };
}

export const regionsApi = {
  // TODO: Migrate these routes from /api/files/... to /api/pages/... and /api/regions/...
  createRegion: async (pageId: string, payload: any) => {
    const res = await api.post(`/files/pages/${pageId}/regions`, toRegionPayload(payload));
    return res.data;
  },

  updateRegion: async (regionId: string, payload: any) => {
    const res = await api.patch(`/files/regions/${regionId}`, toRegionPayload(payload));
    return res.data;
  },

  deleteRegion: async (regionId: string) => {
    const res = await api.delete(`/files/regions/${regionId}`);
    return res.data;
  },
};
