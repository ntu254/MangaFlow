import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, CircleHelp, Clock3, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import type { RateTableEntry } from "@/shared/api/rate-table";
import {
  DataPagination,
  DataTable,
  MetricCard,
  MetricGrid,
  PageFrame,
  PageHeader,
  SearchToolbar,
  SortableHeader,
  StateBlock,
} from "@/shared/ui";
import { AccessDenied, mapAdminError, useAdminAccess } from "../../_shared";
import {
  useAdminRateTableQuery,
  useCreateRateTableMutation,
  usePatchRateTableMutation,
} from "../api/rate-table.queries";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const ROWS_PER_PAGE = 8;

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminRateTablePage() {
  const { canQueryAdmin, denial } = useAdminAccess();
  const {
    data: rates = [],
    isLoading,
    error,
    refetch,
  } = useAdminRateTableQuery({ enabled: canQueryAdmin });
  const createMutation = useCreateRateTableMutation();
  const patchMutation = usePatchRateTableMutation();

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [workUnitType, setWorkUnitType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingRateId, setPendingRateId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const activeCount = rates.filter((rate) => rate.status === "ACTIVE").length;
  const inactiveCount = rates.filter((rate) => rate.status === "INACTIVE").length;
  const codeCount = new Set(rates.map((rate) => rate.code)).size;
  const currencyCount = new Set(rates.map((rate) => rate.currency)).size;

  const filteredRates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rates
      .filter((rate) => statusFilter === "ALL" || rate.status === statusFilter)
      .filter((rate) => {
        if (!needle) return true;
        return [rate.code, rate.label, rate.workUnitType, rate.currency]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [query, rates, statusFilter]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filteredRates,
    {
      code: (rate) => rate.code,
      version: (rate) => rate.version,
      amount: (rate) => rate.amount,
      effectiveFrom: (rate) => new Date(rate.effectiveFrom),
      status: (rate) => rate.status,
    },
    { key: "code", direction: "asc" },
  );

  useEffect(() => setPage(1), [query, statusFilter, sortDirection, sortKey]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredRates.length / ROWS_PER_PAGE));
    setPage((currentPage) => Math.min(currentPage, lastPage));
  }, [filteredRates.length]);

  const visibleRates = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  if (denial) {
    return (
      <AccessDenied
        title="Rate Table"
        description="Only the Admin rate-table capability can manage compensation policy."
        denial={denial}
      />
    );
  }

  const resetForm = () => {
    setCode("");
    setLabel("");
    setWorkUnitType("");
    setAmount("");
    setCurrency("VND");
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEffectiveTo("");
  };

  const createRate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const numericAmount = Number(amount);
    if (!code.trim() || !label.trim() || !workUnitType.trim()) {
      setFormError(
        "Complete the code, label, and work unit so the policy can be resolved by new tasks.",
      );
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError("Amount must be greater than zero. Enter the amount paid for one work unit.");
      return;
    }
    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      setFormError(
        "The end date must be after the start date. Leave it empty for an open-ended window.",
      );
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        label: label.trim(),
        workUnitType: workUnitType.trim().toUpperCase(),
        amount: numericAmount,
        currency: currency.trim().toUpperCase(),
        effectiveFrom: toIsoDate(effectiveFrom),
        effectiveTo: effectiveTo ? toIsoDate(effectiveTo) : null,
      });
      resetForm();
      setSuccessMessage(
        "Rate version published. New tasks can resolve this policy within its effective window.",
      );
    } catch (mutationError) {
      setFormError(mapAdminError(mutationError));
    }
  };

  const deactivate = async (rate: RateTableEntry) => {
    setPendingRateId(rate.id);
    try {
      await patchMutation.mutateAsync({ id: rate.id, body: { status: "INACTIVE" } });
    } catch {
      // The inline mutation error below gives the user the recovery path.
    } finally {
      setPendingRateId(null);
    }
  };

  const reactivate = async (rate: RateTableEntry) => {
    setPendingRateId(rate.id);
    try {
      await patchMutation.mutateAsync({ id: rate.id, body: { status: "ACTIVE" } });
    } catch {
      // Backend rejects an overlapping active window for the same code; the
      // inline mutation error below gives the user the recovery path.
    } finally {
      setPendingRateId(null);
    }
  };

  return (
    <PageFrame className="bg-[var(--admin-page)] p-0">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1400px] space-y-6 px-5 py-7 lg:px-8">
        <PageHeader
          eyebrow="Admin / Compensation policy"
          title="Rate Table"
          description="Publish the rates used to price new tasks."
          actions={
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="h-10 gap-2 border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px]"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
          }
        />

        <MetricGrid columns={4}>
          <MetricCard
            icon={<CheckCircle2 className="size-4" />}
            label="Active versions"
            value={activeCount}
            hint="Available to resolve new tasks"
            tone={activeCount > 0 ? "success" : "danger"}
          />
          <MetricCard
            icon={<ShieldCheck className="size-4" />}
            label="Policy codes"
            value={codeCount}
            hint="Distinct work definitions"
          />
          <MetricCard
            icon={<Clock3 className="size-4" />}
            label="Historical versions"
            value={inactiveCount}
            hint="Retained for audit context"
          />
          <MetricCard
            icon={<CircleHelp className="size-4" />}
            label="Currencies"
            value={currencyCount}
            hint="Across configured versions"
          />
        </MetricGrid>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(290px,360px)_minmax(0,1fr)]">
          <section
            id="publish-rate"
            className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)]"
          >
            <div className="border-b border-[var(--admin-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-[5px] bg-[var(--admin-navy)] text-[var(--admin-cream)]">
                  <Plus className="size-4" />
                </span>
                <h2 className="font-serif text-[19px] font-semibold text-[var(--admin-ink)]">
                  Publish a rate version
                </h2>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[var(--admin-muted)]">
                Publishing creates an active version. The effective window cannot overlap another
                active version with the same code.
              </p>
            </div>

            <form onSubmit={createRate} className="space-y-4 p-5" noValidate>
              <Field label="Code" helper="Stable key selected when a Mangaka creates a task.">
                <Input
                  id="rate-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="LETTERING_PAGE"
                  required
                  aria-required="true"
                  className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                />
              </Field>
              <Field label="Label" helper="Human-readable name shown in the task creator.">
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Lettering per page"
                  required
                  aria-required="true"
                  className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                />
              </Field>
              <Field
                label="Work unit"
                helper="The quantity unit used to calculate estimated amount."
              >
                <Input
                  value={workUnitType}
                  onChange={(event) => setWorkUnitType(event.target.value)}
                  placeholder="PAGE"
                  required
                  aria-required="true"
                  className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                <Field label="Amount" helper="Paid per work unit.">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="25"
                    required
                    aria-required="true"
                    className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                  />
                </Field>
                <Field label="Currency" helper="ISO code.">
                  <Input
                    maxLength={3}
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    required
                    aria-required="true"
                    className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Effective from" helper="Start date, inclusive.">
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(event) => setEffectiveFrom(event.target.value)}
                    required
                    aria-required="true"
                    className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                  />
                </Field>
                <Field label="Effective to" helper="Optional; leave open-ended.">
                  <Input
                    type="date"
                    value={effectiveTo}
                    onChange={(event) => setEffectiveTo(event.target.value)}
                    className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-1"
                  />
                </Field>
              </div>

              <div className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                  Publish preview
                </p>
                <p className="mt-2 font-mono text-[16px] font-semibold tabular-nums text-[var(--admin-ink)]">
                  {amount || "—"} {currency.trim().toUpperCase() || "VND"} /{" "}
                  {workUnitType.trim().toUpperCase() || "work unit"}
                </p>
                <p className="mt-1 text-[11px] text-[var(--admin-muted)]">
                  {code.trim().toUpperCase() || "RATE_CODE"} · new tasks only
                </p>
              </div>

              {formError ? (
                <div id="rate-form-error" role="alert">
                  <StateBlock
                    tone="danger"
                    title="Rate version was not published"
                    description={formError}
                  />
                </div>
              ) : null}
              {successMessage ? (
                <StateBlock
                  tone="success"
                  title="Rate version published"
                  description={successMessage}
                />
              ) : null}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-10 w-full gap-2 rounded-[6px] bg-[var(--admin-navy)] px-4 text-[13px] text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] focus-visible:ring-2 focus-visible:ring-[var(--admin-navy)] focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                {createMutation.isPending ? "Publishing…" : "Publish rate version"}
              </Button>
            </form>
          </section>

          <section className="min-w-0 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <div className="border-b border-[var(--admin-border)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-[19px] font-semibold text-[var(--admin-ink)]">
                    Rate register
                  </h2>
                  <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
                    Active policy first; inactive versions remain available for audit context.
                  </p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--admin-faint)]">
                  {filteredRates.length} shown
                </span>
              </div>
            </div>

            <SearchToolbar
              className="px-5 py-4"
              query={query}
              onQueryChange={setQuery}
              placeholder="Search code, label, or unit"
              filters={
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="h-10 w-[140px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              }
              actions={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("ALL");
                  }}
                  disabled={!query && statusFilter === "ALL"}
                  className="h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)] px-4 text-[13px]"
                >
                  Reset
                </Button>
              }
            />

            {patchMutation.error ? (
              <div className="px-5 pb-4">
                <StateBlock
                  tone="danger"
                  title="Rate status was not updated"
                  description={mapAdminError(patchMutation.error)}
                />
              </div>
            ) : null}

            <DataTable isLoading={isLoading} skeletonRows={6} skeletonColumns={6}>
              {filteredRates.length === 0 ? (
                <div className="p-5">
                  <StateBlock
                    tone="default"
                    title={
                      rates.length === 0 ? "No rate policy configured" : "No matching rate versions"
                    }
                    description={
                      rates.length === 0
                        ? "Publish the first version before a Mangaka can create paid tasks."
                        : "Change the search or status filter to find another version."
                    }
                    action={
                      rates.length === 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => document.getElementById("rate-code")?.focus()}
                        >
                          Publish first rate
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <caption className="sr-only">Configured rate versions</caption>
                    <TableHeader>
                      <TableRow className="border-[var(--admin-border)] hover:bg-transparent">
                        <TableHead className="h-12 pl-5 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                          <SortableHeader
                            label="Policy"
                            sortKey="code"
                            activeSortKey={sortKey}
                            direction={sortDirection}
                            onSort={toggleSort}
                          />
                        </TableHead>
                        <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                          <SortableHeader
                            label="Amount"
                            sortKey="amount"
                            activeSortKey={sortKey}
                            direction={sortDirection}
                            onSort={toggleSort}
                          />
                        </TableHead>
                        <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                          <SortableHeader
                            label="Window"
                            sortKey="effectiveFrom"
                            activeSortKey={sortKey}
                            direction={sortDirection}
                            onSort={toggleSort}
                          />
                        </TableHead>
                        <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                          <SortableHeader
                            label="Status"
                            sortKey="status"
                            activeSortKey={sortKey}
                            direction={sortDirection}
                            onSort={toggleSort}
                          />
                        </TableHead>
                        <TableHead className="pr-5 text-center font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleRates.map((rate) => {
                        const isPending = pendingRateId === rate.id;
                        return (
                          <TableRow
                            key={rate.id}
                            className="border-[var(--admin-border)] hover:bg-[var(--admin-hover)]"
                          >
                            <TableCell className="max-w-[250px] pl-5">
                              <p className="truncate font-mono text-[12px] font-semibold text-[var(--admin-ink)]">
                                {rate.code}
                              </p>
                              <p className="mt-1 truncate text-[12px] text-[var(--admin-muted)]">
                                v{rate.version} · {rate.label} · {rate.workUnitType}
                              </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-[13px] font-semibold tabular-nums text-[var(--admin-ink)]">
                              {rate.amount.toLocaleString()} {rate.currency}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-[12px] text-[var(--admin-muted)]">
                              {formatDate(rate.effectiveFrom)}
                              <span className="mx-1 text-[var(--admin-faint)]">→</span>
                              {rate.effectiveTo ? formatDate(rate.effectiveTo) : "Open"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  rate.status === "ACTIVE"
                                    ? "bg-[var(--role-editor)]/12 text-[var(--role-editor)]"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {rate.status === "ACTIVE" ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="pr-5 text-center">
                              {rate.status === "ACTIVE" ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void deactivate(rate)}
                                  disabled={patchMutation.isPending}
                                  className="h-9 min-w-[92px] whitespace-nowrap rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[12px]"
                                >
                                  {isPending ? "Deactivating…" : "Deactivate"}
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void reactivate(rate)}
                                  disabled={patchMutation.isPending}
                                  className="h-9 min-w-[92px] whitespace-nowrap rounded-[6px] border-[var(--role-editor)]/40 bg-[var(--admin-surface)] text-[12px] text-[var(--role-editor)] hover:bg-[var(--role-editor)]/10"
                                >
                                  {isPending ? "Activating…" : "Activate"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DataTable>
            <DataPagination
              total={filteredRates.length}
              page={page}
              pageSize={ROWS_PER_PAGE}
              onPageChange={setPage}
              itemName="rate versions"
            />
          </section>
        </div>
      </section>
    </PageFrame>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] font-semibold text-[var(--admin-ink)]">{label}</Label>
      {children}
      <p className="min-h-[1lh] text-[11px] leading-4 text-[var(--admin-faint)]">{helper}</p>
    </div>
  );
}
