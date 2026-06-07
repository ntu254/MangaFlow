const activityLogs = [
  { time: "10 mins ago", text: 'User <strong>Kenji Sato</strong> role updated to Assistant.', dotColor: "bg-primary-fixed" },
  { time: "1 hour ago", text: 'New Series <strong class="text-primary">"Neon Samurai"</strong> created by Akira Y.', dotColor: "bg-secondary-fixed" },
  { time: "3 hours ago", text: "System backup completed successfully (1.2TB).", dotColor: "bg-surface-container-highest" },
  { time: "5 hours ago", text: 'Storage quota warning issued for workspace <span class="italic">Studio G</span>.', dotColor: "bg-tertiary-fixed" },
]

export function AdminActivityLog() {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-[0px_10px_30px_rgba(111,68,178,0.05)] max-h-[400px] overflow-y-auto p-md">
      <h3 className="text-title-lg font-title-lg text-on-surface mb-md flex items-center gap-sm">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        Recent Activity
      </h3>
      <div className="relative pl-md border-l-2 border-surface-variant mt-sm space-y-xs">
        {activityLogs.map((log, i) => (
          <div key={i} className="relative">
            <div className={`absolute -left-[25px] top-1 w-3 h-3 ${log.dotColor} border-2 border-surface-container-lowest rounded-full`} />
            <p className="text-label-sm font-label-sm text-outline mb-0.5">{log.time}</p>
            <p className="text-body-md font-body-md text-on-surface" dangerouslySetInnerHTML={{ __html: log.text }} />
          </div>
        ))}
      </div>
      <div className="mt-md pt-sm text-center">
        <a className="text-label-md font-label-md text-primary hover:underline cursor-pointer">View full audit log</a>
      </div>
    </div>
  )
}
