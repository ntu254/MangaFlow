// Minimal clipboard adapter. Mobile has no native clipboard dependency, so the
// one-tap copy is offered only where the platform provides it and the calling
// surface always keeps the same text selectable as a fallback.
function webClipboard(): { writeText: (text: string) => Promise<void> } | null {
  const candidate = (globalThis as { navigator?: { clipboard?: { writeText?: unknown } } }).navigator
    ?.clipboard
  if (candidate && typeof candidate.writeText === "function") {
    return candidate as { writeText: (text: string) => Promise<void> }
  }
  return null
}

export function canCopyToClipboard(): boolean {
  return webClipboard() !== null
}

export async function copyToClipboard(text: string): Promise<boolean> {
  const clipboard = webClipboard()
  if (!clipboard) return false
  try {
    await clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
