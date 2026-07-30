import { mobileApi } from "@/services/mobile-api-client"
import { mobileInboxSchema, type MobileInbox } from "@/domain/mobile-work-item"
import type { MobileAuthRole } from "@/services/mobile-auth"

export const mobileInboxKeys = {
  all: ["mobile-inbox"] as const,
  role: (role: MobileAuthRole) => [...mobileInboxKeys.all, role] as const,
}

// Validates the live inbox against the shared contract. A schema failure throws
// (surfaced as an error state) instead of silently degrading to demo data.
export async function getMobileInbox(role: MobileAuthRole): Promise<MobileInbox> {
  const path = role === "editor" ? "/editor/inbox" : "/board/inbox"
  return mobileInboxSchema.parse(await mobileApi.request(path))
}
