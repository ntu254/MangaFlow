import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
  PenLine,
  Sparkles,
  GalleryVerticalEnd,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { RoleBadge, StatusBadge } from "@/components/shared/StatusBadge"
import type { UserRole } from "@/types"
import { cn } from "@/lib/utils"

const ROLES: { value: UserRole; label: string; description: string; icon: React.ReactNode; tone: string }[] = [
  { value: "ADMIN",     label: "Admin",          description: "Manage users, governance & system settings",  icon: <Shield size={14} />,             tone: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "MANGAKA",   label: "Mangaka",        description: "Create series, run page studio",              icon: <PenLine size={14} />,            tone: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "ASSISTANT", label: "Assistant",      description: "Work assigned tasks · earn points",           icon: <Sparkles size={14} />,           tone: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "EDITOR",    label: "Tantou Editor",  description: "Review manuscripts and chapters",             icon: <GalleryVerticalEnd size={14} />, tone: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "BOARD",     label: "Editorial Board",description: "Cast decisions and votes",                    icon: <Crown size={14} />,              tone: "bg-orange-50 text-orange-700 border-orange-200" },
]

const TEAMS = ["Editorial", "Production", "Management", "Art", "Writing"]

export default function CreateUserPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    fullName: "",
    displayName: "",
    email: "",
    team: "",
    role: "" as UserRole | "",
    password: "",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED",
    notes: "",
  })

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => {
      if (!e[k]) return e
      const n = { ...e }
      delete n[k]
      return n
    })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = "Full name is required."
    if (!form.displayName.trim()) e.displayName = "Display name is required."
    if (!form.email.trim()) e.email = "Email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email."
    if (!form.role) e.role = "Choose a role."
    if (!form.team) e.team = "Choose a team."
    if (form.password.length < 8) e.password = "Minimum 8 characters."
    return e
  }

  const checklist = [
    { id: "fullName", label: "Full name", ok: form.fullName.trim().length > 0 },
    { id: "displayName", label: "Display name", ok: form.displayName.trim().length > 0 },
    { id: "email", label: "Valid email", ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) },
    { id: "role", label: "Role assigned", ok: !!form.role },
    { id: "team", label: "Team assigned", ok: !!form.team },
    { id: "password", label: "Password ≥ 8 chars", ok: form.password.length >= 8 },
  ]

  const formValid = checklist.every((c) => c.ok)

  const onSubmit = () => {
    const v = validate()
    if (Object.keys(v).length > 0) {
      setErrors(v)
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate("/app/admin/users")
    }, 700)
  }

  return (
    <div className="space-y-8" data-testid="create-user-page">
      <PageHeader
        eyebrow="Admin · Users"
        title="Invite a new member"
        description="Provision an account with the right role and scope. Backend will enforce permissions on every endpoint."
        actions={
          <Button variant="outline" asChild>
            <Link to="/app/admin/users" data-testid="create-user-back">
              <ArrowLeft size={14} /> Back to users
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Panel eyebrow="Profile" title="Basic information" icon={<Mail size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full name" required error={errors.fullName}>
                <Input data-testid="cu-fullname" placeholder="e.g. Yuki Tanaka" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
              </Field>
              <Field label="Email address" required error={errors.email}>
                <Input data-testid="cu-email" type="email" placeholder="member@mangaflow.studio" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field label="Display name" required error={errors.displayName}>
                <Input data-testid="cu-displayname" placeholder="How they appear in the studio" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} />
              </Field>
              <Field label="Team" required error={errors.team}>
                <Select value={form.team} onValueChange={(v) => update("team", v)}>
                  <SelectTrigger data-testid="cu-team"><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="Access" title="Role & status" icon={<Shield size={16} />}>
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">Role <span className="text-primary">*</span></Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="cu-role-grid">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => update("role", r.value)}
                      data-testid={`cu-role-${r.value.toLowerCase()}`}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:-translate-y-px",
                        form.role === r.value
                          ? "border-primary bg-primary-soft shadow-soft"
                          : "border-border bg-card hover:border-violet-300 hover:shadow-soft"
                      )}
                    >
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", r.tone)}>
                        {r.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{r.label}</span>
                          {form.role === r.value && <CheckCircle2 size={14} className="text-primary" />}
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.role && <p className="mt-2 text-xs text-destructive">{errors.role}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-border pt-5">
                <Field label="Initial password" required error={errors.password} hint="Minimum 8 chars. Share via a secure channel.">
                  <Input data-testid="cu-password" type="text" placeholder="••••••••" value={form.password} onChange={(e) => update("password", e.target.value)} />
                </Field>
                <Field label="Account status">
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger data-testid="cu-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Notes" title="Internal context" description="Optional. Visible to admins only." icon={<Mail size={16} />}>
            <Textarea
              data-testid="cu-notes"
              value={form.notes}
              maxLength={1000}
              placeholder="Onboarding notes, contracts, references…"
              onChange={(e) => update("notes", e.target.value)}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {form.notes.length} / 1000
            </div>
          </Panel>
        </div>

        {/* Right rail */}
        <div className="space-y-6 xl:sticky xl:top-24 self-start">
          <Panel eyebrow="Preview" title="Account card">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-base font-semibold shadow-soft">
                {(form.fullName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold leading-tight tracking-tight truncate">
                  {form.fullName || "Member name"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {form.email || "email@studio.com"}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {form.role && <RoleBadge role={form.role} />}
              <StatusBadge status={form.status} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              The member will receive role-aware navigation, scoped to their permissions.
            </p>
          </Panel>

          <Panel eyebrow="Validation" title="Ready to invite?">
            <ul className="space-y-2.5 text-sm">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  {c.ok ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={14} className="text-muted-foreground/60" />
                  )}
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              onClick={onSubmit}
              disabled={!formValid || submitting}
              className="mt-5 w-full"
              size="lg"
              data-testid="cu-submit"
            >
              <UserPlus size={14} />
              {submitting ? "Creating…" : "Create user"}
            </Button>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              The account will appear in the directory immediately.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
