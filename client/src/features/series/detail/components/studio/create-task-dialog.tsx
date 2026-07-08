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
import type { RegionType, StudioRegion } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import type { User } from "@/shared/auth";

const schema = z.object({
  title: z.string().min(2, "Title cần ít nhất 2 ký tự."),
  type: z.string().min(1, "Chọn Type."),
  assigneeId: z.string().min(1, "Chọn Assignee."),
  dueAt: z.string().min(1, "Chọn Due date."),
  instructions: z.string().min(5, "Instructions cần ít nhất 5 ký tự."),
  pageId: z.string().min(1, "Chưa chọn page."),
});

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  type: "Type",
  assigneeId: "Assignee",
  dueAt: "Due date",
  instructions: "Instructions",
  pageId: "Page",
};

type Submit = (data: {
  title: string;
  type: RegionType;
  assigneeId: string;
  assigneeName: string;
  dueAt: string;
  priority: "low" | "normal" | "high";
  instructions: string;
  pageId: string;
  regionId?: string;
}) => boolean | Promise<boolean>;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  region: StudioRegion | undefined;
  members: User[];
  hasActiveTaskOnRegion: boolean;
  onSubmit: Submit;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  chapter,
  page,
  region,
  members,
  hasActiveTaskOnRegion,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RegionType>(region?.type ?? "background");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (open) {
      setType(region?.type ?? "background");
      setTitle(region ? `${REGION_TYPE_LABEL[region.type]} — ${region.label ?? "Region"}` : "");
      setAssigneeId(members[0]?.id ?? "");
    }
  }, [members, open, region]);

  const submit = async () => {
    if (!page) {
      toast.error("Chưa chọn page.");
      return;
    }
    const parsed = schema.safeParse({
      title,
      type,
      assigneeId,
      dueAt,
      instructions,
      pageId: page.id,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0] ? FIELD_LABEL[String(issue.path[0])] : null;
      toast.error(field ? `${field}: ${issue?.message}` : (issue?.message ?? "Thiếu thông tin"));
      return;
    }
    if (hasActiveTaskOnRegion) {
      toast.error("Region này đang có task active.");
      return;
    }
    const assignee = members.find((m) => m.id === assigneeId);
    const ok = await onSubmit({
      title,
      type,
      assigneeId,
      assigneeName: assignee?.name ?? assigneeId,
      dueAt: new Date(dueAt).toISOString(),
      priority,
      instructions,
      pageId: page.id,
      regionId: region?.id,
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
              ? `Chapter ${chapter.number} · Page ${page?.index ?? "—"}${region ? ` · ${region.label ?? "Region"}` : ""}`
              : "Tạo task mới cho assistant"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {hasActiveTaskOnRegion ? (
            <div className="rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
              Region này đang có task active.
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
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
              </select>
            )}
          </Row>
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
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={hasActiveTaskOnRegion || members.length === 0}
            >
              Tạo task
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
