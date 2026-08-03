import assert from "node:assert/strict";
import {
  hasManuscriptFileChanged,
  latestManuscriptVersion,
  proposalSubmissionPackageItems,
  proposalSupportingMaterialItems,
} from "./proposal-attachments.js";
import { MATERIAL_KIND_LABEL, type SeriesProposal } from "./proposal-types.js";

const proposal = {
  id: "proposal-contract",
  sampleChapterUrl: "https://legacy.example/sample.pdf",
  manuscripts: [
    {
      id: "manuscript-v1",
      version: 1,
      fileName: "chapter-v1.pdf",
      fileUrl: "https://files.example/chapter-v1.pdf",
      fileType: "application/pdf",
      sizeKB: 1200,
    },
  ],
  materials: [
    {
      id: "character-sheet",
      kind: "character",
      title: "Character sheet",
      fileName: "characters.png",
      fileUrl: "https://files.example/characters.png",
      fileType: "image/png",
      sizeKB: 800,
    },
  ],
} as SeriesProposal;

const supporting = proposalSupportingMaterialItems(proposal);
assert.deepEqual(
  supporting.map((item) => item.id),
  ["character-sheet"],
);
assert.ok(supporting.every((item) => item.kind === "material"));

const reviewPackage = proposalSubmissionPackageItems(proposal);
assert.deepEqual(
  reviewPackage.map((item) => item.id),
  ["manuscript-v1", "character-sheet"],
);
assert.ok(reviewPackage.every((item) => String(item.kind) !== "sample"));

assert.equal(
  hasManuscriptFileChanged(
    { fileKey: "proposal/new.pdf", fileUrl: "metadata://signed-url-not-issued" },
    { fileKey: "proposal/old.pdf", fileUrl: "metadata://signed-url-not-issued" },
  ),
  true,
);
assert.equal(
  hasManuscriptFileChanged(
    {
      fileKey: "proposal/current.pdf",
      fileUrl: "metadata://signed-url-not-issued",
    },
    { fileKey: "proposal/current.pdf", fileUrl: "metadata://signed-url-not-issued" },
  ),
  false,
);
assert.equal(
  latestManuscriptVersion([
    { id: "v3", version: 3 },
    { id: "v1", version: 1 },
    { id: "v2", version: 2 },
  ])?.id,
  "v3",
);
assert.equal((MATERIAL_KIND_LABEL as Record<string, string>).storyboard, "Storyboard / Name");

console.log("proposal attachment contract: PASS");
