import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  MoreHorizontal,
  Users as UsersIcon,
  UserCheck,
  Clock,
  UserX,
  Filter,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge, RoleBadge } from "@/components/shared/StatusBadge"
import { Panel } from "@/components/shared/Panel"
import { cn } from "@/lib/utils"
import type { UserRole, UserStatus } from "@/types"

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus | "PENDING_INVITE"
  team: string
  lastSeen: string
  initials: string
  avatarGradient: string
}

const USERS: UserRow[] = [
  { id: "u-001", name: "Mika Tanaka",      email: "mika.tanaka@mangaflow.local",   role: "MANGAKA",   status: "ACTIVE",         team: "Art",         lastSeen: "2 min ago",  initials: "MT", avatarGradient: "from-violet-500 to-fuchsia-500" },
  { id: "u-002", name: "Itō Sawamura",     email: "tantou.ito@mangaflow.local",    role: "EDITOR",    status: "ACTIVE",         team: "Editorial",   lastSeen: "12 min ago", initials: "IS", avatarGradient: "from-purple-500 to-violet-500" },
  { id: "u-003", name: "Yuto Kondō",       email: "yuto@mangaflow.local",          role: "ASSISTANT", status: "ACTIVE",         team: "Production",  lastSeen: "1 h ago",    initials: "YK", avatarGradient: "from-blue-500 to-cyan-500" },
  { id: "u-004", name: "Kenji Watanabe",   email: "board.kenji@mangaflow.local",   role: "BOARD",     status: "ACTIVE",         team: "Management",  lastSeen: "today",      initials: "KW", avatarGradient: "from-orange-500 to-amber-500" },
  { id: "u-005", name: "Aoi Mori",         email: "aoi.mori@mangaflow.local",      role: "MANGAKA",   status: "ACTIVE",         team: "Writing",     lastSeen: "3 h ago",    initials: "AM", avatarGradient: "from-pink-500 to-rose-500" },
  { id: "u-006", name: "Hideki Aoyama",    email: "hideki@mangaflow.local",        role: "MANGAKA",   status: "ACTIVE",         team: "Art",         lastSeen: "yesterday",  initials: "HA", avatarGradient: "from-fuchsia-500 to-pink-500" },
  { id: "u-007", name: "Naomi Saitō",      email: "naomi.s@mangaflow.local",       role: "ASSISTANT", status: "PENDING_INVITE", team: "Production",  lastSeen: "—",          initials: "NS", avatarGradient: "from-slate-400 to-slate-500" },
  { id: "u-008", name: "Riku Hashimoto",   email: "rh@mangaflow.local",            role: "ASSISTANT", status: "ACTIVE",         team: "Production",  lastSeen: "4 h ago",    initials: "RH", avatarGradient: "from-cyan-500 to-teal-500" },
  { id: "u-009", name: "Sora Imai",        email: "sora.imai@mangaflow.local",     role: "EDITOR",    status: "ACTIVE",         team: "Editorial",   lastSeen: "2 days ago", initials: "SI", avatarGradient: "from-purple-500 to-indigo-500" },
  { id: "u-010", name: "Ken Furukawa",     email: "ken@mangaflow.local",           role: "ASSISTANT", status: "SUSPENDED",      team: "Production",  lastSeen: "1 month ago",initials: "KF", avatarGradient: "from-rose-400 to-red-500" },
  { id: "u-011", name: "Naoko Hayashi",    email: "admin@mangaflow.local",         role: "ADMIN",     status: "ACTIVE",         team: "Management",  lastSeen: "now",        initials: "NH", avatarGradient: "from-slate-700 to-slate-900" },
  { id: "u-012", name: "Eri Suzuki",       email: "eri@mangaflow.local",           role: "BOARD",     status: "ACTIVE",         team: "Management",  lastSeen: "5 h ago",    initials: "ES", avatarGradient: "from-amber-500 to-orange-500" },
]

const ROLE_OPTIONS: { value: "ALL" | UserRole; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANGAKA", label: "Mangaka" },
  { value: "ASSISTANT", label: "Assistant" },
  { value: "EDITOR", label: "Editor" },
  { value: "BOARD", label: "Board" },
]

const STATUS_OPTIONS: { value: "ALL" | UserRow["status"]; label: string }[] = [
  { value: "ALL", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_INVITE", label: "Pending invite" },
  { value: "SUSPENDED", label: "Suspended" },
]

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"ALL" | UserRole>("ALL")
  const [status, setStatus] = useState<"ALL" | UserRow["status"]>("ALL")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return USERS.filter((u) => {
      const ok = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.team.toLowerCase().includes(q)
      const r = role === "ALL" || u.role === role
      const s = status === "ALL" || u.status === status
      return ok && r && s
    })
  }, [search, role, status])

  const active = USERS.filter((u) => u.status === "ACTIVE").length
  const pending = USERS.filter((u) => u.status === "PENDING_INVITE").length
  const suspended = USERS.filter((u) => u.status === "SUSPENDED").length

  return (
    <div className="space-y-8" data-testid="admin-users-page">
      <PageHeader
        eyebrow="Admin · Users"
        title="Members of the studio"
        description="Create, search and steward studio accounts. Roles map to dashboards; status governs access."
        actions={
          <>
            <Button variant="outline" data-testid="users-export">
              <Download size={14} /> Export CSV
            </Button>
            <Button asChild data-testid="users-invite">
              <Link to="/app/admin/users/create">
                <Plus size={14} /> Invite member
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total" value={USERS.length} unit="accounts" icon={UsersIcon} tone="violet" />
        <StatTile label="Active" value={active} unit="signed-in" icon={UserCheck} tone="emerald" />
        <StatTile label="Pending invite" value={pending} unit="queued" icon={Clock} tone="amber" />
        <StatTile label="Suspended" value={suspended} hint="locked accounts" icon={UserX} tone="rose" />
      </div>

      <Panel
        eyebrow="Directory"
        title="All members"
        description={`${filtered.length} of ${USERS.length} shown`}
        icon={<UsersIcon size={16} />}
        padding="none"
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, team…"
                data-testid="users-search"
                className="h-9 pl-9"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as never)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-testid="users-role-filter"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as never)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-testid="users-status-filter"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50/70">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Team</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.id}`}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white bg-gradient-to-br shadow-soft",
                        u.avatarGradient
                      )}>
                        {u.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{u.team}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{u.lastSeen}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="inline-grid h-8 w-8 place-items-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground transition-colors"
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                <UsersIcon size={20} />
              </div>
              <p className="text-base font-semibold">No member matches that search.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust your filters, or invite a new member.
              </p>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border bg-slate-50/70 px-5 py-3 text-xs text-muted-foreground">
          <span>{filtered.length} accounts</span>
          <div className="flex items-center gap-2">
            <Filter size={12} />
            <span>Page 1 / 1</span>
          </div>
        </footer>
      </Panel>
    </div>
  )
}
