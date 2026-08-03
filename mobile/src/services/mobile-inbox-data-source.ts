import { mobileApi } from "@/services/mobile-api-client"
import { mobileInboxSchema, type MobileInbox } from "@/domain/mobile-work-item"
import { MobileRequestError, describeRequestFailure } from "@/services/mobile-request-diagnostics"
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

const INBOX_CONTEXT: Record<MobileAuthRole, string> = {
  editor: "Editor work",
  board: "Board work",
}

export function mobileInboxContext(role: MobileAuthRole): string {
  return INBOX_CONTEXT[role] ?? "your work"
}

export async function getMobileInbox(role: MobileAuthRole): Promise<MobileInbox> {
  const path = INBOX_PATH[role]
  // Fail closed rather than defaulting an unexpected role to the Board inbox.
  if (!path) throw new Error(`Unsupported mobile inbox role: ${String(role)}`)

  try {
    return mobileInboxSchema.parse(await mobileApi.request(path))
  } catch (error) {
    // Normalize HTTP, network, and contract failures into the same safe
    // diagnostic shape so the queue can explain itself without leaking the
    // response body. There is still no demo fallback.
    throw new MobileRequestError(describeRequestFailure(error, mobileInboxContext(role)))
  }
}
