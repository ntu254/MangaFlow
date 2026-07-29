export function getSafeNotificationActionUrl(value?: string | null): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
