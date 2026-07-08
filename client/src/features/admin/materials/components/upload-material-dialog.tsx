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
import { useUploadMaterialMutation } from "../api/materials.queries";

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadMaterialDialog({ open, onOpenChange }: UploadMaterialDialogProps) {
  const uploadMutation = useUploadMaterialMutation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("SERIES");
  const [kind, setKind] = useState("Reference");
  const [category, setCategory] = useState("Art");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("scope", scope);
    formData.append("kind", kind);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("tags", tags);
    formData.append("status", "DRAFT");

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Material uploaded successfully.");
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-semibold text-[var(--admin-ink)]">
            Upload Material
          </DialogTitle>
          <DialogDescription className="hidden">Upload a new material asset.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">File *</label>
            <input
              type="file"
              className="w-full rounded-md border border-[var(--admin-border)] p-2 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">Title *</label>
            <input
              type="text"
              placeholder="e.g. Concept Art V1"
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--admin-ink)]">Scope</label>
              <select
                className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="PROPOSAL">Proposal</option>
                <option value="SERIES">Series</option>
                <option value="CHAPTER">Chapter</option>
                <option value="PAGE">Page</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--admin-ink)]">Kind</label>
              <input
                type="text"
                placeholder="e.g. Reference"
                className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">Category</label>
            <input
              type="text"
              placeholder="e.g. Art"
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">Description</label>
            <textarea
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--admin-ink)]">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. character, reference, v1"
              className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-[var(--admin-ink)] focus:outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="bg-[var(--admin-ink)] text-white hover:bg-[var(--admin-ink)]/90"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
