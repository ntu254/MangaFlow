import type { ReadinessItem } from "../types";

export const publicationReadiness: ReadinessItem[] = [
  { label: "All pages uploaded", complete: true },
  { label: "All tasks approved", complete: true },
  { label: "All comments resolved", complete: false },
  { label: "Editor final approval", complete: true },
  { label: "Publication date set", complete: true }
];

