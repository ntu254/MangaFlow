import type { ReadinessItem } from "../types";

export function canApprovePublication(items: ReadinessItem[]) {
  return items.every((item) => item.complete);
}

