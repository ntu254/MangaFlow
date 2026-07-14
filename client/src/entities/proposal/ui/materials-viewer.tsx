import { useMemo, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import type {
  ManuscriptVersion,
  SeriesProposal,
  SupportingMaterial,
  SupportingMaterialKind,
} from "@/entities/proposal/model/proposal-types";
import { MATERIAL_KIND_LABEL } from "@/entities/proposal/model/proposal-types";

type ViewerItem =
  | {
      kind: "manuscript";
      id: string;
      title: string;
      subtitle: string;
      url: string;
      fileType: string;
    }
  | {
      kind: "material";
      id: string;
      title: string;
      subtitle: string;
      url: string;
      fileType: string;
      materialKind: SupportingMaterialKind;
    };

function toItems(p: SeriesProposal): ViewerItem[] {
  const m: ViewerItem[] = p.manuscripts
    .sort((a, b) => b.version - a.version)
    .map((mv) => ({
      kind: "manuscript",
      id: mv.id,
      title: `Manuscript v${mv.version}`,
      subtitle: `${mv.fileName} · ${mv.sizeKB} KB`,
      url: mv.fileUrl,
      fileType: mv.fileType,
    }));
  const mat: ViewerItem[] = p.materials.map((mt) => ({
    kind: "material",
    id: mt.id,
    title: mt.title,
    subtitle: `${MATERIAL_KIND_LABEL[mt.kind]} · ${mt.fileName} · ${mt.sizeKB} KB`,
    url: mt.fileUrl,
    fileType: mt.fileType,
    materialKind: mt.kind,
  }));
  return [...m, ...mat];
}

export function MaterialsViewer({ proposal }: { proposal: SeriesProposal }) {
  const items = useMemo(() => toItems(proposal), [proposal]);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "manuscript" | SupportingMaterialKind>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "manuscript") return items.filter((i) => i.kind === "manuscript");
    return items.filter((i) => i.kind === "material" && i.materialKind === filter);
  }, [items, filter]);

  const selected = items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  if (items.length === 0) {
    return (
      <div className="rounded border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
        No materials have been attached to this proposal.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {(["all", "manuscript", "character", "world", "reference", "other"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {f === "all" ? "All" : f === "manuscript" ? "Manuscript" : MATERIAL_KIND_LABEL[f]}
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
          <>
            <div className="overflow-hidden rounded border border-border bg-background">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="font-semibold">{selected.title}</span>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] hover:bg-muted"
                >
                  <ExternalLink className="size-3" /> Open file
                </a>
              </div>
              <div className="aspect-[4/3] w-full bg-muted/30">
                {selected.fileType.startsWith("image/") ? (
                  <img
                    src={selected.url}
                    alt={selected.title}
                    className="h-full w-full object-contain"
                  />
                ) : selected.fileType === "application/pdf" ? (
                  <iframe src={selected.url} title={selected.title} className="h-full w-full" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    Preview is unavailable - use "Open file" to view it in a new tab.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export type { ManuscriptVersion, SupportingMaterial };
