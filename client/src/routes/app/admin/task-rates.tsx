import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, PowerOff, Save } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/layouts/AppShell";
import {
  useCreateTaskRate,
  useTaskRates,
  useUpdateTaskRate,
  useUpdateTaskRateStatus,
} from "@/shared/queries/useAdmin";
import type { AdminTaskRate } from "@/shared/api/admin";
import { useRole } from "@/shared/lib/role";

export const Route = createFileRoute("/app/admin/task-rates")({
  component: TaskRatesPage,
});

function TaskRatesPage() {
  const { user } = useRole();
  const canAccessAdmin = user?.role === "ADMIN";
  const { data: rates = [], isLoading, error } = useTaskRates({ enabled: canAccessAdmin });
  const createRate = useCreateTaskRate();
  const updateRate = useUpdateTaskRate();
  const updateStatus = useUpdateTaskRateStatus();
  const [editing, setEditing] = useState<AdminTaskRate | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    baseRate: "1000",
    currency: "VND" as AdminTaskRate["currency"],
    description: "",
  });

  const totals = useMemo(
    () => ({
      active: rates.filter((rate) => rate.isActive).length,
      disabled: rates.filter((rate) => !rate.isActive).length,
      average: rates.length
        ? Math.round(
            rates.reduce((sum, rate) => sum + Number(rate.baseRate || 0), 0) / rates.length,
          )
        : 0,
    }),
    [rates],
  );

  if (!canAccessAdmin) {
    return (
      <div className="admin-console admin-page space-y-5">
        <PageHeader title="Task Rates" jp="Rate cards" />
        <EmptyState
          title="Admin permission required"
          hint="Sign in as Admin to view and manage task payout rates."
        />
      </div>
    );
  }

  function resetForm(rate?: AdminTaskRate) {
    setEditing(rate ?? null);
    setDraft(
      rate
        ? {
            name: rate.name,
            code: rate.code,
            baseRate: String(rate.baseRate),
            currency: rate.currency ?? "VND",
            description: rate.description ?? "",
          }
        : { name: "", code: "", baseRate: "1000", currency: "VND", description: "" },
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = {
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      baseRate: Number(draft.baseRate),
      description: draft.description.trim() || undefined,
      currency: draft.currency,
      allowPageTask: true,
      allowRegionTask: true,
      requiresFileSubmission: true,
    };

    if (editing) {
      updateRate.mutate({ id: editing.id, input }, { onSuccess: () => resetForm() });
    } else {
      createRate.mutate(input, { onSuccess: () => resetForm() });
    }
  }

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Task Rates"
        jp="Rate cards"
        description="View, create, update, and disable production task payout rates."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active rates" value={String(totals.active)} />
        <StatCard label="Disabled rates" value={String(totals.disabled)} />
        <StatCard label="Average base rate" value={formatRate(totals.average, "VND")} hint="VND" />
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-md border border-foreground/10 bg-card p-4 lg:grid-cols-[1fr_0.7fr_0.5fr_0.5fr_1.5fr_auto]"
      >
        <Field label="Name">
          <input
            required
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            className="input"
            placeholder="Lettering"
          />
        </Field>
        <Field label="Code">
          <input
            required
            value={draft.code}
            onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
            className="input uppercase"
            placeholder="LETTERING"
          />
        </Field>
        <Field label="Base rate">
          <input
            required
            min={0}
            type="number"
            value={draft.baseRate}
            onChange={(event) => setDraft((prev) => ({ ...prev, baseRate: event.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Currency">
          <select
            required
            value={draft.currency}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                currency: event.target.value as AdminTaskRate["currency"],
              }))
            }
            className="input"
          >
            <option value="VND">VND</option>
            <option value="POINT">POINT</option>
          </select>
        </Field>
        <Field label="Description">
          <input
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            className="input"
            placeholder="Optional rate note"
          />
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={createRate.isPending || updateRate.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {editing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="h-9 rounded-md border border-foreground/15 px-3 text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_0.8fr_1.5fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Name</span>
          <span>Code</span>
          <span>Rate</span>
          <span>Currency</span>
          <span>Status</span>
          <span>Description</span>
          <span />
        </div>

        {error ? (
          <div className="px-4 py-8 text-sm text-destructive">{(error as Error).message}</div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : rates.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-foreground/50">
            No task rates configured yet.
          </div>
        ) : (
          rates.map((rate) => (
            <div
              key={rate.id}
              className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_0.8fr_1.5fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-medium">{rate.name}</span>
              <span className="font-mono text-xs text-foreground/70">{rate.code}</span>
              <span className="tabular-nums">{formatRate(rate.baseRate, rate.currency)}</span>
              <span className="font-mono text-xs text-foreground/60">{rate.currency ?? "VND"}</span>
              <span className={rate.isActive ? "text-emerald-500" : "text-foreground/40"}>
                {rate.isActive ? "Active" : "Disabled"}
              </span>
              <span className="truncate text-foreground/60">{rate.description || "-"}</span>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => resetForm(rate)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-xs text-foreground/70"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: rate.id, isActive: !rate.isActive })}
                  disabled={updateStatus.isPending}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-xs text-foreground/70 disabled:opacity-40"
                >
                  {rate.isActive ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                  {rate.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .input {
          height: 36px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid rgba(127, 127, 127, 0.22);
          background: rgba(127, 127, 127, 0.05);
          padding: 0 10px;
          font-size: 13px;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function formatRate(value: number, currency: AdminTaskRate["currency"] = "VND") {
  if (currency === "POINT") return `${new Intl.NumberFormat("en-US").format(value || 0)} pts`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
