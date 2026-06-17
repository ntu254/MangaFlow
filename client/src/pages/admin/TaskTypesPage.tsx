import { useMemo, useState } from "react"
import {
  Plus,
  Search,
  Settings,
  MoreHorizontal,
  CheckCircle2,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge } from "@/components/shared/StatusBadge"

type TaskType = {
  id: string
  name: string
  code: string
  description: string
  rate: number
  currency: "POINT" | "VND"
  scope: ("region" | "page")[]
  isActive: boolean
}

const TYPES: TaskType[] = [
  { id: "tt-1", name: "Background inking",   code: "BG_INK",       description: "Region or page-scoped inking on background panels.",  rate: 25,    currency: "POINT", scope: ["region", "page"], isActive: true },
  { id: "tt-2", name: "Region tone",         code: "REGION_TONE",  description: "Tone screen application on selected region.",          rate: 20,    currency: "POINT", scope: ["region"],         isActive: true },
  { id: "tt-3", name: "Lettering placement", code: "LETTERING",    description: "SFX and dialogue letter placement.",                   rate: 30,    currency: "POINT", scope: ["page"],           isActive: true },
  { id: "tt-4", name: "Cover finish",        code: "COVER_FIN",    description: "Final color pass and typography on chapter cover.",   rate: 60000, currency: "VND",   scope: ["page"],           isActive: true },
  { id: "tt-5", name: "Panel cleanup",       code: "CLEANUP",      description: "Cleanup eraser pass on regions or pages.",             rate: 15,    currency: "POINT", scope: ["region", "page"], isActive: true },
  { id: "tt-6", name: "Color flat",          code: "COLOR_FLAT",   description: "Initial flat color layer for color chapters.",        rate: 40,    currency: "POINT", scope: ["region"],         isActive: false },
]

const POINT_TO_VND = 1500

export default function TaskTypesPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TYPES.filter((t) => {
      const matches = !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      const s = status === "ALL" || (status === "ACTIVE" ? t.isActive : !t.isActive)
      return matches && s
    })
  }, [search, status])

  const active = TYPES.filter((t) => t.isActive).length

  return (
    <div className="space-y-8" data-testid="task-types-page">
      <PageHeader
        eyebrow="Admin · Configuration"
        title="Production task templates"
        description="Define the building blocks of studio work — name, default rate, scope. Used everywhere tasks are assigned."
        actions={
          <Button data-testid="tasktype-add">
            <Plus size={14} /> Add task type
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Templates" value={TYPES.length} unit="defined" icon={Layers} tone="violet" />
        <StatTile label="Active" value={active} hint="available to assign" icon={CheckCircle2} tone="emerald" />
        <StatTile label="Avg rate" value="28" unit="pts" hint="≈ ¥ 42k" icon={Settings} tone="blue" emphasis />
        <StatTile label="Region-only" value={TYPES.filter((t) => t.scope.length === 1 && t.scope[0] === "region").length} hint="micro tasks" icon={Layers} tone="amber" />
      </div>

      <Panel
        eyebrow="Library"
        title="All task types"
        icon={<Settings size={16} />}
        padding="none"
        action={
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name…"
                data-testid="tasktype-search"
                className="h-9 pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as never)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-testid="tasktype-status"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50/70">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Code · Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Scope</th>
                <th className="px-5 py-3">Rate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  data-testid={`tasktype-row-${t.id}`}
                  className="hover:bg-slate-50 transition-colors align-top"
                >
                  <td className="px-5 py-4">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.code}
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-tight tracking-tight">
                      {t.name}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground max-w-md">{t.description}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {t.scope.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-base font-semibold leading-none num">
                      {t.currency === "POINT" ? `${t.rate} pts` : `¥ ${t.rate.toLocaleString()}`}
                    </div>
                    {t.currency === "POINT" && (
                      <div className="mt-1 text-[11px] text-muted-foreground num">
                        ≈ ¥ {(t.rate * POINT_TO_VND).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-4 text-right">
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
