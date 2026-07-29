import type { SeriesMaterialStatus } from "@/entities/series/model/series-types";

export type SeriesMaterialPatchInput = {
  title?: string;
  chapterId?: string | null;
  tags?: string[];
  note?: string;
  status?: SeriesMaterialStatus;
};

/** Build the canonical API patch; status never goes back into metadata. */
export function toSeriesMaterialApiPatch(input: SeriesMaterialPatchInput) {
  const metadata: Record<string, unknown> = {};
  if (input.note !== undefined) metadata.note = input.note;
  return {
    title: input.title,
    status: input.status,
    tags: input.tags,
    chapterId: input.chapterId,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
