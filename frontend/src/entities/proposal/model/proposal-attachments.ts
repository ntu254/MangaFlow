import type { ManuscriptVersion, SeriesProposal, SupportingMaterialKind } from "./proposal-types";
import { MATERIAL_KIND_LABEL } from "./proposal-types";

export type ProposalAttachmentItem = {
  kind: "manuscript" | "material";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  fileKey?: string;
  fileType: string;
  materialKind?: SupportingMaterialKind;
};

type ManuscriptFileIdentity = Pick<ManuscriptVersion, "fileKey" | "fileUrl">;

export function hasManuscriptFileChanged(
  next: ManuscriptFileIdentity | null | undefined,
  current: ManuscriptFileIdentity | null | undefined,
) {
  if (!next) return false;
  if (!current) return true;
  const nextKey = next.fileKey?.trim() ?? "";
  const currentKey = current.fileKey?.trim() ?? "";
  if (nextKey || currentKey) return nextKey !== currentKey;
  return next.fileUrl !== current.fileUrl;
}

export function latestManuscriptVersion<T extends Pick<ManuscriptVersion, "version">>(
  manuscripts: readonly T[],
): T | undefined {
  return manuscripts.reduce<T | undefined>(
    (latest, item) => (!latest || item.version > latest.version ? item : latest),
    undefined,
  );
}

export function proposalSupportingMaterialItems(
  proposal: SeriesProposal,
): ProposalAttachmentItem[] {
  return proposal.materials.map((material) => ({
    kind: "material",
    id: material.id,
    title: material.title,
    subtitle: `${MATERIAL_KIND_LABEL[material.kind]} · ${material.fileName} · ${material.sizeKB} KB`,
    url: material.fileUrl,
    fileKey: material.fileKey,
    fileType: material.fileType,
    materialKind: material.kind,
  }));
}

export function proposalSubmissionPackageItems(proposal: SeriesProposal): ProposalAttachmentItem[] {
  const manuscripts: ProposalAttachmentItem[] = [...proposal.manuscripts]
    .sort((left, right) => right.version - left.version)
    .map((manuscript) => ({
      kind: "manuscript",
      id: manuscript.id,
      title: `Manuscript v${manuscript.version}`,
      subtitle: `${manuscript.fileName} · ${manuscript.sizeKB} KB`,
      url: manuscript.fileUrl,
      fileKey: manuscript.fileKey,
      fileType: manuscript.fileType,
    }));

  // sampleChapterUrl is a legacy fallback, never a second attachment beside a
  // versioned Manuscript.
  if (manuscripts.length === 0 && proposal.sampleChapterUrl) {
    manuscripts.push({
      kind: "manuscript",
      id: `legacy-manuscript-${proposal.id}`,
      title: "Manuscript",
      subtitle: "Legacy sample chapter",
      url: proposal.sampleChapterUrl,
      fileType: inferFileType(proposal.sampleChapterUrl),
    });
  }

  return [...manuscripts, ...proposalSupportingMaterialItems(proposal)];
}

function inferFileType(url: string) {
  const path = url.split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(?:png|jpe?g|webp|gif)$/.test(path)) return "image/*";
  if (path.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}
