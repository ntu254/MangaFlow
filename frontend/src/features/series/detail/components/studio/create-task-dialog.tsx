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
import type { PageAssignment, RegionType, StudioRegion } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
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
});

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  type: "Type",
  rateCode: "Rate",
  quantity: "Quantity",
  dueAt: "Due date",
  instructions: "Instructions",
  pageId: "Page",
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
}) => boolean | Promise<boolean>;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  region: StudioRegion | undefined;
  pageAssignment?: PageAssignment;
  members: User[];
  hasActiveTaskOnPage?: boolean;
  rates: RateTableEntry[];
  onSubmit: Submit;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  chapter,
  page,
  region,
  pageAssignment,
  members,
  hasActiveTaskOnPage = false,
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
  const selectedRate = rates.find((rate) => rate.code === rateCode);
  // One assistant task is always one page and one payable unit.
  const quantity = 1;
  const estimatedAmount = selectedRate ? selectedRate.amount : 0;
  const pageHasSource = Boolean(
    page?.fileKey || isRenderableFileUrl(page?.fileUrl ?? page?.imageUrl),
  );

  useEffect(() => {
    if (open) {
      setType(region?.type ?? "background");
      setAssigneeId(pageAssignment?.assistantId ?? "");
      setTitle(region ? `${REGION_TYPE_LABEL[region.type]} — ${region.label ?? "Region"}` : "");
      setRateCode(rates[0]?.code ?? "");
    }
  }, [open, pageAssignment, region, rates]);

  const submit = async () => {
    if (!page) {
      toast.error("No page selected.");
      return;
    }
    if (!pageHasSource) {
      toast.error("Upload the source page image before assigning assistant work.");
      return;
    }
    if (!pageAssignment || pageAssignment.status === "RELEASED") {
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
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create Task</DialogTitle>
          <DialogDescription>
            {chapter
              ? `Chapter ${chapter.number} · Page ${page?.index ?? "—"}`
              : "Create a new task for assistant"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
            Page assignment: {pageAssignment ? `${pageAssignment.assistantName} · ${pageAssignment.status}` : "Not assigned"}. Multiple tasks may use this page assignment.
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
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Clean background mountains and valley. Remove dust and noise…"
            />
          </Row>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={
                !pageHasSource || !pageAssignment || pageAssignment.status === "RELEASED" || rates.length === 0
              }
            >
              Create task
            </Button>
          </div>
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
