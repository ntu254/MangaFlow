import { Textarea } from "@/components/ui/textarea";
import { taskDeliveryRole, type StudioTask } from "@/entities/series/model/studio-types";
import { useCreateSubmissionMutation, useTaskSubmissionsQuery } from "../../api/assistant-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import type { User } from "@/shared/auth";
import { Send, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deriveTaskStudioSubmissionState } from "@/entities/task/model/submission-state";
import { MaterialDownloadLink } from "@/features/series/detail/components/material-file-controls";

export function TaskSubmissionPanel({
  task,
  readOnly,
  onSubmitted,
  className = "p-3",
  title = "Upload edited file",
}: {
  task: StudioTask;
  user?: User;
  readOnly: boolean;
  onSubmitted?: () => void;
  className?: string;
  title?: string;
}) {
  const createSubmission = useCreateSubmissionMutation();
  const { data: existingSubmissions = [] } = useTaskSubmissionsQuery(task.id);
  const submissionState = deriveTaskStudioSubmissionState(task, existingSubmissions);
  const latestSubmission = [...existingSubmissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0];
  const nextVersion =
    existingSubmissions.length === 0
      ? 1
      : Math.max(...existingSubmissions.map((s) => s.version)) + 1;
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
            "Upload the completed page. Once approved by Mangaka, it becomes the current page asset.",
          fileLabel: "Final page file",
          button: "Submit final page",
        }
      : deliveryRole === "REGION_ASSET"
        ? {
            title: "Submit contribution asset",
            description:
              "Upload the output for this contribution. It will not replace the complete page.",
            fileLabel: "Region asset",
            button: "Submit contribution",
          }
        : {
            title: "Submit supporting work",
            description:
              "Add a completion note and optionally attach a reference file. It will not replace the complete page.",
            fileLabel: "Reference file (optional)",
            button: "Submit supporting work",
          };

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function reset() {
    setFile(null);
    setNote("");
  }

  async function submit() {
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
        seriesId: undefined,
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

      toast.success("Submitted.");
      reset();
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating submission.");
    }
  }

  if (readOnly && submissionState.canSubmit) {
    return (
      <div className={`${className} text-xs text-muted-foreground`}>
        Task is in read-only state, cannot submit work.
      </div>
    );
  }

  if (!submissionState.canSubmit) {
    const copy = {
      NOT_STARTED: {
        title: "Start this task before submitting",
        description:
          "Use Start Work below after reviewing the instructions. Upload becomes available when the task is in progress.",
      },
      AWAITING_REVIEW: {
        title: "Work already submitted",
        description:
          "The latest version is waiting for Mangaka review. You can inspect the submitted file and review status in History.",
      },
      REVISION_REQUIRED: {
        title: "Revision requested",
        description:
          "Read the feedback first, then reopen the task from the action bar before uploading a revised version.",
      },
      CLOSED: {
        title: "Submission cycle completed",
        description:
          "This task no longer accepts uploads. The approved or final version remains available in History.",
      },
      WORKING: {
        title: "Submission unavailable",
        description: "Refresh the task before trying again.",
      },
    }[submissionState.mode];

    return (
      <div className={`${className} space-y-3`}>
        <div className="rounded-md border border-border bg-background/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">{copy.title}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
        </div>
        {latestSubmission ? (
          <dl className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-border bg-card p-2">
              <dt className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Latest version
              </dt>
              <dd className="mt-1 font-semibold">{latestSubmission.versionLabel}</dd>
            </div>
            <div className="rounded border border-border bg-card p-2">
              <dt className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Review status
              </dt>
              <dd className="mt-1 font-semibold">{latestSubmission.status.replaceAll("_", " ")}</dd>
            </div>
          </dl>
        ) : null}
        {latestSubmission?.fileKey || latestSubmission?.fileUrl ? (
          <MaterialDownloadLink
            fileKey={latestSubmission.fileKey}
            fallbackUrl={latestSubmission.fileUrl}
            fileName={latestSubmission.fileName}
            ariaLabel={`Open ${latestSubmission.versionLabel}`}
            className="inline-flex text-[11px] font-semibold text-primary hover:underline"
          >
            Open submitted file
          </MaterialDownloadLink>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          {title === "Upload edited file" ? deliveryCopy.title : title}
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
          <span>{file ? file.name : "Choose file to upload"}</span>
          <input type="file" className="hidden" onChange={pick} />
        </label>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Submission note
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note to Mangaka (optional)..."
          className="text-xs"
          rows={4}
        />
      </div>
      <div>
        <button
          onClick={submit}
          disabled={createSubmission.isPending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-2 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-3.5" /> {deliveryCopy.button}
        </button>
      </div>
    </div>
  );
}
