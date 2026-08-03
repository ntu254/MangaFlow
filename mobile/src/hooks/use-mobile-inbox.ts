import { useQuery } from "@tanstack/react-query"
import { getMobileInbox, mobileInboxKeys } from "@/services/mobile-inbox-data-source"
import type { MobileAuthRole } from "@/services/mobile-auth"
import type { MobileInbox } from "@/domain/mobile-work-item"

// getInbox is injectable so tests can supply fixtures without hitting fetch.
export function useMobileInbox(
  role: MobileAuthRole,
  getInbox: (role: MobileAuthRole) => Promise<MobileInbox> = getMobileInbox,
) {
  return useQuery({
    queryKey: mobileInboxKeys.role(role),
    queryFn: () => getInbox(role),
  })
}
