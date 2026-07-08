import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusPill } from "@/shared/ui";
import {
  Download,
  UploadCloud,
  Archive,
  FileText,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  useAdminMaterialsQuery,
  useArchiveMaterialMutation,
  useRestoreMaterialMutation,
} from "../api/materials.queries";
import { formatDateTime, formatStorageSize } from "../../_shared";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MaterialInspectorProps {
  materialId: string;
  onClose: () => void;
  onReplace: (id: string) => void;
}

export function MaterialInspector({ materialId, onClose, onReplace }: MaterialInspectorProps) {
  const { data: materials } = useAdminMaterialsQuery();
  const material = materials?.find((m) => m.id === materialId);
  const archiveMutation = useArchiveMaterialMutation();
  const restoreMutation = useRestoreMaterialMutation();

  if (!material) return null;

  const latestVersion = material.versions?.[0];
  const size = latestVersion ? latestVersion.size : 0;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden border-[var(--admin-border)] bg-[var(--admin-surface)] p-0">
        <div className="relative px-6 pb-5 pt-6">
          <div className="absolute inset-0 bg-[var(--admin-hover)] opacity-60" />
          <div className="relative flex items-start justify-between">
            <div>
              <DialogTitle className="font-serif text-[20px] font-semibold text-[var(--admin-ink)] leading-tight">
                {material.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] text-[var(--admin-muted)]">
                {material.fileKey}
              </DialogDescription>
            </div>
            <StatusPill status={material.status.toLowerCase()} className="mt-1" />
          </div>
        </div>

        <ScrollArea className="max-h-[56vh]">
          <div>
            <SectionHeading>Asset Details</SectionHeading>
            <div className="space-y-0 px-6 py-3">
              <FieldRow label="Scope">
                <span className="font-medium text-[var(--admin-ink)]">{material.scope}</span>
              </FieldRow>
              <FieldRow label="Kind">
                <span className="font-medium text-[var(--admin-ink)]">{material.kind}</span>
              </FieldRow>
              <FieldRow label="Category">
                <span className="font-medium text-[var(--admin-ink)]">{material.category}</span>
              </FieldRow>
              <FieldRow label="Current Version">
                <span className="font-mono font-medium text-[var(--admin-ink)]">
                  v{material.currentVersion}
                </span>
              </FieldRow>
              <FieldRow label="Size">
                <span className="font-mono font-medium text-[var(--admin-ink)]">
                  {formatStorageSize(size)}
                </span>
              </FieldRow>
              <FieldRow label="Mime Type">
                <span className="font-mono font-medium text-[var(--admin-ink)]">
                  {material.mimeType}
                </span>
              </FieldRow>
              {material.description && (
                <FieldRow label="Description">
                  <span className="text-[var(--admin-ink)]">{material.description}</span>
                </FieldRow>
              )}
              {material.tags && material.tags.length > 0 && (
                <FieldRow label="Tags">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {material.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-[var(--admin-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </FieldRow>
              )}
            </div>

            {material.versions && material.versions.length > 0 && (
              <>
                <SectionHeading>Version History</SectionHeading>
                <div className="space-y-0 px-6 py-3">
                  {material.versions.map((v) => (
                    <div
                      key={v.version}
                      className="border-b border-[var(--admin-border)]/50 py-3 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[var(--admin-ink)] font-mono text-[12px]">
                          v{v.version}
                        </span>
                        <span className="text-[var(--admin-faint)] text-[11px]">
                          {formatDateTime(v.uploadedAt)}
                        </span>
                      </div>
                      <div className="text-[12px] text-[var(--admin-muted)] mb-2">
                        {v.note || "No version note"}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--admin-faint)] mt-2">
                        <span>{formatStorageSize(v.size)}</span>
                        <span>{v.uploadedByName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-9 w-full bg-white text-[13px] hover:bg-[var(--admin-hover)]"
              onClick={() => {
                const url = latestVersion?.url || material.url;
                window.open(url, "_blank");
              }}
            >
              <Download className="mr-2 size-4" /> Download
            </Button>
            <Button
              variant="outline"
              className="h-9 w-full bg-white text-[13px] hover:bg-[var(--admin-hover)]"
              onClick={() => onReplace(material.id)}
            >
              <UploadCloud className="mr-2 size-4" /> Replace
            </Button>
            {material.status !== "ARCHIVED" ? (
              <Button
                variant="outline"
                className="col-span-2 h-9 w-full bg-white text-[13px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                onClick={() => {
                  archiveMutation.mutate(
                    { id: material.id, reason: "Archived from inspector" },
                    {
                      onSuccess: () => onClose(),
                      onError: (e) => toast.error(e.message),
                    },
                  );
                }}
              >
                <Archive className="mr-2 size-4" /> Archive Asset
              </Button>
            ) : (
              <Button
                variant="outline"
                className="col-span-2 h-9 w-full bg-white text-[13px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                onClick={() => {
                  restoreMutation.mutate(
                    { id: material.id, reason: "Restored from inspector" },
                    {
                      onSuccess: () => onClose(),
                      onError: (e) => toast.error(e.message),
                    },
                  );
                }}
              >
                <RefreshCw className="mr-2 size-4" /> Restore Asset
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-[var(--admin-border)] px-6 pb-1 pt-4">
      <div className="size-1 rounded-full bg-[var(--admin-gold)]" />
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-faint)]">
        {children}
      </h4>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)]/50 py-2.5 last:border-b-0">
      <span className="shrink-0 text-[12px] text-[var(--admin-faint)]">{label}</span>
      <div className="min-w-0 flex-1 text-right text-[12px]">{children}</div>
    </div>
  );
}
