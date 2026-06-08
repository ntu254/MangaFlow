import { MFBadge } from "@/shared/components/ui"

interface AdminSystemHealthItem {
  key: string
  label: string
  status: string
}

interface AdminSystemHealthProps {
  items?: AdminSystemHealthItem[]
}

function healthTone(status: string): "success" | "warning" | "neutral" {
  if (status === "OPERATIONAL" || status === "CONFIGURED") return "success"
  if (status.includes("PENDING")) return "warning"
  return "neutral"
}

export function AdminSystemHealth({ items = [] }: AdminSystemHealthProps) {
  const allReady = items.length > 0 && items.every((item) => item.status === "OPERATIONAL" || item.status === "CONFIGURED")

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-[0px_10px_30px_rgba(111,68,178,0.05)] relative overflow-hidden p-md">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-fixed-dim/20 rounded-full blur-2xl pointer-events-none" />
      <h3 className="text-title-lg font-title-lg text-on-surface flex items-center gap-sm mb-sm">
        <span className="material-symbols-outlined text-primary">monitor_heart</span>
        System Health
      </h3>
      <div className="mb-md p-sm rounded-lg bg-surface-container-low border border-primary-fixed flex items-center gap-sm">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary-container text-[18px]">{allReady ? "check_circle" : "pending"}</span>
        </div>
        <div>
          <h4 className="text-label-sm font-label-sm text-on-surface">{allReady ? "Core Systems Operational" : "MVP Integration Monitor"}</h4>
          <p className="text-[10px] text-on-surface-variant">Backend-owned health summary</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((svc) => (
          <div key={svc.key} className="flex justify-between items-center p-1.5 rounded-md bg-surface-container-low/50">
            <span className="text-[12px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-outline text-[14px]">monitor_heart</span>
              {svc.label}
            </span>
            <MFBadge tone={healthTone(svc.status)} size="sm">{svc.status.split("_").join(" ")}</MFBadge>
          </div>
        ))}
      </div>
    </div>
  )
}
