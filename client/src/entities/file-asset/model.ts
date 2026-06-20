export type FileAssetKind = "original" | "working" | "thumbnail";

export type FileAsset = {
  id: string;
  kind: FileAssetKind;
  url: string; // placeholder URL
  width: number;
  height: number;
  bytes: number;
};

let counter = 1;
const make = (kind: FileAssetKind, w: number, h: number, bytes: number): FileAsset => ({
  id: `fa_${counter++}`,
  kind,
  url: `mock://file-asset/${kind}/${counter}`,
  width: w,
  height: h,
  bytes,
});

// 30 pages × 3 assets each (mock seed)
export const fileAssets: FileAsset[] = Array.from({ length: 30 }).flatMap(() => [
  make("original", 2480, 3508, 4_800_000),
  make("working", 1240, 1754, 820_000),
  make("thumbnail", 240, 340, 18_000),
]);

export const findFileAsset = (id: string) => fileAssets.find((a) => a.id === id);
