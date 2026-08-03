import { mobileApi } from "@/services/mobile-api-client"
import { mobileInboxSchema, type MobileInbox } from "@/domain/mobile-work-item"
import type { MobileAuthRole } from "@/services/mobile-auth"

export const mobileInboxKeys = {
  all: ["mobile-inbox"] as const,
  role: (role: MobileAuthRole) => [...mobileInboxKeys.all, role] as const,
}

// Validates the live inbox against the shared contract. A schema failure throws
// (surfaced as an error state) instead of silently degrading to demo data.
const INBOX_PATH: Record<MobileAuthRole, string> = {
  editor: "/editor/inbox",
  board: "/board/inbox",
}

export async function getMobileInbox(role: MobileAuthRole): Promise<MobileInbox> {
  const path = INBOX_PATH[role]
  // Fail closed rather than defaulting an unexpected role to the Board inbox.
  if (!path) throw new Error(`Unsupported mobile inbox role: ${String(role)}`)
  return mobileInboxSchema.parse(await mobileApi.request(path))
}
