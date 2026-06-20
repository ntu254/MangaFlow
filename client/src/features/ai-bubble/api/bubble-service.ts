// Client wrapper for the local AI bubble service (default http://localhost:8000).
// Phase 1: called directly from the browser. Be ready for CORS failure and surface it.

const KEY = "mangaflow.ai.baseUrl";
export const DEFAULT_AI_URL = "http://localhost:8000";

export function getAiBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_AI_URL;
  return localStorage.getItem(KEY) || DEFAULT_AI_URL;
}
export function setAiBaseUrl(url: string) {
  try {
    localStorage.setItem(KEY, url);
  } catch {}
}

export type Bubble = {
  id: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  has_mask?: boolean;
};

export type ProcessResponse = {
  bubbles: Bubble[];
  image_base64: string;
  image_mime_type: string;
};

async function postFile(path: string, file: File): Promise<Response> {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`${getAiBaseUrl()}${path}`, { method: "POST", body: fd });
}

export async function detect(file: File): Promise<{ bubbles: Bubble[] }> {
  const r = await postFile("/bubble/detect", file);
  if (!r.ok) throw new Error(`Detect failed: ${r.status}`);
  return r.json();
}

export async function whiten(file: File): Promise<string> {
  const r = await postFile("/bubble/whiten", file);
  if (!r.ok) throw new Error(`Whiten failed: ${r.status}`);
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

export async function process(file: File): Promise<ProcessResponse> {
  const r = await postFile("/bubble/process", file);
  if (!r.ok) throw new Error(`Process failed: ${r.status}`);
  return r.json();
}

export async function ping(): Promise<boolean> {
  try {
    const r = await fetch(`${getAiBaseUrl()}/`, { method: "GET" });
    return r.ok || r.status === 404; // server responded
  } catch {
    return false;
  }
}
