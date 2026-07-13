import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeparationOfDutiesWarning } from "@/entities/access";
import {
  MetricCard,
  MetricGrid,
  PageFrame,
  PageHeader,
  SearchToolbar,
  StateBlock,
  TextButton,
  DataPagination,
} from "@/shared/ui";
import { Download, RotateCcw, Banknote, CheckCircle2, FileText, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AccessDenied, mapAdminError, useAdminAccess } from "../../_shared";
import { useAdminPayrollQuery } from "../../api/admin-queries";
import { formatJpy } from "../../_shared";
import { PayrollInspector } from "./payroll-inspector";
import { PayrollTable } from "./payroll-table";

type StatusFilter = "ALL" | "PENDING" | "CONFIRMED" | "PAID" | "VOIDED";
const ROWS_PER_PAGE = 10;

export function AdminPayrollPage() {
  const { user: currentUser, canQueryAdmin, denial } = useAdminAccess();
  const {
    data: earnings = [],
    isLoading,
    error,
  } = useAdminPayrollQuery({ enabled: canQueryAdmin });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const pendingAmount = earnings
    .filter((e) => e.status === "PENDING")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const confirmedAmount = earnings
    .filter((e) => e.status === "CONFIRMED")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const paidThisPeriodAmount = earnings
    .filter((e) => e.status === "PAID")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const voidedAmount = earnings
    .filter((e) => e.status === "VOIDED")
    .reduce((acc, cur) => acc + cur.amount, 0);

  const filtersActive = query.trim().length > 0 || statusFilter !== "ALL" || periodFilter !== "ALL";

  const periods = useMemo(() => Array.from(new Set(earnings.map((e) => e.period))), [earnings]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return earnings
      .filter((e) => statusFilter === "ALL" || e.status === statusFilter)
      .filter((e) => periodFilter === "ALL" || e.period === periodFilter)
      .filter((e) => !needle || e.assistantId.toLowerCase().includes(needle));
  }, [earnings, query, statusFilter, periodFilter]);

  useEffect(() => setPage(1), [query, statusFilter, periodFilter]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    setPage((currentPage) => Math.min(currentPage, lastPage));
  }, [filtered.length]);

  const visibleRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const selected = selectedId ? earnings.find((e) => e.id === selectedId) : undefined;

  if (denial) {
    return (
      <AccessDenied
        title="Payroll"
        description="Calculated assistant earnings are reviewed here. Payment operations are outside the MVP client scope."
        denial={denial}
      />
    );
  }

  if (error) {
    return (
      <PageFrame>
        <StateBlock
          tone="danger"
          title="Could not load payroll"
          description={mapAdminError(error)}
        />
      </PageFrame>
    );
  }

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setPeriodFilter("ALL");
  };

  const exportCsv = () => {
    const csv = [
      [
        "Assistant",
        "Period",
        "Tasks",
        "Subtotal",
        "Bonus/Penalty",
        "Amount",
        "Status",
        "Last Updated",
      ],
      ...filtered.map((e) => [
        e.assistantId,
        e.period,
        e.tasksCount,
        e.subtotal,
        e.bonusPenalty,
        e.amount,
        e.status,
        e.updatedAt || "",
      ]),
    ]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "payroll.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="p-0 bg-[#FBFBFB]">
      <section className="min-h-[calc(100vh-4rem)] px-5 py-6 lg:px-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="Payroll"
          description="Read-only view of assistant earnings created after Editor-approved tasks."
        >
          <TextButton onClick={exportCsv}>
            <Download className="size-4" />
            Export CSV
          </TextButton>
        </PageHeader>

        <div className="mt-6">
          <SeparationOfDutiesWarning>
            MVP keeps payroll read-only: earnings are generated from approved assistant tasks, while
            payment confirmation and voiding are handled outside this workflow.
          </SeparationOfDutiesWarning>
        </div>

        <MetricGrid columns={5} className="mt-6">
          <MetricCard
            icon={<FileText className="size-5" />}
            label="Pending Amount"
            value={formatJpy(pendingAmount)}
            hint="Awaiting confirmation"
          />
          <MetricCard
            icon={<CheckCircle2 className="size-5" />}
            label="Confirmed Amount"
            value={formatJpy(confirmedAmount)}
            hint="Ready for payment"
            tone="warning"
          />
          <MetricCard
            icon={<Banknote className="size-5" />}
            label="Paid This Period"
            value={formatJpy(paidThisPeriodAmount)}
            hint="June 2026"
            tone="success"
          />
          <MetricCard
            icon={<CheckCircle className="size-5" />}
            label="Approved Tasks"
            value="148"
            hint="This period"
          />
          <MetricCard
            icon={<RotateCcw className="size-5" />}
            label="Void / Adjustments"
            value={formatJpy(voidedAmount)}
            hint="This period"
            tone="default"
          />
        </MetricGrid>

        <SearchToolbar
          className="mt-7"
          query={query}
          onQueryChange={setQuery}
          placeholder="Search assistant, task, or series"
          filters={
            <>
              <FilterSelect value={periodFilter} onValueChange={(value) => setPeriodFilter(value)}>
                <SelectItem value="ALL">Current Month</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </FilterSelect>
              <FilterSelect value="ALL" onValueChange={() => {}}>
                <SelectItem value="ALL">All Assistants</SelectItem>
              </FilterSelect>
              <FilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOIDED">Voided</SelectItem>
              </FilterSelect>
              <FilterSelect value="ALL" onValueChange={() => {}}>
                <SelectItem value="ALL">All Task Types</SelectItem>
              </FilterSelect>
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              disabled={!filtersActive}
              onClick={clearFilters}
              className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          }
        />

        <div className="mt-6 mb-2">
          <p className="text-[13px] text-[var(--admin-muted)]">
            Showing payroll records for June 2026
          </p>
        </div>

        <PayrollTable
          rows={visibleRows}
          selectedId={selectedId}
          isLoading={isLoading}
          onSelect={(earning) => {
            setSelectedId(earning.id);
            setInspectorOpen(true);
          }}
        />

        <DataPagination
          total={filtered.length}
          page={page}
          pageSize={ROWS_PER_PAGE}
          onPageChange={setPage}
          itemName="records"
        />
      </section>

      <PayrollInspector earning={selected} open={inspectorOpen} onOpenChange={setInspectorOpen} />
    </PageFrame>
  );
}

function FilterSelect({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 w-[154px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
