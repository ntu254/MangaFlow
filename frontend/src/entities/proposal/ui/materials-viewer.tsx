import { useMemo, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "manuscript" | SupportingMaterialKind>("all");
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "manuscript") return items.filter((i) => i.kind === "manuscript");
    return items.filter((i) => i.kind === "material" && i.materialKind === filter);
  }, [items, filter]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  if (items.length === 0) {
    return (
      <div className="rounded border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
        No materials attached to this proposal.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {(
            [
              "all",
              ...(scope === "package" ? ["manuscript" as const] : []),
              "storyboard",
              "character",
              "world",
              "reference",
              "other",
            ] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>
        <ul className="space-y-1">
          {filtered.map((it) => {
            const active = selected?.id === it.id;
            return (
              <li key={it.id}>
                <button
                  onClick={() => setSelectedId(it.id)}
                  className={`flex w-full items-start gap-2 rounded border p-2 text-left text-xs ${active ? "border-foreground bg-foreground/5" : "border-border bg-card/40 hover:bg-muted"}`}
                >
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{it.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{it.subtitle}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="space-y-3">
        {selected ? (
          <div className="overflow-hidden rounded border border-border bg-background">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="font-semibold">{selected.title}</span>
              <ResolvedFileLink
                fileKey={selected.fileKey}
                fallbackUrl={selected.url}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Open file
              </ResolvedFileLink>
            </div>
            <AssetPreview item={selected} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AssetPreview({ item }: { item: ProposalAttachmentItem }) {
  const { url, loading } = useResolvedFileUrl(item.fileKey, item.url);
  return (
    <div className="aspect-[4/3] w-full bg-muted/30">
      {loading ? (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">
          Refreshing secure file link...
        </div>
      ) : !url ? (
        <div className="grid h-full place-items-center px-6 text-center text-xs text-muted-foreground">
          This file is unavailable. Ask the author to upload it again.
        </div>
      ) : item.fileType.startsWith("image/") ? (
        <img src={url} alt={item.title} className="h-full w-full object-contain" />
      ) : item.fileType === "application/pdf" ? (
        <iframe src={url} title={item.title} className="h-full w-full" />
      ) : (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">
          Preview not available — use the "Open file" button to view in a new tab.
        </div>
      )}
    </div>
  );
}

function filterLabel(filter: "all" | "manuscript" | SupportingMaterialKind) {
  if (filter === "all") return "All";
  if (filter === "manuscript") return "Manuscript";
  return MATERIAL_KIND_LABEL[filter];
}
