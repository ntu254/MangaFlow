export type ReviewPreviewKind = "image" | "pdf" | "external";
export type ReviewPreviewPlatform = "ios" | "android" | "web" | "windows" | "macos";

export interface ReviewFile {
  id: string;
  key: string;
  name: string;
  mimeType: string;
  size: number | null;
  version?: string;
  submittedAt?: string;
  submittedBy?: string;
  previewKind: ReviewPreviewKind;
}

export interface FileUrlLease {
  url: string;
  expiresAtMs: number;
}

export const DEFAULT_LEASE_MS = 8 * 60 * 1000;
export const REFRESH_SKEW_MS = 30 * 1000;

// iOS renders PDF inline through WKWebView. Android uses the PDF.js WebView
// viewer, while web has no react-native-webview implementation.
export function derivePreviewKind(mimeType: string, platform: ReviewPreviewPlatform): ReviewPreviewKind {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (normalizedMimeType.startsWith("image/")) return "image";
  if (normalizedMimeType === "application/pdf") return platform === "ios" || platform === "android" ? "pdf" : "external";
  return "external";
}

export function shouldRefreshLease(lease: FileUrlLease | null, nowMs: number): boolean {
  return !lease || nowMs >= lease.expiresAtMs - REFRESH_SKEW_MS;
}

export function resolveDisplayUrl(url: string, apiBaseUrl: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
    const absoluteUrl = new URL(url);
    if (absoluteUrl.hostname === "localhost" || absoluteUrl.hostname === "127.0.0.1") {
      const apiOrigin = new URL(apiBaseUrl).origin;
      return new URL(`${absoluteUrl.pathname}${absoluteUrl.search}${absoluteUrl.hash}`, apiOrigin).toString();
    }
    return url;
  }
  return new URL(url, apiBaseUrl).toString();
}

export function cleanFileName(rawName: string): string {
  if (!rawName) return "Submitted file";

  let cleaned = rawName.split("?")[0] ?? rawName;

  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // ignore decode error
  }

  const parts = cleaned.split(/[/\\]/);
  cleaned = parts[parts.length - 1] || cleaned;

  const extMatch = cleaned.match(/(\.[a-zA-Z0-9]{2,5})$/);
  const ext = extMatch ? extMatch[1] : "";
  const nameWithoutExt = ext ? cleaned.slice(0, -ext.length) : cleaned;

  let stripped = nameWithoutExt.replace(/^[0-9a-fA-F]{8,}[_-]/, "");
  stripped = stripped.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[_-]?/, "");
  stripped = stripped.replace(/^\d{10,14}[_-]?/, "");

  if (/^[0-9a-fA-F]{12,}$/.test(stripped)) {
    const shortHash = stripped.slice(0, 8);
    return `Submitted File (${shortHash}${ext})`;
  }

  const finalName = stripped.trim() ? `${stripped.trim()}${ext}` : cleaned;
  return finalName || "Submitted file";
}
