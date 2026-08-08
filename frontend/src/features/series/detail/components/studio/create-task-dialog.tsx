import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Chapter, ChapterPage } from "@/entities/series/model/series-types";
import type {
  PageAssignment,
  RegionType,
  StudioRegion,
  StudioTask,
  TaskDeliveryRole,
} from "@/entities/series/model/studio-types";
import {
  REGION_TYPE_LABEL,
  TASK_DELIVERY_ROLE_LABEL,
  isFinalPageTask,
  isTaskActive,
} from "@/entities/series/model/studio-types";
import type { User } from "@/shared/auth";
import type { RateTableEntry } from "@/shared/api/rate-table";
import { isRenderableFileUrl } from "@/shared/lib/file-url";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  type: z.string().min(1, "Select a Type."),
  rateCode: z.string().min(1, "Select a rate."),
  quantity: z.number().positive("Quantity must be greater than zero."),
  dueAt: z.string().min(1, "Select a Due date."),
  instructions: z.string().min(5, "Instructions must be at least 5 characters."),
  pageId: z.string().min(1, "No page selected."),
  deliveryRole: z.enum(["FINAL_PAGE", "REGION_ASSET", "SUPPORTING"]),
});

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  type: "Type",
  rateCode: "Rate",
  quantity: "Quantity",
  dueAt: "Due date",
  instructions: "Instructions",
  pageId: "Page",
  deliveryRole: "Deliverable",
};

