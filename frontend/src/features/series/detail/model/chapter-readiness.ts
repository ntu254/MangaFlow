export type CanonicalChapterReadiness = {
  ready: boolean;
  items?: Array<{ key: string; passed: boolean; reason?: string }>;
};

/** The backend readiness response is the only source of truth for this gate. */
export function isCanonicalChapterReady(readiness?: CanonicalChapterReadiness | null): boolean {
  return readiness?.ready === true;
}
