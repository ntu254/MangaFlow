import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar as CalendarIcon,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChapterStatusPill } from "@/entities/chapter";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import type { Chapter, ChapterPage } from "@/entities/series/model/series-types";
import type {
  StudioComment,
  StudioRegion,
  StudioSelection,
  StudioTask,
} from "@/entities/series/model/studio-types";
import type { StudioPermissionSet } from "../../model/studio-permissions";
import { canResolveStudioComment } from "../../model/studio-permissions";
import {
  REGION_STATUS_BADGE,
  REGION_TYPE_LABEL,
  TASK_STATUS_BADGE,
} from "@/entities/series/model/studio-types";
import { useCreateSubmissionMutation, useTaskSubmissionsQuery } from "../../../api/series-queries";
import { SUBMISSION_STATUS_BADGE } from "@/entities/submission/model/assistant-types";
import { chapterPageLabel, chapterPageNumber } from "@/entities/chapter/model/chapter-pages";
import { getVisualTaskStatus } from "@/entities/task";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { TaskSubmissionPanel } from "@/features/assistant/task-studio";

type Props = {
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  selection: StudioSelection;
  regions: StudioRegion[];
  tasks: StudioTask[];
  comments: StudioComment[];
  onCreateTask: () => void;
  onUploadPages: () => void;
  onAddComment: (text: string, blocking: boolean) => boolean | Promise<boolean>;
  onDiscardRegion: (id: string) => void;
  onSetCommentStatus: (id: string, status: StudioComment["status"]) => void;
  permissions: StudioPermissionSet;
  userId: string;
  onTaskAction?: (taskId: string, action: string, payload?: Record<string, unknown>) => void;
  onReviewSubmission?: (
    submissionId: string,
    action: "approve" | "reject" | "request-revision" | "editor-approve",
    note?: string,
  ) => void;
  onAdminOverride?: (action: string, targetId: string | undefined, reason: string) => void;
};
export function StudioInspector(props: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex h-full w-[320px] flex-shrink-0 flex-col border-l border-border bg-card">
        <Tabs defaultValue="inspector" className="flex h-full flex-col">
          <TabsList className="m-2 grid h-9 grid-cols-2 p-0.5">
            <TabsTrigger value="inspector" className="h-7 text-xs font-semibold">
              {props.permissions.taskPanelTitle.split("/")[0]?.trim() ?? "Inspector"}
            </TabsTrigger>
            <TabsTrigger value="comments" className="h-7 text-xs font-semibold">
              Comments
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {props.comments.length}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inspector" className="flex-1 overflow-y-auto px-3 pb-4">
            <InspectorBody {...props} />
          </TabsContent>
          <TabsContent value="comments" className="flex-1 overflow-y-auto px-3 pb-4">
            <CommentsList
              comments={props.comments}
              onSetCommentStatus={props.onSetCommentStatus}
              permissions={props.permissions}
              userId={props.userId}
            />
          </TabsContent>
        </Tabs>
      </aside>
    </TooltipProvider>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-right text-xs font-medium text-foreground break-words">
        {value}
      </span>
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}

function isBlockingComment(comment: StudioComment) {
  return comment.isBlocking || comment.blocking;
}

function canShowAssistantSubmissionPanel(
  task: StudioTask | undefined,
  permissions: StudioPermissionSet,
  userId: string,
) {
  return Boolean(
    task &&
    permissions.mode === "assistant" &&
    permissions.canSubmitTask &&
    permissions.canUploadWorkingFiles &&
    task.assigneeId === userId,
  );
}

function isAssistantTaskReadOnly(task: StudioTask, userId: string): boolean {
  const visualStatus = getVisualTaskStatus(task);

  return (
    task.status === "MANGAKA_APPROVED" ||
    task.status === "EDITOR_APPROVED" ||
    task.status === "REJECTED" ||
    visualStatus === "CANCELLED" ||
    (visualStatus === "REASSIGNED" && task.assigneeId !== userId)
  );
}

