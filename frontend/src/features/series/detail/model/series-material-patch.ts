export type SeriesMaterialPatchInput = {
  title?: string;
  chapterId?: string | null;
  tags?: string[];
  note?: string;
};

/** Build the attachment metadata patch accepted by the Supporting Material API. */
export function toSeriesMaterialApiPatch(input: SeriesMaterialPatchInput) {
  const metadata: Record<string, unknown> = {};
  if (input.note !== undefined) metadata.note = input.note;
  return {
    title: input.title,
    tags: input.tags,
    chapterId: input.chapterId,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
