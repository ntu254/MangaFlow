import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useReplaceMaterialMutation, useAdminMaterialsQuery } from "../api/materials.queries";

interface ReplaceMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
}

export function ReplaceMaterialDialog({
  open,
  onOpenChange,
  materialId,
}: ReplaceMaterialDialogProps) {
  const { data: materials } = useAdminMaterialsQuery();
  const material = materials?.find((m) => m.id === materialId);
  const replaceMutation = useReplaceMaterialMutation();

  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "IN_REVIEW" | "APPROVED" | "ARCHIVED">(
    material?.status || "DRAFT",
  );

  if (!material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a new file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("note", note);
    formData.append("status", status);

    replaceMutation.mutate(
      { id: materialId, body: formData },
      {
        onSuccess: () => {
          toast.success("New version uploaded successfully.");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-semibold text-[var(--admin-ink)]">
            Replace File
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--admin-muted)]">
            Uploading a new file will create a new version (v{material.currentVersion + 1}).
            Previous versions are preserved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">New File *</label>
            <input
              type="file"
              className="w-full rounded-md border border-[var(--admin-border)] p-2 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">Version Note</label>
            <input
              type="text"
              placeholder="e.g. Fixed color grading"
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">Update Status</label>
            <select
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "DRAFT" | "ACTIVE" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
                )
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={replaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={replaceMutation.isPending}
              className="bg-[var(--admin-ink)] text-white hover:bg-[var(--admin-ink)]/90"
            >
              {replaceMutation.isPending ? "Uploading..." : "Upload New Version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
