interface AdminActivityLogProps {
  entries?: string[]
}

export function AdminActivityLog({ entries = [] }: AdminActivityLogProps) {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-[0px_10px_30px_rgba(111,68,178,0.05)] max-h-[400px] overflow-y-auto p-md">
      <h3 className="text-title-lg font-title-lg text-on-surface mb-md flex items-center gap-sm">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        Recent Activity
      </h3>
      <div className="relative pl-md border-l-2 border-surface-variant mt-sm space-y-xs">
        {entries.map((text, i) => (
          <div key={`${text}-${i}`} className="relative">
            <div className="absolute -left-[25px] top-1 w-3 h-3 bg-primary-fixed border-2 border-surface-container-lowest rounded-full" />
            <p className="text-label-sm font-label-sm text-outline mb-0.5">API summary</p>
            <p className="text-body-md font-body-md text-on-surface">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-md rounded-2xl bg-surface-low p-sm text-label-sm text-on-surface-muted">
        Audit preview is read-only. Admin dashboard does not expose Board decision overrides.
      </div>
    </div>
  )
}
