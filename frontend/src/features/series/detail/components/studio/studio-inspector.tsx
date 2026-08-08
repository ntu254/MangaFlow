import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Download,
  MessageSquare,
  MoreHorizontal,
  Plus,
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
  PageAssignment,
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
  TASK_DELIVERY_ROLE_LABEL,
  isTaskActive,
  taskDeliveryRole,
} from "@/entities/series/model/studio-types";
import {
  useCreateSubmissionMutation,
  useStudioTaskPatchMutation,
  useTaskSubmissionsQuery,
} from "../../../api/series-queries";
import { MaterialDownloadLink, MaterialPreviewImage } from "../material-file-controls";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
  type AssistantSubmission,
} from "@/entities/submission/model/assistant-types";
import { chapterPageLabel, chapterPageNumber } from "@/entities/chapter/model/chapter-pages";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { deriveTaskStudioSubmissionState } from "@/entities/task/model/submission-state";

type Props = {
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  selection: StudioSelection;
  regions: StudioRegion[];
  tasks: StudioTask[];
  comments: StudioComment[];
  onCreateTask: () => void;
  onUploadPages: () => void;
  onSelectTask?: (taskId: string) => void;
  onAddComment: (text: string, blocking: boolean) => boolean | Promise<boolean>;
  onReplyComment: (parent: StudioComment, body: string) => boolean | Promise<boolean>;
  onDiscardRegion: (id: string) => void;
  onSetCommentStatus: (id: string, status: StudioComment["status"]) => void;
  onAddressComment: (id: string) => void;
  permissions: StudioPermissionSet;
  canCreateTaskNow?: boolean;
  chapterReviewLocked?: boolean;
  userId: string;
  onTaskAction?: (taskId: string, action: string, payload?: Record<string, unknown>) => void;
  onReviewSubmission?: (
    submissionId: string,
    action: "approve" | "reject" | "request-revision",
    note?: string,
  ) => void;
  pageAssignment?: PageAssignment;
  assistantMembers?: Array<{ id: string; name: string }>;
  onAssignPage?: (assistantId: string) => void;
  onPageAssignmentAction?: (action: "ACCEPT" | "REJECT" | "RELEASE", reason?: string) => void;
  pageAssignmentBusy?: boolean;
  editorReviewActions?: ReactNode;
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
            {props.editorReviewActions ? (
              <div className="pt-3">{props.editorReviewActions}</div>
            ) : null}
            <InspectorBody {...props} />
          </TabsContent>
          <TabsContent value="comments" className="flex-1 overflow-y-auto px-3 pb-4">
            <CommentsList
              comments={props.comments}
              onReplyComment={props.onReplyComment}
              onSetCommentStatus={props.onSetCommentStatus}
              onAddressComment={props.onAddressComment}
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

const PAGE_ASSIGNMENT_STATUS_BADGE: Record<PageAssignment["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  RELEASED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
};

function pageAssignmentForPage(
  chapter: Chapter | undefined,
  pageId: string,
): PageAssignment | undefined {
  const page = chapter?.pages.find((candidate) => String(candidate.id) === String(pageId));
  return page?.pageAssignment;
}

function PageAssignmentBlock({
  pageAssignment,
  assistantMembers = [],
  mode,
  busy,
  chapterReviewLocked = false,
  userId,
  onAssignPage,
  onPageAssignmentAction,
}: {
  pageAssignment?: PageAssignment;
  assistantMembers: Array<{ id: string; name: string }>;
  mode: string;
  busy?: boolean;
  chapterReviewLocked?: boolean;
  userId: string;
  onAssignPage?: (assistantId: string) => void;
  onPageAssignmentAction?: (action: "ACCEPT" | "REJECT" | "RELEASE", reason?: string) => void;
}) {
  return (
    <div>
      <p className="font-semibold">Page assignment</p>
      <p className="mt-1 text-muted-foreground">
        {pageAssignment
          ? `${pageAssignment.assistantName} · ${pageAssignment.status}`
          : "Not assigned"}
      </p>
      {mode === "mangaka" && onAssignPage ? (
        <div className="mt-2 space-y-2">
          <select
            className="h-8 w-full rounded border border-border bg-background px-2"
            value={pageAssignment?.assistantId ?? ""}
            onChange={(event) => onAssignPage(event.target.value)}
            disabled={
              pageAssignment?.status === "PENDING" || pageAssignment?.status === "ACCEPTED" || busy
            }
          >
            <option value="">Select assistant</option>
            {assistantMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {pageAssignment?.status === "ACCEPTED" ? (
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-full"
                disabled={busy || chapterReviewLocked}
                title={
                  chapterReviewLocked
                    ? "Page Assignment changes are unavailable during Tantou Review."
                    : undefined
                }
                onClick={() => onPageAssignmentAction?.("RELEASE")}
              >
                Release page
              </Button>
              {chapterReviewLocked ? (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Page Assignment changes are unavailable during Tantou Review.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {mode === "assistant" && pageAssignment?.status === "PENDING" ? (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            className="h-8 flex-1"
            disabled={busy}
            onClick={() => onPageAssignmentAction?.("ACCEPT")}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1"
            disabled={busy}
            onClick={() => onPageAssignmentAction?.("REJECT", window.prompt("Reason") ?? "")}
          >
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function isBlockingComment(comment: StudioComment) {
  return comment.isBlocking;
}

function canAddressComment(comment: StudioComment, permissions: StudioPermissionSet) {
  return (
    permissions.mode === "mangaka" &&
    isBlockingComment(comment) &&
    comment.authorRole?.toUpperCase() === "EDITOR" &&
    !["ADDRESSED", "RESOLVED"].includes(comment.status)
  );
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
  return task.assigneeId !== userId || task.status !== "IN_PROGRESS";
}

function SubmissionHistory({ submissions }: { submissions: AssistantSubmission[] }) {
  if (submissions.length === 0) {
    return <p className="text-xs text-muted-foreground">No versions submitted yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {[...submissions]
        .sort((a, b) => b.version - a.version)
        .map((submission) => {
          const previewable = Boolean(
            submission.mimeType?.startsWith("image/") ||
            /\.(png|jpe?g|webp|gif)$/i.test(submission.fileName ?? ""),
          );
          const hasFile = Boolean(submission.fileKey || submission.fileUrl);
          return (
            <li key={submission.id} className="rounded-md border border-border bg-background p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{submission.versionLabel}</span>
                <Pill className={SUBMISSION_STATUS_BADGE[submission.status] || "bg-zinc-200"}>
                  {SUBMISSION_STATUS_LABEL[submission.status]}
                </Pill>
              </div>
              {previewable ? (
                <MaterialPreviewImage
                  fileKey={submission.fileKey}
                  fallbackUrl={submission.fileUrl}
                  alt={`Submitted ${submission.versionLabel}`}
                  className="mt-2 max-h-44 w-full rounded border border-border bg-muted/20 object-contain"
                  onMissing={
                    <div className="mt-2 rounded border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
                      Preview unavailable. Open the submitted file instead.
                    </div>
                  }
                />
              ) : null}
              {hasFile ? (
                <MaterialDownloadLink
                  fileKey={submission.fileKey}
                  fallbackUrl={submission.fileUrl}
                  fileName={submission.fileName}
                  ariaLabel={`Open submitted ${submission.versionLabel}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <Download className="size-3" /> Open submitted file
                </MaterialDownloadLink>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">No file attached.</p>
              )}
              {submission.note ? (
                <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                  {submission.note}
                </p>
              ) : null}
              {submission.feedback ? (
                <p className="mt-2 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Review note:</span> {submission.feedback}
                </p>
              ) : null}
              <p className="mt-2 text-[10px] text-muted-foreground">
                Submitted {formatDateTime(submission.submittedAt)}
              </p>
            </li>
          );
        })}
    </ol>
  );
}

function AssistantTaskSubmissionPanel({ task, readOnly }: { task: StudioTask; readOnly: boolean }) {
  const createSubmission = useCreateSubmissionMutation();
  const { data: existingSubmissions = [] } = useTaskSubmissionsQuery(task.id);
  const submissionState = deriveTaskStudioSubmissionState(task, existingSubmissions);
  const latestSubmission = [...existingSubmissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0];
  const nextVersion =
    existingSubmissions.length === 0
      ? 1
      : Math.max(...existingSubmissions.map((submission) => submission.version)) + 1;
  const expectedCurrentSubmissionId =
    [...existingSubmissions].sort((a, b) => b.version - a.version)[0]?.id ?? null;
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const deliveryRole = taskDeliveryRole(task);
  const requiresFile = deliveryRole !== "SUPPORTING";
  const deliveryCopy =
    deliveryRole === "FINAL_PAGE"
      ? {
          title: "Submit final page",
          description:
            "Upload the complete page. After Mangaka approval, this file replaces the page asset.",
          fileLabel: "Final page file",
          button: "Submit final page",
        }
      : deliveryRole === "REGION_ASSET"
        ? {
            title: "Submit contribution asset",
            description:
              "Upload the result for this contribution. It does not replace the complete page.",
            fileLabel: "Region asset",
            button: "Submit contribution",
          }
        : {
            title: "Submit supporting work",
            description:
              "Add a completion note and, if useful, attach a reference file. It does not replace the complete page.",
            fileLabel: "Reference file (optional)",
            button: "Submit supporting work",
          };

  const reset = () => {
    setFile(null);
    setNote("");
  };

  const submit = async () => {
    if (requiresFile && !file) {
      toast.error("Please select the required output file before submitting.");
      return;
    }
    if (!requiresFile && !file && !note.trim()) {
      toast.error("Add a completion note or attach a reference file before submitting.");
      return;
    }

    try {
      const uploaded = file
        ? await uploadFileToR2(file, { folder: `submissions/${task.id}` })
        : undefined;

      await createSubmission.mutateAsync({
        intent: "SUBMIT",
        taskId: task.id,
        chapterId: task.chapterId,
        pageId: task.pageId,
        notes: note || undefined,
        fileKey: uploaded?.fileKey,
        fileName: uploaded?.filename,
        fileUrl: uploaded?.fileUrl,
        imageUrl: uploaded?.url,
        fileSizeKB: uploaded?.sizeKB,
        mimeType: uploaded?.mimeType,
        expectedCurrentSubmissionId,
      });

      toast.success("Work submitted.");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error creating submission.");
    }
  };

  if (readOnly || !submissionState.canSubmit) {
    const message =
      submissionState.mode === "AWAITING_REVIEW"
        ? "Work already submitted. The latest version is waiting for Mangaka review."
        : submissionState.mode === "REVISION_REQUIRED"
          ? "Review the feedback and reopen this task before submitting a revised version."
          : submissionState.mode === "CLOSED"
            ? "This submission cycle is complete. Review the final version in submission history."
            : submissionState.mode === "NOT_STARTED"
              ? "Start Work before uploading an edited file."
              : "This task is temporarily read-only.";
    return (
      <div className="space-y-2 p-3 text-xs leading-relaxed text-muted-foreground">
        <p>{message}</p>
        {latestSubmission ? (
          <div className="flex items-center justify-between rounded border border-border bg-muted/30 px-2 py-1.5 text-[10px]">
            <span className="font-semibold text-foreground">{latestSubmission.versionLabel}</span>
            <span className="font-bold uppercase tracking-wider">
              {latestSubmission.status.replaceAll("_", " ")}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          {deliveryCopy.title}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {deliveryCopy.description}
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Version
        </p>
        <p className="text-xs font-semibold">
          v{nextVersion} <span className="text-muted-foreground">(auto-generated)</span>
        </p>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {deliveryCopy.fileLabel}
        </label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background/60 px-3 py-4 text-xs text-muted-foreground hover:border-foreground/40">
          <Upload className="size-3.5" />
          <span className="truncate">{file ? file.name : "Select a file to upload"}</span>
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
          placeholder="Note for Mangaka (optional)..."
          className="text-xs"
          rows={4}
        />
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          className="h-8 w-full gap-1.5 text-xs"
          disabled={createSubmission.isPending}
          onClick={submit}
        >
          <Send className="size-3.5" /> {deliveryCopy.button}
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
  onSelectTask,
  onAddComment,
  onDiscardRegion,
  onSetCommentStatus,
  onAddressComment,
  permissions,
  canCreateTaskNow = false,
  chapterReviewLocked = false,
  userId,
  onTaskAction,
  onReviewSubmission,
  pageAssignment,
  assistantMembers = [],
  onAssignPage,
  onPageAssignmentAction,
  pageAssignmentBusy,
}: Props) {
  const [revisionNote, setRevisionNote] = useState("");
  const [isRevisionNoteExpanded, setIsRevisionNoteExpanded] = useState(false);

  const taskIdForSubmissions = selection.kind === "task" ? selection.taskId : "";
  const { data: submissions = [] } = useTaskSubmissionsQuery(taskIdForSubmissions);
  const patchTaskMutation = useStudioTaskPatchMutation(taskIdForSubmissions);

  const handlePriorityChange = (taskId: string, priority: string) => {
    patchTaskMutation.mutate(
      { priority },
      {
        onSuccess: () => toast.success("Task priority updated."),
        onError: () => toast.error("Could not update the task priority."),
      },
    );
  };

  if (selection.kind === "none") {
    return (
      <div className="space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Select a region, task, or comment on the canvas or layers panel to view details.
        </p>
      </div>
    );
  }

  if (selection.kind === "page") {
    if (!page) return <Empty>Page does not exist.</Empty>;
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
        <div className="mt-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
          <PageAssignmentBlock
            pageAssignment={pageAssignment}
            assistantMembers={assistantMembers}
            mode={permissions.mode}
            busy={pageAssignmentBusy}
            chapterReviewLocked={chapterReviewLocked}
            userId={userId}
            onAssignPage={onAssignPage}
            onPageAssignmentAction={onPageAssignmentAction}
          />
        </div>
        {permissions.canCreateTask ? (
          <Button
            size="sm"
            className="mt-3 h-9 w-full gap-1.5"
            disabled={!canCreateTaskNow}
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4" /> Create Assistant Task
          </Button>
        ) : null}
        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}
      </div>
    );
  }

  if (selection.kind === "region") {
    const region = regions.find((r) => r.id === selection.regionId);
    if (!region) return <Empty>Region has been deleted.</Empty>;
    const pageTasks = tasks.filter((t) => t.pageId === region.pageId);
    const pageAssignment = pageAssignmentForPage(chapter, region.pageId);
    const initials = (pageAssignment?.assistantName ?? "?")
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
            label="Page Assignment"
            value={
              pageAssignment ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span>{pageAssignment.assistantName}</span>
                  <Pill className={PAGE_ASSIGNMENT_STATUS_BADGE[pageAssignment.status]}>
                    {pageAssignment.status}
                  </Pill>
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>

        <div className="mt-3 rounded-md border border-border bg-background">
          <p className="border-b border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
            Page tasks ({pageTasks.length})
          </p>
          {pageTasks.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No tasks on this page yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {pageTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTask?.(task.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40"
                  >
                    <span className="min-w-0 truncate text-xs font-medium">{task.title}</span>
                    <Pill className={TASK_STATUS_BADGE[task.status]}>{task.status}</Pill>
                  </button>
                </li>
              ))}
            </ul>
          )}
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

        <div className="mt-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
          <PageAssignmentBlock
            pageAssignment={pageAssignment}
            assistantMembers={assistantMembers}
            mode={permissions.mode}
            busy={pageAssignmentBusy}
            chapterReviewLocked={chapterReviewLocked}
            userId={userId}
            onAssignPage={onAssignPage}
            onPageAssignmentAction={onPageAssignmentAction}
          />
        </div>

        {permissions.canCreateTask ? (
          <div className="mt-4 space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="h-9 gap-1.5"
                disabled={!canCreateTaskNow}
                title={
                  chapterReviewLocked
                    ? "Create Task unavailable during Tantou Review. Return the chapter to IN_PRODUCTION first."
                    : undefined
                }
                onClick={onCreateTask}
              >
                <Plus className="h-4 w-4" /> Create Assistant Task
              </Button>
            </div>
            {chapterReviewLocked ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Create Task unavailable during Tantou Review. Return the chapter to IN_PRODUCTION
                first.
              </p>
            ) : null}
          </div>
        ) : null}
        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}

        {permissions.mode === "assistant" &&
        pageAssignment &&
        String(pageAssignment.assistantId) !== userId ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              This page is assigned to {pageAssignment.assistantName}. Other assistants cannot
              accept or work on tasks from this page.
            </span>
          </div>
        ) : null}

        {permissions.canDeleteRegion ? (
          <button
            type="button"
            disabled={pageTasks.some((t) => isTaskActive(t.status))}
            title={
              pageTasks.some((t) => isTaskActive(t.status))
                ? "Discard this region only after its production tasks are done."
                : undefined
            }
            onClick={() => onDiscardRegion(region.id)}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
          >
            <Trash2 className="h-3 w-3" /> Discard region
          </button>
        ) : null}
      </div>
    );
  }

  if (selection.kind === "task") {
    const task = tasks.find((t) => t.id === selection.taskId);
    if (!task) return <Empty>Task does not exist.</Empty>;
    const initials = (task.assigneeName ?? "?")
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const taskComments = comments.filter((c) => c.taskId === task.id);
    const latestSubmission = submissions[0];
    const taskPage = chapter?.pages.find((p) => p.id === task.pageId);

    return (
      <div className="pt-2">
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>{task.title}</SectionTitle>
          <Pill className={TASK_STATUS_BADGE[task.status]}>{task.status}</Pill>
        </div>
        <div className="divide-y divide-border/60">
          <Field label="ID" value={<code className="text-[11px]">{task.id}</code>} />
          <Field label="Type" value={REGION_TYPE_LABEL[task.type]} />
          <Field label="Deliverable" value={TASK_DELIVERY_ROLE_LABEL[taskDeliveryRole(task)]} />
          {taskDeliveryRole(task) !== "FINAL_PAGE" ? (
            <Field label="Blocks final page" value={task.blocksPageDelivery ? "Yes" : "No"} />
          ) : null}
          <Field label="Assignee" value={task.assigneeName} />
          <Field
            label="Priority"
            value={
              permissions.canEditTask ? (
                <select
                  className="h-7 w-24 rounded border border-border bg-background px-1 text-[11px] font-medium"
                  value={task.priority}
                  disabled={patchTaskMutation.isPending}
                  onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              ) : (
                task.priority
              )
            }
          />
          <Field label="Due" value={formatDate(task.dueAt)} />
          <Field label="Target" value={`Page ${page?.index ?? "—"}`} />
          {task.pageId ? (
            <Field
              label="Original Page"
              value={
                <MaterialDownloadLink
                  fileKey={taskPage?.fileKey}
                  fallbackUrl={taskPage?.fileUrl}
                  fileName={taskPage ? `page-${taskPage.index}` : undefined}
                  ariaLabel="Download page"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  <Download className="h-3.5 w-3.5" /> Download page
                </MaterialDownloadLink>
              }
            />
          ) : null}
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

        <section className="mt-4 border-t border-border pt-3" aria-label="Submission history">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Submitted versions
          </h4>
          <SubmissionHistory submissions={submissions} />
        </section>

        {/* Mangaka Task Actions */}
        {permissions.mode === "mangaka" && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Task Administration
            </h4>
            <div>
              {task.status !== "MANGAKA_APPROVED" &&
                task.status !== "REJECTED" &&
                task.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 w-full gap-1.5 text-xs"
                    onClick={() => onTaskAction?.(task.id, "cancel")}
                  >
                    Cancel Task
                  </Button>
                )}
            </div>
          </div>
        )}

        {/* Assistant Task Lifecycle */}
        {permissions.mode === "assistant" && task.assigneeId === userId ? (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Task Lifecycle
            </h4>
            <div className="space-y-2">
              {task.status === "TODO" ? (
                <Button
                  size="sm"
                  className="h-9 w-full gap-1.5 text-xs"
                  onClick={() => onTaskAction?.(task.id, "start")}
                >
                  Start Work
                </Button>
              ) : null}

              {task.status === "REVISION_REQUESTED" ? (
                <Button
                  size="sm"
                  className="h-9 w-full gap-1.5 text-xs"
                  onClick={() => onTaskAction?.(task.id, "reopen")}
                >
                  Reopen Task
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {permissions.canCreateTask ? (
          <Button
            size="sm"
            className="mt-3 h-9 w-full gap-1.5"
            disabled={!canCreateTaskNow}
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4" /> Create Another Task on This Page
          </Button>
        ) : null}

        {permissions.canCreateComment ? <CommentComposer onAddComment={onAddComment} /> : null}

        {/* Editor reference, comments & submissions */}
        {permissions.mode === "editor" && (
          <div className="space-y-4">
            {latestSubmission ? (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assistant Submission
                </h4>
                <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Tantou no longer approves or revisions Assistant submissions directly. Use
                  consolidated Chapter/Page review comments and decisions instead.
                </p>
              </div>
            ) : null}

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
      </div>
    );
  }

  // comment
  const comment = comments.find((c) => c.id === selection.commentId);
  if (!comment) return <Empty>Comment does not exist.</Empty>;
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
        {canAddressComment(comment, permissions) ? (
          <Button
            size="sm"
            variant="outline"
            className="col-span-2 h-8"
            onClick={() => onAddressComment(comment.id)}
          >
            Mark addressed
          </Button>
        ) : canResolveStudioComment(comment, permissions, userId) ? (
          <>
            {comment.status !== "RESOLVED" ? (
              <Button
                size="sm"
                variant="outline"
                className={comment.status === "ADDRESSED" ? "h-8" : "col-span-2 h-8"}
                onClick={() => onSetCommentStatus(comment.id, "RESOLVED")}
              >
                Resolve
              </Button>
            ) : null}
            {["ADDRESSED", "RESOLVED"].includes(comment.status) ? (
              <Button
                size="sm"
                variant="outline"
                className={comment.status === "RESOLVED" ? "col-span-2 h-8" : "h-8"}
                onClick={() => onSetCommentStatus(comment.id, "REOPENED")}
              >
                Reopen
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function CommentsList({
  comments,
  onReplyComment,
  onSetCommentStatus,
  onAddressComment,
  permissions,
  userId,
}: {
  comments: StudioComment[];
  onReplyComment: (parent: StudioComment, body: string) => boolean | Promise<boolean>;
  onSetCommentStatus: (id: string, status: StudioComment["status"]) => void;
  onAddressComment: (id: string) => void;
  permissions: StudioPermissionSet;
  userId: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "blocking" | "open">("newest");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
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
        const ab = isBlockingComment(a) && !["RESOLVED", "ADDRESSED"].includes(a.status) ? 0 : 1;
        const bb = isBlockingComment(b) && !["RESOLVED", "ADDRESSED"].includes(b.status) ? 0 : 1;
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
          {comments.length === 0 ? "No comments yet." : "No matching comments."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              data-comment-id={c.id}
              data-parent-comment-id={c.parentCommentId}
              className={`rounded border border-border bg-background p-2 text-xs ${
                c.parentCommentId ? "ml-5 border-l-2 border-l-accent/50" : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">
                  {c.authorName}
                  {c.parentCommentId ? (
                    <span className="ml-1.5 font-medium text-muted-foreground">Reply</span>
                  ) : null}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    ["RESOLVED", "ADDRESSED"].includes(c.status)
                      ? "bg-emerald-100 text-emerald-800"
                      : isBlockingComment(c)
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {isBlockingComment(c) && !["RESOLVED", "ADDRESSED"].includes(c.status)
                    ? "Blocking"
                    : c.status}
                </span>
              </div>
              <p className="text-foreground/90">{c.body || c.text}</p>
              <div className="mt-1.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReplyToId(c.id);
                    setReplyBody("");
                  }}
                  className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                >
                  Reply
                </button>
                {canAddressComment(c, permissions) ? (
                  <button
                    onClick={() => onAddressComment(c.id)}
                    className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                  >
                    Mark addressed
                  </button>
                ) : canResolveStudioComment(c, permissions, userId) ? (
                  <>
                    {c.status !== "RESOLVED" ? (
                      <button
                        onClick={() => onSetCommentStatus(c.id, "RESOLVED")}
                        className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                      >
                        Resolve
                      </button>
                    ) : null}
                    {["ADDRESSED", "RESOLVED"].includes(c.status) ? (
                      <button
                        onClick={() => onSetCommentStatus(c.id, "REOPENED")}
                        className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                      >
                        Reopen
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
              {replyToId === c.id ? (
                <form
                  className="mt-2 space-y-1.5 border-t border-border pt-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const body = replyBody.trim();
                    if (!body || replying) return;
                    setReplying(true);
                    const saved = await onReplyComment(c, body);
                    setReplying(false);
                    if (saved) {
                      setReplyToId(null);
                      setReplyBody("");
                    }
                  }}
                >
                  <Textarea
                    aria-label={`Reply to ${c.authorName}`}
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write a reply…"
                    className="min-h-16 text-xs"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      disabled={replying}
                      onClick={() => {
                        setReplyToId(null);
                        setReplyBody("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-7"
                      disabled={replying || !replyBody.trim()}
                    >
                      {replying ? "Replying…" : "Submit reply"}
                    </Button>
                  </div>
                </form>
              ) : null}
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
