import { Textarea } from "@/components/ui/textarea";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { useCreateSubmissionMutation, useTaskSubmissionsQuery } from "../../api/assistant-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import type { User } from "@/shared/auth";
import { Save, Send, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const nextVersion =
    existingSubmissions.length === 0
      ? 1
      : Math.max(...existingSubmissions.map((s) => s.version)) + 1;
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function reset() {
    setFile(null);
    setNote("");
  }

  async function save(status: "DRAFT" | "SUBMITTED") {
    if (status === "SUBMITTED" && !file) {
      toast.error("Hay chon file de submit.");
      return;
    }

    try {
      const uploaded = file
        ? await uploadFileToR2(file, { folder: `submissions/${task.id}` })
        : undefined;

      await createSubmission.mutateAsync({
        intent: status === "DRAFT" ? "DRAFT" : "SUBMIT",
        taskId: task.id,
        seriesId: undefined,
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

      toast.success(status === "SUBMITTED" ? "Da submit." : "Da luu draft.");
      reset();
      if (status === "SUBMITTED") onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Loi khi tao submission.");
    }
  }

  if (readOnly) {
    return (
      <div className={`${className} text-xs text-muted-foreground`}>
        Task dang o trang thai read-only, khong the submit work.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Upload file đã chỉnh sửa cho task này để Mangaka review.
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Phien ban
        </p>
        <p className="text-xs font-semibold">
          v{nextVersion} <span className="text-muted-foreground">(tu sinh)</span>
        </p>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          File ket qua
        </label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background/60 px-3 py-4 text-xs text-muted-foreground hover:border-foreground/40">
          <Upload className="size-3.5" />
          <span>{file ? file.name : "Chon file de upload"}</span>
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
          placeholder="Ghi chu gui Mangaka (tuy chon)..."
          className="text-xs"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => save("DRAFT")}
          disabled={createSubmission.isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          <Save className="size-3.5" /> Save Draft
        </button>
        <button
          onClick={() => save("SUBMITTED")}
          disabled={createSubmission.isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-2 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-3.5" /> Submit Work
        </button>
      </div>
    </div>
  );
}
