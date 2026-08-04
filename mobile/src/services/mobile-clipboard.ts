import * as Clipboard from "expo-clipboard"
import { Platform } from "react-native"

// Minimal clipboard adapter. Native builds use Expo Clipboard; web uses the
// browser clipboard when available. Callers retain selectable text as fallback.
function webClipboard(): { writeText: (text: string) => Promise<void> } | null {
  const candidate = (globalThis as { navigator?: { clipboard?: { writeText?: unknown } } }).navigator
    ?.clipboard
  if (candidate && typeof candidate.writeText === "function") {
    return candidate as { writeText: (text: string) => Promise<void> }
  }
  return null
}

export function canCopyToClipboard(): boolean {
  return Platform.OS !== "web" || webClipboard() !== null
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS !== "web") {
      await Clipboard.setStringAsync(text)
      return true
    }
    const clipboard = webClipboard()
    if (!clipboard) return false
    await clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
