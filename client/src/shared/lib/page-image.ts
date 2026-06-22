export type PageImageMode = "thumbnail" | "preview" | "original" | "working" | "submitted";

export type PageImageAssetRef =
  | string
  | {
      _id?: string;
      id?: string;
    };

export type PageImageAssetInput = {
  thumbnailFileAssetId?: PageImageAssetRef | null;
  workingFileAssetId?: PageImageAssetRef | null;
  originalFileAssetId?: PageImageAssetRef | null;
  submittedFileAssetId?: PageImageAssetRef | null;
};

export function selectPageAssetId(
  assets: PageImageAssetInput,
  mode: PageImageMode = "thumbnail",
): string | undefined {
  const priority: Array<keyof PageImageAssetInput> =
    mode === "thumbnail"
      ? ["thumbnailFileAssetId", "workingFileAssetId", "originalFileAssetId"]
      : mode === "preview"
        ? ["workingFileAssetId", "originalFileAssetId", "thumbnailFileAssetId"]
        : mode === "original"
          ? ["originalFileAssetId", "workingFileAssetId", "thumbnailFileAssetId"]
          : mode === "submitted"
            ? ["submittedFileAssetId"]
            : ["workingFileAssetId", "originalFileAssetId", "thumbnailFileAssetId"];

  return priority.map((key) => normalizeFileAssetId(assets[key])).find(Boolean);
}

export function normalizeFileAssetId(value: PageImageAssetRef | null | undefined) {
  if (!value) return undefined;
  if (typeof value === "string") {
    return value.trim() || undefined;
  }
  return value.id?.trim() || value._id?.trim() || undefined;
}
