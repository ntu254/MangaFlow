import { useMemo, useState } from "react"
import {
  Plus,
  Search,
  Crown,
  MoreHorizontal,
  Shield,
  CheckCircle2,
  Users as UsersIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge } from "@/components/shared/StatusBadge"

type BoardMember = {
  id: string
  name: string
  email: string
  initials: string
  isChair: boolean
  isActive: boolean
  termStart: string
  termEnd: string
  votesCast: number
  attendance: number
  avatarGradient: string
}

const MEMBERS: BoardMember[] = [
  { id: "b-001", name: "Kenji Watanabe", email: "kenji.w@mangaflow.local",   initials: "KW", isChair: true,  isActive: true,  termStart: "2024-01", termEnd: "2026-12", votesCast: 84, attendance: 96, avatarGradient: "from-orange-500 to-amber-500" },
  { id: "b-002", name: "Eri Suzuki",     email: "eri.s@mangaflow.local",     initials: "ES", isChair: false, isActive: true,  termStart: "2024-04", termEnd: "2026-03", votesCast: 76, attendance: 94, avatarGradient: "from-violet-500 to-fuchsia-500" },
  { id: "b-003", name: "Itō Sawamura",   email: "tantou.ito@mangaflow.local",initials: "IS", isChair: false, isActive: true,  termStart: "2025-01", termEnd: "2027-12", votesCast: 38, attendance: 89, avatarGradient: "from-purple-500 to-violet-500" },
  { id: "b-004", name: "Hayato Kimura",  email: "hayato@mangaflow.local",    initials: "HK", isChair: false, isActive: true,  termStart: "2025-02", termEnd: "2027-01", votesCast: 31, attendance: 92, avatarGradient: "from-blue-500 to-cyan-500" },
  { id: "b-005", name: "Sora Imai",      email: "sora.imai@mangaflow.local", initials: "SI", isChair: false, isActive: true,  termStart: "2024-06", termEnd: "2026-05", votesCast: 52, attendance: 88, avatarGradient: "from-pink-500 to-rose-500" },
  { id: "b-006", name: "Akari Mori",     email: "akari@mangaflow.local",     initials: "AM", isChair: false, isActive: true,  termStart: "2024-11", termEnd: "2026-10", votesCast: 41, attendance: 91, avatarGradient: "from-emerald-500 to-teal-500" },
  { id: "b-007", name: "Ryo Nakajima",   email: "ryo.n@mangaflow.local",     initials: "RN", isChair: false, isActive: true,  termStart: "2025-03", termEnd: "2027-02", votesCast: 17, attendance: 100, avatarGradient: "from-fuchsia-500 to-pink-500" },
  { id: "b-008", name: "Mio Fujita",     email: "mio.f@mangaflow.local",     initials: "MF", isChair: false, isActive: false, termStart: "2023-08", termEnd: "2025-08", votesCast: 28, attendance: 64, avatarGradient: "from-slate-400 to-slate-500" },
]

export default function BoardMembersPage() {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MEMBERS.filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [search])

  const active = MEMBERS.filter((m) => m.isActive).length
  const chair = MEMBERS.find((m) => m.isChair)

  return (
    <div className="space-y-8" data-testid="board-members-page">
      <PageHeader
        eyebrow="Admin · Governance"
        title="The editorial board"
        description="Composition, status and decision quorum. The quorum threshold for a series approval is majority + 1."
        actions={
          <Button data-testid="board-add-member">
            <Plus size={14} /> Add board member
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Members" value={MEMBERS.length} unit="seats" icon={Shield} tone="violet" />
        <StatTile label="Active" value={active} hint="eligible to vote" icon={CheckCircle2} tone="emerald" />
        <StatTile label="Quorum" value={`${Math.ceil(active / 2) + 1}`} unit="for approval" icon={UsersIcon} emphasis />
        <StatTile label="Chair" value={chair?.initials ?? "—"} hint={chair?.name ?? "vacant"} icon={Crown} tone="amber" />
      </div>

      <Panel
        eyebrow="Directory"
        title="All board members"
        icon={<Shield size={16} />}
        padding="none"
        action={
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              data-testid="board-search"
              className="h-9 pl-9"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50/70">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Term</th>
                <th className="px-5 py-3">Votes cast</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} data-testid={`board-row-${m.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${m.avatarGradient} text-xs font-semibold text-white shadow-soft`}>
                        {m.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          {m.name}
                          {m.isChair && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 border border-amber-200 px-1 py-0 text-[10px] font-medium text-amber-700">
                              <Crown size={10} /> Chair
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground num">
                    {m.termStart} → {m.termEnd}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium num">{m.votesCast}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${m.attendance}%` }} />
                      </div>
                      <span className="text-xs font-medium num">{m.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="inline-grid h-8 w-8 place-items-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                      aria-label="More"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
