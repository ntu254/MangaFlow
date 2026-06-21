import { api } from "./_client";

const IMG_W = 800;
const IMG_H = 1131;

type RegionCoords = { x: number; y: number; w: number; h: number };

function toServerType(type?: string): string | undefined {
  if (!type) return undefined;
  if (type === "polygon" || type === "background") return "AREA";
  return type.replace(/-/g, "_").toUpperCase();
}

function coordsToBbox(coords?: RegionCoords) {
  if (!coords) return undefined;
  return {
    x: Math.round(coords.x * IMG_W),
    y: Math.round(coords.y * IMG_H),
    width: Math.round(coords.w * IMG_W),
    height: Math.round(coords.h * IMG_H),
  };
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
