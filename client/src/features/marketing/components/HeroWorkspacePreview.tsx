import { MFBadge } from "@/shared/components/ui/MFBadge"

export function HeroWorkspacePreview() {
  return (
    <div className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient p-md md:p-lg transform rotate-1 hover:rotate-0 transition-transform duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-lg pb-md border-b border-outline-variant/20">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px] icon-fill">book_4</span>
          </div>
          <div>
            <h3 className="font-title-lg text-title-lg font-semibold text-on-surface">Chapter 08 — Shonen Dream</h3>
            <div className="flex items-center gap-sm mt-xs">
              <MFBadge tone="warning" size="sm">Draft</MFBadge>
              <span className="font-label-sm text-label-sm text-on-surface-variant">v3 · 42/50 pages</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Progress</p>
          <div className="flex items-center gap-sm">
            <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[84%] rounded-full" />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface font-bold">42/50 pages</span>
          </div>
        </div>
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-3 gap-md mb-lg">
        {[
          { page: 40, status: "warning" as const, label: "Submitted", version: "v3" },
          { page: 42, status: "danger" as const, label: "Revision", version: "v1" },
          { page: 45, status: "primary" as const, label: "Approved", version: "v2" },
        ].map((item) => (
          <div key={item.page} className="aspect-[2/3] bg-surface-container-low rounded-md border border-outline-variant/20 relative overflow-hidden group">
            <div className="p-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-xs">
                <span className="font-label-sm text-label-sm text-on-surface font-bold">Pg {item.page}</span>
                <span className="font-label-sm text-label-sm text-on-surface-muted">{item.version}</span>
              </div>
              <div className="flex-1 rounded-md bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-muted text-[32px]">image</span>
              </div>
              <div className="mt-3.5 flex items-center justify-end">
                <MFBadge tone={item.status} size="sm">{item.label}</MFBadge>
              </div>
            </div>
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-primary bg-surface-container-lowest p-xs rounded-full shadow-sm">visibility</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="bg-surface-bright rounded-lg p-md border border-outline-variant/20 mb-lg">
        <h4 className="font-label-md text-label-md text-on-surface mb-sm flex items-center gap-sm">
          <span className="material-symbols-outlined text-[16px]">list_alt</span> Action Items
        </h4>
        <div className="space-y-sm">
          <div className="flex items-center justify-between p-sm bg-surface-container-lowest rounded-md border border-outline-variant/10">
            <div className="flex items-center gap-sm min-w-0">
              <span className="material-symbols-outlined text-secondary text-[16px]">brush</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate">Pg 40 Background cleanup</span>
            </div>
            <div className="flex -space-x-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-label-sm text-[10px] border border-surface-container-lowest z-10">AK</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-sm bg-surface-container-lowest rounded-md border border-outline-variant/10">
            <div className="flex items-center gap-sm min-w-0">
              <span className="material-symbols-outlined text-error text-[16px]">campaign</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate">Pg 42 Lettering correction</span>
            </div>
            <div className="flex -space-x-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-[10px] border border-surface-container-lowest z-10">MK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Board vote */}
      <div className="flex items-center justify-between rounded-lg bg-primary-fixed/30 p-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-[20px]">how_to_vote</span>
          <span className="font-label-md text-label-md text-on-surface font-semibold">Board Vote</span>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex gap-xs">
            {[true, true, true, false, false].map((approved, i) => (
              <div key={i} className={`h-3 w-3 rounded-full border ${approved ? "bg-tertiary border-tertiary" : "bg-surface-container-highest border-outline-variant"}`} />
            ))}
          </div>
          <MFBadge tone="success" size="md">3/5 approved</MFBadge>
        </div>
      </div>
    </div>
  )
}
