import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { AvatarInitials, DataTable, StatusPill } from "@/shared/ui";
import { MoreHorizontal } from "lucide-react";
import type { Earning } from "../../_shared";
import { formatDateTime, formatJpy } from "../../_shared";

export function PayrollTable({
  earnings,
  rows,
  selectedId,
  isLoading,
  updateSucceeded,
  onSelect,
  onConfirm,
  onMarkPaid,
  onVoid,
}: {
  earnings: Earning[];
  rows: Earning[];
  selectedId: string | null;
  isLoading: boolean;
  updateSucceeded: boolean;
  onSelect: (earning: Earning) => void;
  onConfirm: (earningId: string) => void;
  onMarkPaid: (earningId: string) => void;
  onVoid: (earningId: string) => void;
}) {
  return (
    <DataTable className="mt-5" isLoading={isLoading} skeletonRows={5} skeletonColumns={8}>
      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">Payroll earnings</caption>
          <TableHeader>
            <TableRow className="border-[var(--admin-border)] hover:bg-transparent">
              <TableHead
                scope="col"
                className="h-12 pl-5 font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                Assistant
              </TableHead>
              {[
                "Period",
                "Tasks",
                "Subtotal",
                "Bonus / Penalty",
                "Amount",
                "Status",
                "Last Updated",
              ].map((heading) => (
                <TableHead
                  scope="col"
                  key={heading}
                  className={cn(
                    "font-serif text-[14px] font-semibold text-[var(--admin-ink)]",
                    ["Tasks", "Subtotal", "Bonus / Penalty", "Amount"].includes(heading) &&
                      "text-center",
                  )}
                >
                  {heading}
                </TableHead>
              ))}
              <TableHead
                scope="col"
                className="pr-5 text-right font-serif text-[14px] font-semibold text-[var(--admin-ink)]"
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isPending = row.status === "PENDING";
              const isConfirmed = row.status === "CONFIRMED";

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
                    selectedId === row.id &&
                      "bg-[var(--admin-hover)] shadow-[inset_3px_0_0_var(--admin-navy)]",
                  )}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={row.assistantId} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold leading-tight text-[var(--admin-ink)]">
                          {row.assistantId}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--admin-faint)]">
                          {row.assistantId.toLowerCase().replace(" ", ".")}@mangaflow.jp
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] font-mono text-[var(--admin-muted)]">
                    {row.period}
                  </TableCell>
                  <TableCell className="text-[14px] text-center text-[var(--admin-muted)]">
                    {row.tasksCount || 0}
                  </TableCell>
                  <TableCell className="text-[14px] text-center font-mono text-[var(--admin-muted)]">
                    {formatJpy(row.subtotal || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[14px] text-center font-mono font-medium",
                      (row.bonusPenalty || 0) > 0
                        ? "text-emerald-600"
                        : (row.bonusPenalty || 0) < 0
                          ? "text-rose-600"
                          : "text-[var(--admin-muted)]",
                    )}
                  >
                    {(row.bonusPenalty || 0) > 0
                      ? `+${formatJpy(row.bonusPenalty!)}`
                      : (row.bonusPenalty || 0) < 0
                        ? formatJpy(row.bonusPenalty!)
                        : "–"}
                  </TableCell>
                  <TableCell className="text-[14px] text-center font-mono font-medium text-[var(--admin-ink)]">
                    {formatJpy(row.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusPill
                      status={row.status.toLowerCase()}
                      className="border border-current/20 bg-opacity-70"
                    />
                  </TableCell>
                  <TableCell className="text-[13px] text-center text-[var(--admin-muted)]">
                    {row.updatedAt ? formatDateTime(row.updatedAt) : "N/A"}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-[5px] border-[var(--admin-border)] bg-[var(--admin-surface)]"
                          aria-label="Open actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onSelect(row)}>
                          View details
                        </DropdownMenuItem>
                        {isPending && (
                          <DropdownMenuItem onSelect={() => onConfirm(row.id)}>
                            Confirm Payroll
                          </DropdownMenuItem>
                        )}
                        {isConfirmed && (
                          <DropdownMenuItem onSelect={() => onMarkPaid(row.id)}>
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {(isPending || isConfirmed) && (
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-700"
                            onSelect={() => onVoid(row.id)}
                          >
                            Void
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-[var(--admin-faint)]"
                >
                  No payroll records found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </DataTable>
  );
}
