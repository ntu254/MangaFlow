export function formatStorageSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return "<1 MB";
  return `${Math.round(mb)} MB`;
}
