export function isRenderableFileUrl(url?: string | null) {
  if (!url) return false;
  const value = url.trim();
  return Boolean(
    value &&
    !value.startsWith("metadata://") &&
    (value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("/") ||
      value.startsWith("data:image/") ||
      value.startsWith("blob:")),
  );
}
