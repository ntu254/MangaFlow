import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts"

const barData = [
  { day: "Mon", value: 40 }, { day: "Tue", value: 65 }, { day: "Wed", value: 55 },
  { day: "Thu", value: 90, highlight: true }, { day: "Fri", value: 75 },
  { day: "Sat", value: 30 }, { day: "Sun", value: 45 },
]

const demoUsers = [
  { initials: "AY", name: "Akira Yamamoto", role: "Mangaka", roleColor: "bg-primary-fixed text-on-primary-fixed", status: "Active", statusColor: "bg-primary", avatarBg: "bg-secondary-fixed-dim text-on-secondary-fixed" },
  { initials: "KS", name: "Kenji Sato", role: "Assistant", roleColor: "bg-secondary-fixed text-on-secondary-fixed", status: "Active", statusColor: "bg-primary", avatarBg: "bg-tertiary-fixed-dim text-on-tertiary-fixed" },
  { initials: "MT", name: "Minato Takahashi", role: "Editor", roleColor: "bg-surface-container-highest text-on-surface-variant", status: "Suspended", statusColor: "bg-error", avatarBg: "bg-surface-container-highest text-on-surface-variant" },
  { initials: "admin", name: "System Admin", role: "Admin", roleColor: "bg-inverse-surface text-inverse-on-surface", status: "Active", statusColor: "bg-primary", avatarBg: "bg-primary-container text-on-primary-container" },
]

export function AdminUserTable() {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-[0px_10px_30px_rgba(111,68,178,0.05)] overflow-hidden flex flex-col">
      <div className="p-lg border-b border-surface-variant flex justify-between items-center bg-surface-bright">
        <h3 className="text-title-lg font-title-lg text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">manage_accounts</span>
          User Management Preview
        </h3>
        <button className="p-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm" title="Create User">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </button>
      </div>
      <div className="p-lg border-b border-surface-variant bg-surface-container-lowest">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
          <div>
            <h4 className="text-title-lg font-title-lg text-on-surface">Task Completion Statistics</h4>
            <div className="flex items-center gap-md mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-headline-md font-display text-primary">1,240</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">Tasks Completed</span>
              </div>
              <span className="flex items-center gap-1 text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span className="text-label-sm font-label-sm font-bold">+12%</span>
              </span>
            </div>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-full">
            {["Weekly", "Monthly", "Yearly"].map((tab) => (
              <button key={tab} className={`px-md py-1 text-label-sm font-label-sm rounded-full ${tab === "Weekly" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-variant transition-colors"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {barData.map((entry) => (
                  <Cell key={entry.day} fill={entry.highlight ? "#6750A4" : "#CAC4D0"} />
                ))}
              </Bar>
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload as typeof barData[number] | undefined
                  if (!d) return null
                  return (
                    <div className="bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                      {d.day}: {d.value} tasks
                    </div>
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-label-md font-label-md border-b border-surface-variant">
              <th className="py-md px-lg font-semibold">User</th>
              <th className="py-md px-lg font-semibold">Role</th>
              <th className="py-md px-lg font-semibold">Status</th>
              <th className="py-md px-lg font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body-md font-body-md divide-y divide-surface-variant">
            {demoUsers.map((user) => (
              <tr key={user.name} className="hover:bg-surface-container-lowest transition-colors group">
                <td className="px-lg py-1">
                  <div className="flex items-center gap-sm">
                    <div className={`w-8 h-8 rounded-full ${user.avatarBg} flex items-center justify-center font-bold text-label-sm`}>
                      {user.initials}
                    </div>
                    <span className="font-medium text-on-surface">{user.name}</span>
                  </div>
                </td>
                <td className="px-lg py-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm ${user.roleColor}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-lg py-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${user.statusColor}`} />
                    <span className="text-on-surface-variant">{user.status}</span>
                  </div>
                </td>
                <td className="px-lg text-right py-1">
                  <button className="p-1.5 text-outline hover:text-primary rounded-full hover:bg-primary-fixed transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-sm bg-surface-container-low text-center border-t border-surface-variant">
        <a className="text-label-md font-label-md text-primary hover:underline cursor-pointer">View all users</a>
      </div>
    </div>
  )
}
