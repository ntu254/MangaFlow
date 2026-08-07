import { useMemo, useState } from "react";
import {
  FileText,
  ExternalLink,
  ImageIcon,
  Compass,
  Layers,
  FileCheck,
  Loader2,
  Eye,
  FileBox,
} from "lucide-react";
import type {
  SeriesProposal,
  SupportingMaterialKind,
} from "@/entities/proposal/model/proposal-types";
import { MATERIAL_KIND_LABEL } from "@/entities/proposal/model/proposal-types";
import {
  proposalSubmissionPackageItems,
  proposalSupportingMaterialItems,
  type ProposalAttachmentItem,
} from "@/entities/proposal/model/proposal-attachments";
import { ResolvedFileLink } from "@/shared/ui/resolved-file-link";
import { useResolvedFileUrl } from "@/shared/lib/use-resolved-file-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MaterialsViewer({
  proposal,
  scope = "package",
}: {
  proposal: SeriesProposal;
  scope?: "package" | "supporting";
}) {
  const items = useMemo(
    () =>
      scope === "supporting"
        ? proposalSupportingMaterialItems(proposal)
        : proposalSubmissionPackageItems(proposal),
    [proposal, scope],
  );
  const [filter, setFilter] = useState<"all" | "manuscript" | SupportingMaterialKind>("all");
  const [previewItem, setPreviewItem] = useState<ProposalAttachmentItem | null>(null);

  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set("all", items.length);

    for (const item of items) {
      if (item.kind === "manuscript") {
        counts.set("manuscript", (counts.get("manuscript") ?? 0) + 1);
      } else if (item.kind === "material" && item.materialKind) {
        counts.set(item.materialKind, (counts.get(item.materialKind) ?? 0) + 1);
      }
    }

    const possible = [
      "all",
      ...(scope === "package" ? ["manuscript" as const] : []),
      "storyboard",
      "character",
      "world",
      "reference",
      "other",
    ] as const;

    return possible
      .filter((cat) => (counts.get(cat) ?? 0) > 0)
      .map((cat) => ({
        key: cat,
        label: filterLabel(cat),
        count: counts.get(cat) ?? 0,
      }));
  }, [items, scope]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "manuscript") return items.filter((i) => i.kind === "manuscript");
    return items.filter((i) => i.kind === "material" && i.materialKind === filter);
  }, [items, filter]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-12 text-center">
        <FileBox className="size-8 text-muted-foreground/60" />
        <p className="mt-2 text-xs font-semibold text-foreground">No materials attached</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">This proposal does not contain any manuscripts or creative assets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Dynamic Ultra-Compact Category Filter Bar */}
      {availableCategories.length > 2 ? (
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
          {availableCategories.map((cat) => {
            const isActive = filter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setFilter(cat.key as typeof filter)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({cat.count})</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Attachment Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((it) => {
          const IconComponent = getAttachmentIcon(it);
          const badge = getItemCategoryBadge(it);

          return (
            <div
              key={it.id}
              className="group flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-3.5 transition-all duration-200 hover:border-border hover:bg-background/80 hover:shadow-2xs"
            >
              <div className="space-y-2.5">
                {/* Category Badge & Format Tag */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-muted-foreground/80 uppercase">
                    {it.fileType.split("/")[1] || "file"}
                  </span>
                </div>

                {/* Card Title & Icon */}
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                    <IconComponent className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {it.title}
                    </h4>
                    <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                      {it.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="mt-3.5 flex items-center gap-2 pt-2.5 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setPreviewItem(it)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <Eye className="size-3.5" />
                  <span>View Preview</span>
                </button>

                <ResolvedFileLink
                  fileKey={it.fileKey}
                  fallbackUrl={it.url}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-border/80 bg-background/60 p-1.5 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  ariaLabel="Open file in new tab"
                >
                  <ExternalLink className="size-3.5" />
                </ResolvedFileLink>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instant File Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-4xl lg:max-w-5xl w-[92vw] p-0 overflow-hidden border-border/80 bg-background shadow-2xl rounded-2xl">
          {previewItem ? (
            <div>
              {/* Modal Header */}
              <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/80 bg-muted/40 px-6 py-4 space-y-0">
                <div className="flex items-center gap-3 min-w-0">
                  <DialogTitle className="text-sm font-bold text-foreground truncate">
                    {previewItem.title}
                  </DialogTitle>
                  <span className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                    {previewItem.subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-3 pr-6">
                  <ResolvedFileLink
                    fileKey={previewItem.fileKey}
                    fallbackUrl={previewItem.url}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </ResolvedFileLink>
                </div>
              </DialogHeader>

              {/* Modal Document Viewer */}
              <div className="p-2 bg-muted/20">
                <AssetPreview item={previewItem} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetPreview({ item }: { item: ProposalAttachmentItem }) {
  const { url, loading, error } = useResolvedFileUrl(item.fileKey, item.url);

  return (
    <div className="relative min-h-[520px] h-[68vh] max-h-[720px] w-full bg-muted/20 rounded-xl overflow-hidden">
      {loading ? (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Resolving secure file stream...</span>
          </div>
        </div>
      ) : error || !url ? (
        <div className="grid h-full place-items-center px-6 text-center text-xs text-muted-foreground">
          <div>
            <FileBox className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-2 font-medium text-foreground">File Preview Unavailable</p>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-sm">
              This asset cannot be previewed inline. Click "Open in New Tab" above to view.
            </p>
          </div>
        </div>
      ) : item.fileType.startsWith("image/") ? (
        <div className="flex h-full items-center justify-center p-4 overflow-auto">
          <img
            src={url}
            alt={item.title}
            className="max-h-full max-w-full rounded-lg object-contain shadow-xs border border-border/40"
          />
        </div>
      ) : item.fileType === "application/pdf" ? (
        <iframe
          src={url}
          title={item.title}
          className="h-full w-full border-none rounded-lg"
        />
      ) : (
        <div className="grid h-full place-items-center p-6 text-center text-xs text-muted-foreground">
          <div>
            <FileCheck className="mx-auto size-8 text-primary/60" />
            <p className="mt-2 font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Document package ready. Click "Open in New Tab" to open the file.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getItemCategoryBadge(it: ProposalAttachmentItem) {
  if (it.kind === "manuscript") {
    return {
      label: "Manuscript",
      cls: "border-primary/30 bg-primary/10 text-primary",
    };
  }
  if (it.materialKind === "character") {
    return {
      label: "Character Sheet",
      cls: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }
  if (it.materialKind === "storyboard") {
    return {
      label: "Storyboard",
      cls: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    };
  }
  if (it.materialKind === "world") {
    return {
      label: "World Setting",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }
  if (it.materialKind === "reference") {
    return {
      label: "Reference Art",
      cls: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    };
  }
  return {
    label: MATERIAL_KIND_LABEL[it.materialKind ?? "other"],
    cls: "border-border/60 bg-muted/50 text-muted-foreground",
  };
}

function getAttachmentIcon(item: ProposalAttachmentItem) {
  if (item.kind === "manuscript") return FileText;
  if (item.materialKind === "character") return ImageIcon;
  if (item.materialKind === "world") return Compass;
  if (item.materialKind === "storyboard") return Layers;
  return FileText;
}

function filterLabel(filter: "all" | "manuscript" | SupportingMaterialKind) {
  if (filter === "all") return "All";
  if (filter === "manuscript") return "Manuscript";
  return MATERIAL_KIND_LABEL[filter];
}


