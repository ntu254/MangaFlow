import { ArrowUpRight, Coins, FileCheck2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type { AssistantEarning, EarningStatus } from "@/entities/submission/model/assistant-types";
import {
  EARNING_STATUS_BADGE,
  EARNING_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";
import { formatDateTime } from "@/shared/lib/format-date";

export function EarningDetailModal({
  earning,
  task,
  chapter,
  series,
  open,
  onOpenChange,
}: {
  earning?: AssistantEarning;
  task?: StudioTask;
  chapter?: Chapter;
  series?: ProductionSeries;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const page = chapter?.pages.find((item) => item.id === task?.pageId);
  const status = normalizeStatus(earning?.status);
  const subtotal = earning?.subtotal ?? earning?.amount ?? 0;
  const bonus = earning?.bonus ?? 0;
  const penalty = earning?.penalty ?? 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-muted shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Earning detail · {earning?.period ?? "Unknown period"}
              </p>
              <ModalTitle className="text-xl font-bold font-serif">
                {task?.title ?? "Task earning"}
              </ModalTitle>
              <ModalDescription className="sr-only">Earning details breakdown</ModalDescription>
            </div>
          </div>
          {earning ? (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-lg font-semibold tabular-nums">
                {formatMoney(earning.amount, earning.currency)}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${EARNING_STATUS_BADGE[status]}`}
              >
                {EARNING_STATUS_LABEL[status]}
              </span>
            </div>
          ) : null}
        </ModalHeader>

        {earning ? (
          <div className="space-y-5 text-xs pt-2">
            <section>
              <SectionTitle title="Amount calculation" />
              <dl className="mt-2 divide-y divide-border rounded-md border border-border">
                <MoneyRow label="Task subtotal" amount={subtotal} currency={earning.currency} />
                <MoneyRow label="Bonus" amount={bonus} currency={earning.currency} positive />
                <MoneyRow label="Penalty" amount={penalty} currency={earning.currency} negative />
                <MoneyRow
                  label="Final earning"
                  amount={earning.amount}
                  currency={earning.currency}
                  strong
                />
              </dl>
              {task?.rateSnapshot != null ? (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Rate snapshot: {formatMoney(task.rateSnapshot, task.currency ?? earning.currency)}
                  {task.rateCode ? ` · ${task.rateCode}` : ""}
                </p>
              ) : null}
            </section>

            <section>
              <SectionTitle title="Work source" icon={<FileCheck2 className="size-3.5" />} />
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <Detail label="Series" value={series?.title ?? earning.seriesId ?? "—"} />
                <Detail
                  label="Chapter / Page"
                  value={`Ch.${chapter?.number ?? "—"} / P.${page?.pageNumber ?? page?.index ?? "—"}`}
                />
                <Detail label="Task ID" value={earning.taskId ?? "—"} wide />
                <Detail label="Submission ID" value={earning.submissionId ?? "—"} wide />
                <Detail label="Source" value={earning.sourceKey ?? "Task approval"} wide />
              </dl>
            </section>

            <section>
              <SectionTitle title="Earning timeline" />
              <dl className="mt-2 divide-y divide-border rounded-md border border-border">
                <TimelineRow
                  label="Recorded"
                  value={earning.createdAt ? formatDateTime(earning.createdAt) : "—"}
                />
                <TimelineRow
                  label="Confirmed"
                  value={
                    (earning.confirmedAt ?? earning.approvedAt)
                      ? formatDateTime(earning.confirmedAt ?? earning.approvedAt ?? "")
                      : "Not confirmed"
                  }
                />
                <TimelineRow
                  label="Paid"
                  value={earning.paidAt ? formatDateTime(earning.paidAt) : "Not paid"}
                />
              </dl>
            </section>
          </div>
        ) : null}

        {earning?.taskId ? (
          <ModalFooter>
            <Link
              to="/app/assistant/tasks/$taskId/studio"
              params={{ taskId: earning.taskId }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90 cursor-pointer"
            >
              Open Task Studio <ArrowUpRight className="size-3.5" />
            </Link>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}

function normalizeStatus(status?: AssistantEarning["status"]): EarningStatus {
  return status ?? "EARNED";
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 2,
  }).format(amount);
}

function MoneyRow({
  label,
  amount,
  currency,
  positive,
  negative,
  strong,
}: {
  label: string;
  amount: number;
  currency: string;
  positive?: boolean;
  negative?: boolean;
  strong?: boolean;
}) {
  const prefix = positive && amount > 0 ? "+" : negative && amount > 0 ? "−" : "";
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 text-xs ${strong ? "bg-muted/40" : ""}`}
    >
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-bold" : "font-semibold"}`}>
        {prefix}
        {formatMoney(amount, currency)}
      </dd>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-border p-2.5 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium truncate">{value}</dd>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border/50 pb-1">
      {icon}
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