function AssistantTaskSubmissionPanel({ task, readOnly }: { task: StudioTask; readOnly: boolean }) {
  const createSubmission = useCreateSubmissionMutation();
  const { data: existingSubmissions = [] } = useTaskSubmissionsQuery(task.id);
  const nextVersion =
    existingSubmissions.length === 0
      ? 1
      : Math.max(...existingSubmissions.map((submission) => submission.version)) + 1;
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const reset = () => {
    setFile(null);
    setNote("");
  };

  const save = async (status: "DRAFT" | "SUBMITTED") => {
    if (status === "SUBMITTED" && !file) {
      toast.error("Hãy chọn file đã chỉnh sửa để submit.");
      return;
    }

    try {
      const uploaded = file
        ? await uploadFileToR2(file, { folder: `submissions/${task.id}` })
        : undefined;

      await createSubmission.mutateAsync({
        intent: status === "DRAFT" ? "DRAFT" : "SUBMIT",
        taskId: task.id,
        chapterId: task.chapterId,
        pageId: task.pageId,
        regionId: task.regionId,
        notes: note || undefined,
        fileKey: uploaded?.fileKey,
        fileName: uploaded?.filename,
        fileUrl: uploaded?.fileUrl,
        imageUrl: uploaded?.url,
        fileSizeKB: uploaded?.sizeKB,
        mimeType: uploaded?.mimeType,
      });

      toast.success(status === "SUBMITTED" ? "Đã submit work." : "Đã lưu draft.");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tạo submission.");
    }
  };

  if (readOnly) {
    return (
      <div className="p-3 text-xs leading-relaxed text-muted-foreground">
        Task đang ở trạng thái read-only, không thể upload file chỉnh sửa.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          Upload edited file
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Upload file đã chỉnh sửa cho task này để Mangaka review.
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Phiên bản
        </p>
        <p className="text-xs font-semibold">
          v{nextVersion} <span className="text-muted-foreground">(tự sinh)</span>
        </p>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          File kết quả
        </label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background/60 px-3 py-4 text-xs text-muted-foreground hover:border-foreground/40">
          <Upload className="size-3.5" />
          <span className="truncate">{file ? file.name : "Chọn file để upload"}</span>
          <input
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Submission note
        </label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú gửi Mangaka (tùy chọn)..."
          className="text-xs"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={createSubmission.isPending}
          onClick={() => save("DRAFT")}
        >
          <Save className="size-3.5" /> Save Draft
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={createSubmission.isPending}
          onClick={() => save("SUBMITTED")}
        >
          <Send className="size-3.5" /> Submit Work
        </Button>
      </div>
    </div>
  );
}

function CommentComposer({
  onAddComment,
}: {
  onAddComment: (text: string, blocking: boolean) => boolean | Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    setSubmitting(true);
    const ok = await onAddComment(body, blocking);
    setSubmitting(false);
    if (ok) {
      setText("");
      setBlocking(false);
    }
  };

  return (
    <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Add Comment
      </Label>
      <Textarea
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a production note..."
        className="text-xs"
      />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={blocking}
            onChange={(event) => setBlocking(event.target.checked)}
            className="rounded border-border"
          />
          Blocking
        </label>
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={!text.trim() || submitting}
          onClick={submit}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

function InspectorBody({
  chapter,
  page,
  selection,
  regions,
  tasks,
  comments,
  onCreateTask,
  onAddComment,
  onDiscardRegion,
  onSetCommentStatus,
  permissions,
  userId,
  onTaskAction,
  onReviewSubmission,
  onAdminOverride,
}: Props) {
  const [blockReason, setBlockReason] = useState("");
  const [isBlockExpanded, setIsBlockExpanded] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [overrideAction, setOverrideAction] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [isRevisionNoteExpanded, setIsRevisionNoteExpanded] = useState(false);

  const taskIdForSubmissions = selection.kind === "task" ? selection.taskId : "";
  const { data: submissions = [] } = useTaskSubmissionsQuery(taskIdForSubmissions);

  if (selection.kind === "none") {
    return (
      <div className="space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Chọn region, task hoặc comment trên canvas hoặc layers panel để xem chi tiết.
        </p>
      </div>
    );
  }

  if (selection.kind === "page") {
    if (!page) return <Empty>Page không tồn tại.</Empty>;
    const pageRegions = regions.filter((r) => r.pageId === page.id);
    const pageTasks = tasks.filter((t) => t.pageId === page.id);
    const pageComments = comments.filter((c) => c.pageId === page.id);
    const blocking = pageComments.filter(
      (c) => isBlockingComment(c) && c.status !== "RESOLVED",
    ).length;
    return (
      <div className="divide-y divide-border/60 pt-2">
        <SectionTitle>Page {chapterPageLabel(page)}</SectionTitle>
        <Field label="Index" value={chapterPageNumber(page) ?? "—"} />
        <Field label="File" value={<span className="truncate">{page.fileName}</span>} />
        <Field label="Uploaded" value={formatDateTime(page.uploadedAt)} />
        <Field label="Regions" value={pageRegions.length} />
        <Field label="Tasks" value={pageTasks.length} />
        <Field label="Comments" value={pageComments.length} />
        <Field label="Blocking" value={blocking} />
        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}
      </div>
    );
  }

  if (selection.kind === "region") {
    const region = regions.find((r) => r.id === selection.regionId);
    if (!region) return <Empty>Region đã bị xóa.</Empty>;
    const linked = region.taskId ? tasks.find((t) => t.id === region.taskId) : undefined;
    const hasActive =
      Boolean(linked) &&
      linked!.status !== "EDITOR_APPROVED" &&
      linked!.status !== "REJECTED" &&
      linked!.status !== "CANCELLED";
    const initials = (linked?.assigneeName ?? "?")
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const regionComments = comments.filter((c) => c.regionId === region.id);

    return (
      <div className="pt-2">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "hsl(217 91% 60%)" }}
              aria-hidden
            />
            <h3 className="text-base font-bold leading-tight">{region.label ?? "Region"}</h3>
          </div>
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          <Field
            label="Type"
            value={
              <Pill className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {REGION_TYPE_LABEL[region.type]}
              </Pill>
            }
          />
          <Field
            label="Status"
            value={<Pill className={REGION_STATUS_BADGE[region.status]}>{region.status}</Pill>}
          />
          <Field label="Comments Count" value={regionComments.length} />
          <Field
            label="Linked Task"
            value={
              linked ? (
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                  {linked.id.toUpperCase().slice(0, 10)}
                  <ExternalLink className="h-3 w-3" />
                </span>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Assignee"
            value={
              linked?.assigneeName ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span>{linked.assigneeName}</span>
                </span>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Due Date"
            value={
              linked?.dueAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(linked.dueAt)}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>

        <details className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground">
            Advanced coordinates
          </summary>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-muted-foreground">
            X: {Math.round(region.x)} Y: {Math.round(region.y)} W: {Math.round(region.width)} H:{" "}
            {Math.round(region.height)}
          </p>
        </details>

        {linked ? (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Instructions</p>
            <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground/90">
              {linked.instructions || "—"}
            </div>
            {canShowAssistantSubmissionPanel(linked, permissions, userId) ? (
              <div className="mt-3 rounded-md border border-border bg-background">
                <AssistantTaskSubmissionPanel
                  task={linked}
                  readOnly={isAssistantTaskReadOnly(linked, userId)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {permissions.canCreateTask ? (
            <Button size="sm" className="h-9 gap-1.5" disabled={hasActive} onClick={onCreateTask}>
              <Plus className="h-4 w-4" /> Create Assistant Task
            </Button>
          ) : null}
        </div>
        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}

        {hasActive ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>This region already has an active task.</span>
          </div>
        ) : null}

        {permissions.canUseAdminOverride && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone (Admin Override)
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Select Override Action
                </Label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="">Select Action...</option>
                  <option value="force_delete_region">Force Delete Region</option>
                  <option value="bypass_approval_checks">Bypass Approval Checks</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Override Reason
                </Label>
                <Input
                  type="text"
                  placeholder="E.g., System misalignment repair"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="mt-1 h-7 text-xs text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-override-region"
                  checked={overrideConfirmed}
                  onChange={(e) => setOverrideConfirmed(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="confirm-override-region"
                  className="text-[10px] text-muted-foreground select-none"
                >
                  I confirm this override will be logged in the audit trail.
                </label>
              </div>
              {overrideAction && overrideReason && (
                <div className="rounded border border-red-100 bg-red-100/50 p-2 text-[10px] dark:border-red-950 dark:bg-red-950/40 text-foreground">
                  <p className="font-bold text-red-800 dark:text-red-300">Audit Trail Preview:</p>
                  <p className="mt-1">
                    <span className="font-semibold">Action:</span> admin.override.{overrideAction}
                  </p>
                  <p>
                    <span className="font-semibold">Target:</span> {region.id}
                  </p>
                  <p className="break-all">
                    <span className="font-semibold">Reason:</span> {overrideReason}
                  </p>
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full h-8 text-xs font-bold"
                disabled={!overrideAction || !overrideReason || !overrideConfirmed}
                onClick={() => {
                  if (onAdminOverride) {
                    onAdminOverride(overrideAction, region.id, overrideReason);
                    setOverrideAction("");
                    setOverrideReason("");
                    setOverrideConfirmed(false);
                  }
                }}
              >
                Execute Override
              </Button>
            </div>
          </div>
        )}

        {permissions.canDeleteRegion ? (
          <button
            type="button"
            onClick={() => onDiscardRegion(region.id)}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline"
          >
            <Trash2 className="h-3 w-3" /> Discard region
          </button>
        ) : null}
      </div>
    );
  }

  if (selection.kind === "task") {
    const task = tasks.find((t) => t.id === selection.taskId);
    if (!task) return <Empty>Task không tồn tại.</Empty>;
    const initials = (task.assigneeName ?? "?")
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const taskComments = comments.filter((c) => c.taskId === task.id);
    const latestSubmission = submissions[0];

    return (
      <div className="pt-2">
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>{task.title}</SectionTitle>
          <Pill className={TASK_STATUS_BADGE[task.status]}>{task.status}</Pill>
        </div>
        {task.blocked && (
          <div className="mb-3 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Task Blocked</p>
              <p className="text-[11px] leading-tight">
                Reason: {task.blockedReason || "Unspecified"}
              </p>
            </div>
          </div>
        )}
        <div className="divide-y divide-border/60">
          <Field label="ID" value={<code className="text-[11px]">{task.id}</code>} />
          <Field label="Type" value={REGION_TYPE_LABEL[task.type]} />
          <Field label="Assignee" value={task.assigneeName} />
          <Field label="Priority" value={task.priority} />
          <Field label="Due" value={formatDate(task.dueAt)} />
          <Field
            label="Target"
            value={`Page ${page?.index ?? "—"} · Region ${task.regionId?.slice(-4) ?? "—"}`}
          />
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Instructions</p>
          <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground/90">
            {task.instructions || "—"}
          </div>
          {canShowAssistantSubmissionPanel(task, permissions, userId) ? (
            <div className="mt-3 rounded-md border border-border bg-background">
              <AssistantTaskSubmissionPanel
                task={task}
                readOnly={isAssistantTaskReadOnly(task, userId)}
              />
            </div>
          ) : null}
        </div>

        {/* Mangaka Task Actions */}
        {permissions.mode === "mangaka" && (
          <div className="mt-4 border-t border-border pt-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Task Administration
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {task.status !== "EDITOR_APPROVED" &&
                task.status !== "REJECTED" &&
                task.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 gap-1.5 text-xs"
                    onClick={() => onTaskAction && onTaskAction(task.id, "cancel")}
                  >
                    Cancel Task
                  </Button>
                )}

              {(task.status === "EDITOR_APPROVED" ||
                task.status === "REJECTED" ||
                task.status === "CANCELLED" ||
                task.status === "MANGAKA_APPROVED") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs"
                  onClick={() => onTaskAction && onTaskAction(task.id, "reopen")}
                >
                  Reopen Task
                </Button>
              )}

              {task.status !== "EDITOR_APPROVED" &&
                (task.blocked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs col-span-2"
                    onClick={() => onTaskAction && onTaskAction(task.id, "unblock")}
                  >
                    Unblock Task
                  </Button>
                ) : (
                  <div className="col-span-2 space-y-2">
                    {!isBlockExpanded ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 text-xs"
                        onClick={() => setIsBlockExpanded(true)}
                      >
                        Mark Blocked
                      </Button>
                    ) : (
                      <div className="rounded border border-amber-300 bg-amber-50/50 p-2 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2">
                        <Label className="text-[10px] font-bold text-amber-900 dark:text-amber-200">
                          Blocked Reason
                        </Label>
                        <Input
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Reason for blocking task..."
                          className="h-7 text-xs text-foreground"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1"
                            onClick={() => {
                              setIsBlockExpanded(false);
                              setBlockReason("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={!blockReason}
                            onClick={() => {
                              if (onTaskAction) {
                                onTaskAction(task.id, "block", { reason: blockReason });
                                setIsBlockExpanded(false);
                                setBlockReason("");
                              }
                            }}
                          >
                            Confirm Block
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}

        {/* Assistant Submission Shortcut */}
        {permissions.mode === "assistant" && (
          <div className="mt-4 border-t border-border pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Nộp Bài
            </h4>
            <TaskSubmissionPanel
              task={task}
              user={{ id: userId, name: "Assistant", email: "", role: "assistant" }}
              readOnly={false}
            />
          </div>
        )}

        {/* Editor Actions, Comments & Submissions */}
        {permissions.mode === "editor" && (
          <div className="space-y-4">
            {latestSubmission &&
              (latestSubmission.status === "PENDING" ||
                latestSubmission.status === "SUBMITTED") && (
                <div className="mt-4 border-t border-border pt-3 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Review Submission
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                      onClick={() =>
                        onReviewSubmission &&
                        onReviewSubmission(latestSubmission.id, "editor-approve")
                      }
                    >
                      Approve
                    </Button>
                    {!isRevisionNoteExpanded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-9"
                        onClick={() => setIsRevisionNoteExpanded(true)}
                      >
                        Request Revision
                      </Button>
                    )}
                  </div>
                  {isRevisionNoteExpanded && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">
                        Revision Notes
                      </Label>
                      <Textarea
                        placeholder="What needs to be corrected..."
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        className="text-xs h-16 text-foreground"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => {
                            setIsRevisionNoteExpanded(false);
                            setRevisionNote("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={!revisionNote}
                          onClick={() => {
                            if (onReviewSubmission) {
                              onReviewSubmission(
                                latestSubmission.id,
                                "request-revision",
                                revisionNote,
                              );
                              setIsRevisionNoteExpanded(false);
                              setRevisionNote("");
                            }
                          }}
                        >
                          Send Request
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Submission History */}
            <div className="mt-4 border-t border-border pt-3">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submission History
              </h4>
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-lg border border-border bg-muted/40 p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {sub.versionLabel || `v${sub.version}`}
                        </span>
                        <Pill className={SUBMISSION_STATUS_BADGE[sub.status] || "bg-zinc-200"}>
                          {sub.status}
                        </Pill>
                      </div>
                      {sub.note && <p className="mt-1 text-muted-foreground">{sub.note}</p>}
                      {sub.feedback && (
                        <div className="mt-1 border-t border-border/40 pt-1 text-[11px] text-orange-600 dark:text-orange-400">
                          <span className="font-semibold">Review:</span> {sub.feedback}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Submitted: {formatDateTime(sub.submittedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List task comments */}
            <div className="mt-4 border-t border-border pt-3">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Task Comments
              </h4>
              {taskComments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No task comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {taskComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded border border-border bg-background p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{comment.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-foreground/90">{comment.body || comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone for Admin (Task context) */}
        {permissions.canUseAdminOverride && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone (Admin Override)
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Select Override Action
                </Label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="">Select Action...</option>
                  <option value="reassign_locked_task">Reassign Locked Task</option>
                  <option value="reset_chapter_state">Reset Chapter State</option>
                  <option value="bypass_approval_checks">Bypass Approval Checks</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Override Reason
                </Label>
                <Input
                  type="text"
                  placeholder="E.g., System misalignment repair"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="mt-1 h-7 text-xs text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-override-task"
                  checked={overrideConfirmed}
                  onChange={(e) => setOverrideConfirmed(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="confirm-override-task"
                  className="text-[10px] text-muted-foreground select-none"
                >
                  I confirm this override will be logged in the audit trail.
                </label>
              </div>
              {overrideAction && overrideReason && (
                <div className="rounded border border-red-100 bg-red-100/50 p-2 text-[10px] dark:border-red-950 dark:bg-red-950/40 text-foreground">
                  <p className="font-bold text-red-800 dark:text-red-300">Audit Trail Preview:</p>
                  <p className="mt-1">
                    <span className="font-semibold">Action:</span> admin.override.{overrideAction}
                  </p>
                  <p>
                    <span className="font-semibold">Target:</span> {task.id}
                  </p>
                  <p className="break-all">
                    <span className="font-semibold">Reason:</span> {overrideReason}
                  </p>
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full h-8 text-xs font-bold"
                disabled={!overrideAction || !overrideReason || !overrideConfirmed}
                onClick={() => {
                  if (onAdminOverride) {
                    onAdminOverride(overrideAction, task.id, overrideReason);
                    setOverrideAction("");
                    setOverrideReason("");
                    setOverrideConfirmed(false);
                  }
                }}
              >
                Execute Override
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // comment
  const comment = comments.find((c) => c.id === selection.commentId);
  if (!comment) return <Empty>Comment không tồn tại.</Empty>;
  return (
    <div className="pt-2">
      <SectionTitle>Comment</SectionTitle>
      <div className="divide-y divide-border/60">
        <Field label="Author" value={comment.authorName} />
        <Field label="Status" value={comment.status} />
        <Field label="Blocking" value={isBlockingComment(comment) ? "Yes" : "No"} />
        <Field label="Created" value={formatDateTime(comment.createdAt)} />
      </div>
      <div className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs">
        {comment.body || comment.text}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {canResolveStudioComment(comment, permissions, userId) && comment.status !== "RESOLVED" ? (
          <Button
            size="sm"
            variant="outline"
            className="col-span-2 h-8"
            onClick={() => onSetCommentStatus(comment.id, "RESOLVED")}
          >
            Resolve
          </Button>
        ) : canResolveStudioComment(comment, permissions, userId) ? (
          <Button
            size="sm"
            variant="outline"
            className="col-span-2 h-8"
            onClick={() => onSetCommentStatus(comment.id, "OPEN")}
          >
            Reopen
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CommentsList({
  comments,
  onSetCommentStatus,
  permissions,
  userId,
}: {
  comments: StudioComment[];
  onSetCommentStatus: (id: string, status: StudioComment["status"]) => void;
  permissions: StudioPermissionSet;
  userId: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "blocking" | "open">("newest");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? comments.filter(
          (c) =>
            (c.body || (c.text ?? "")).toLowerCase().includes(q) ||
            c.authorName.toLowerCase().includes(q),
        )
      : comments.slice();
    list.sort((a, b) => {
      if (sort === "blocking") {
        const ab = isBlockingComment(a) && a.status !== "RESOLVED" ? 0 : 1;
        const bb = isBlockingComment(b) && b.status !== "RESOLVED" ? 0 : 1;
        if (ab !== bb) return ab - bb;
      }
      if (sort === "open") {
        const ao = a.status === "OPEN" ? 0 : 1;
        const bo = b.status === "OPEN" ? 0 : 1;
        if (ao !== bo) return ao - bo;
      }
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });
    return list;
  }, [comments, query, sort]);

  return (
    <div className="pt-2">
      <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-card pb-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comments…"
            className="h-7 pl-6 text-[11px]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-7 rounded border border-border bg-background px-1 text-[10px]"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="blocking">Blocking</option>
          <option value="open">Open first</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="pt-6 text-center text-xs text-muted-foreground">
          {comments.length === 0 ? "Chưa có comment." : "Không có comment phù hợp."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id} className="rounded border border-border bg-background p-2 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">{c.authorName}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    c.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : isBlockingComment(c)
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {isBlockingComment(c) && c.status !== "RESOLVED" ? "Blocking" : c.status}
                </span>
              </div>
              <p className="text-foreground/90">{c.body || c.text}</p>
              <div className="mt-1.5 flex justify-end gap-1.5">
                {canResolveStudioComment(c, permissions, userId) && c.status !== "RESOLVED" ? (
                  <button
                    onClick={() => onSetCommentStatus(c.id, "RESOLVED")}
                    className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                  >
                    Resolve
                  </button>
                ) : canResolveStudioComment(c, permissions, userId) ? (
                  <button
                    onClick={() => onSetCommentStatus(c.id, "OPEN")}
                    className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                  >
                    Reopen
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-base font-bold leading-tight">{children}</h3>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="pt-6 text-center text-xs text-muted-foreground">{children}</p>;
}

// keep unused imports tidy
void ChapterStatusPill;