type Submit = (data: {
  title: string;
  type: RegionType;
  rateCode: string;
  quantity: number;
  dueAt: string;
  priority: "low" | "normal" | "high";
  instructions: string;
  pageId: string;
  deliveryRole: TaskDeliveryRole;
  blocksPageDelivery: boolean;
}) => boolean | Promise<boolean>;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  region: StudioRegion | undefined;
  pageTasks: StudioTask[];
  pageAssignment?: PageAssignment;
  members: User[];
  rates: RateTableEntry[];
  onSubmit: Submit;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  chapter,
  page,
  region,
  pageTasks,
  pageAssignment,
  members,
  rates,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RegionType>(region?.type ?? "background");
  const [assigneeId, setAssigneeId] = useState("");
  const [rateCode, setRateCode] = useState(rates[0]?.code ?? "");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [instructions, setInstructions] = useState("");
  const [deliveryRole, setDeliveryRole] = useState<TaskDeliveryRole>("FINAL_PAGE");
  const [blocksPageDelivery, setBlocksPageDelivery] = useState(true);
  const selectedRate = rates.find((rate) => rate.code === rateCode);
  // One assistant task is always one page and one payable unit.
  const quantity = 1;
  const estimatedAmount = selectedRate ? selectedRate.amount : 0;
  const pageHasSource = Boolean(
    page?.fileKey || isRenderableFileUrl(page?.fileUrl ?? page?.imageUrl),
  );
  const hasActiveFinalDelivery = pageTasks.some(
    (task) => isTaskActive(task.status) && isFinalPageTask(task),
  );

  useEffect(() => {
    if (open) {
      setType(region?.type ?? "background");
      setAssigneeId(pageAssignment?.assistantId ?? "");
      setTitle(region ? `${REGION_TYPE_LABEL[region.type]} — ${region.label ?? "Region"}` : "");
      setRateCode(rates[0]?.code ?? "");
      const nextRole: TaskDeliveryRole = region
        ? "REGION_ASSET"
        : hasActiveFinalDelivery
          ? "SUPPORTING"
          : "FINAL_PAGE";
      setDeliveryRole(nextRole);
      setBlocksPageDelivery(nextRole === "FINAL_PAGE");
    }
  }, [open, pageAssignment, region, rates, hasActiveFinalDelivery]);

  const submit = async () => {
    if (!page) {
      toast.error("No page selected.");
      return;
    }
    if (!pageHasSource) {
      toast.error("Upload the source page image before assigning assistant work.");
      return;
    }
    if (
      !pageAssignment ||
      pageAssignment.status === "RELEASED" ||
      pageAssignment.status === "REJECTED"
    ) {
      toast.error("Assign an assistant to this page before creating a task.");
      return;
    }
    const parsed = schema.safeParse({
      title,
      type,
      rateCode,
      quantity: Number(quantity),
      dueAt,
      instructions,
      pageId: page.id,
      deliveryRole,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0] ? FIELD_LABEL[String(issue.path[0])] : null;
      toast.error(
        field ? `${field}: ${issue?.message}` : (issue?.message ?? "Missing information"),
      );
      return;
    }
    const ok = await onSubmit({
      title,
      type,
      rateCode,
      quantity: Number(quantity),
      dueAt: new Date(dueAt).toISOString(),
      priority,
      instructions,
      pageId: page.id,
      deliveryRole,
      blocksPageDelivery: deliveryRole === "FINAL_PAGE" || blocksPageDelivery,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-5">
          <DialogTitle className="font-serif text-xl sm:text-2xl">Create Task</DialogTitle>
          <DialogDescription>
            {chapter
              ? `Chapter ${chapter.number} · Page ${page?.index ?? "—"}`
              : "Create a new task for assistant"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          <div className="space-y-2.5">
            <div className="rounded border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
              Page assignment:{" "}
              {pageAssignment
                ? `${pageAssignment.assistantName} · ${pageAssignment.status}`
                : "Not assigned"}
              . Only one task can deliver the final page; other tasks contribute work to it.
            </div>
            {!pageHasSource ? (
              <div className="rounded border border-rose-300 bg-rose-50 p-2 text-[11px] text-rose-900">
                This page has no usable source image. Upload the page first; the assistant Canvas
                cannot start from an empty or expired resource.
              </div>
            ) : null}

            <Row label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clean Background"
              />
            </Row>
            <Row label="Type">
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                value={type}
                onChange={(e) => setType(e.target.value as RegionType)}
              >
                {Object.entries(REGION_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Deliverable">
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                value={deliveryRole}
                onChange={(event) => {
                  const nextRole = event.target.value as TaskDeliveryRole;
                  setDeliveryRole(nextRole);
                  if (nextRole === "FINAL_PAGE") setBlocksPageDelivery(true);
                }}
              >
                <option value="FINAL_PAGE" disabled={hasActiveFinalDelivery}>
                  {TASK_DELIVERY_ROLE_LABEL.FINAL_PAGE}
                  {hasActiveFinalDelivery ? " (already assigned)" : ""}
                </option>
                <option value="REGION_ASSET">{TASK_DELIVERY_ROLE_LABEL.REGION_ASSET}</option>
                <option value="SUPPORTING">{TASK_DELIVERY_ROLE_LABEL.SUPPORTING}</option>
              </select>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {deliveryRole === "FINAL_PAGE"
                  ? "This is the only task allowed to replace the page file after Mangaka approval."
                  : deliveryRole === "REGION_ASSET"
                    ? "Upload an asset for this contribution; it will not replace the full page."
                    : "Submit a note or optional reference file; it will not replace the full page."}
              </p>
            </Row>
            {deliveryRole !== "FINAL_PAGE" ? (
              <label className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5 text-xs">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={blocksPageDelivery}
                  onChange={(event) => setBlocksPageDelivery(event.target.checked)}
                />
                <span>
                  <span className="font-semibold text-foreground">Block final page delivery</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    The Page Owner cannot submit the final file until this task is completed or
                    approved.
                  </span>
                </span>
              </label>
            ) : null}
            <Row label="Assignee">
              {members.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  No assistants available
                </div>
              ) : (
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  value={pageAssignment?.assistantId ?? assigneeId}
                  disabled
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.role}
                    </option>
                  ))}
                </select>
              )}
            </Row>
            <Row label="Rate">
              {rates.length === 0 ? (
                <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  No active rate is configured. Ask an Admin to configure the rate table.
                </div>
              ) : (
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  value={rateCode}
                  onChange={(e) => setRateCode(e.target.value)}
                >
                  {rates.map((rate) => (
                    <option key={rate.id} value={rate.code}>
                      {rate.label} · {rate.amount.toLocaleString()} {rate.currency}
                    </option>
                  ))}
                </select>
              )}
            </Row>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              This task covers 1 selected {selectedRate?.workUnitType?.toLowerCase() ?? "unit"}.
            </div>
            {selectedRate ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <span>Estimated task amount</span>
                <strong>
                  {estimatedAmount.toLocaleString()} {selectedRate.currency}
                </strong>
              </div>
            ) : null}
            <Row label="Due date">
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </Row>
            <Row label="Priority">
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Row>
            <Row label="Instructions">
              <Textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Clean background mountains and valley. Remove dust and noise…"
              />
            </Row>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-4 py-3 sm:px-5">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={
              !pageHasSource ||
              !pageAssignment ||
              pageAssignment.status === "RELEASED" ||
              pageAssignment.status === "REJECTED" ||
              rates.length === 0
            }
          >
            Create task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
