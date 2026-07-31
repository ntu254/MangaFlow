import { useEffect, useMemo, useState } from "react";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import type { User } from "@/shared/auth";
import type {
  ManuscriptVersion,
  SeriesProposal,
  SupportingMaterial,
  SupportingMaterialKind,
} from "@/entities/proposal/model/proposal-types";
import { MATERIAL_KIND_LABEL } from "@/entities/proposal/model/proposal-types";
import { useMaterialAnnotations } from "../model/material-annotations-store";
import { Textarea } from "@/components/ui/textarea";
import { ResolvedFileLink } from "@/shared/ui/resolved-file-link";
import { useResolvedFileUrl } from "@/shared/lib/use-resolved-file-url";

type ViewerItem =
  | {
      kind: "manuscript";
      id: string;
      title: string;
      subtitle: string;
      url: string;
      fileKey?: string;
      fileType: string;
    }
  | {
      kind: "material";
      id: string;
      title: string;
      subtitle: string;
      url: string;
      fileKey?: string;
      fileType: string;
      materialKind: SupportingMaterialKind;
    }
  | {
      kind: "sample";
      id: string;
      title: string;
      subtitle: string;
      url: string;
      fileKey?: string;
      fileType: string;
    };

function toItems(p: SeriesProposal): ViewerItem[] {
  const m: ViewerItem[] = [...p.manuscripts]
    .sort((a, b) => b.version - a.version)
    .map((mv) => ({
      kind: "manuscript",
      id: mv.id,
      title: `Manuscript v${mv.version}`,
      subtitle: `${mv.fileName} · ${mv.sizeKB} KB`,
      url: mv.fileUrl,
      fileKey: mv.fileKey,
      fileType: mv.fileType,
    }));
  const mat: ViewerItem[] = p.materials.map((mt) => ({
    kind: "material",
    id: mt.id,
    title: mt.title,
    subtitle: `${MATERIAL_KIND_LABEL[mt.kind]} · ${mt.fileName} · ${mt.sizeKB} KB`,
    url: mt.fileUrl,
    fileKey: mt.fileKey,
    fileType: mt.fileType,
    materialKind: mt.kind,
  }));
  const latestManuscript = [...p.manuscripts].sort((a, b) => b.version - a.version)[0];
  const sampleIsAlreadyListed = p.manuscripts.some((mv) => mv.fileUrl === p.sampleChapterUrl);
  const sample: ViewerItem[] =
    p.sampleChapterUrl && !sampleIsAlreadyListed
      ? [
          {
            kind: "sample",
            id: `sample-${p.id}`,
            title: "Sample pages",
            subtitle: "Submitted sample chapter",
            url: p.sampleChapterUrl,
            fileType: latestManuscript?.fileType ?? inferFileType(p.sampleChapterUrl),
          },
        ]
      : [];
  return [...m, ...sample, ...mat];
}

export function MaterialsViewer({
  proposal,
  user,
  annotationLabel = "Board annotations",
}: {
  proposal: SeriesProposal;
  user: User;
  annotationLabel?: string;
}) {
  const items = useMemo(() => toItems(proposal), [proposal]);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [filter, setFilter] = useState<
    "all" | "manuscript" | "sample" | SupportingMaterialKind
  >("all");
  const annotations = useMaterialAnnotations((s) => s.annotations);
  const addAnnotation = useMaterialAnnotations((s) => s.add);
  const removeAnnotation = useMaterialAnnotations((s) => s.remove);
  const markViewed = useMaterialAnnotations((s) => s.markViewed);
  const [text, setText] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "manuscript") return items.filter((i) => i.kind === "manuscript");
    if (filter === "sample") return items.filter((i) => i.kind === "sample");
    return items.filter((i) => i.kind === "material" && i.materialKind === filter);
  }, [items, filter]);

  const selected = items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected) markViewed(user.id, proposal.id, selected.id);
  }, [selected, user.id, proposal.id, markViewed]);

  const itemAnnotations = annotations.filter(
    (a) => a.proposalId === proposal.id && selected && a.materialId === selected.id,
  );

  const submitAnnotation = () => {
    if (!selected || !text.trim()) return;
    addAnnotation({
      proposalId: proposal.id,
      materialId: selected.id,
      memberId: user.id,
      memberName: user.name,
      text: text.trim(),
    });
    setText("");
  };

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
          {(["all", "manuscript", "sample", "character", "world", "reference", "other"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
              >
                {filterLabel(f)}
              </button>
            ),
          )}
        </div>
        <ul className="space-y-1">
          {filtered.map((it) => {
            const active = selected?.id === it.id;
            const noteCount = annotations.filter(
              (a) => a.proposalId === proposal.id && a.materialId === it.id,
            ).length;
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
                  {noteCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">
                      {noteCount}
                    </span>
                  ) : null}
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

            <div className="rounded border border-border bg-card/40 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {annotationLabel} ({itemAnnotations.length})
              </p>
              {itemAnnotations.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No annotations for this material yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {itemAnnotations.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-2 rounded border border-border/60 bg-background p-2 text-xs"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{a.memberName}</p>
                        <p className="text-foreground/80">{a.text}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString("en-US")}
                        </p>
                      </div>
                      {a.memberId === user.id ? (
                        <button
                          onClick={() => removeAnnotation(a.id, user.id)}
                          className="rounded p-1 text-muted-foreground hover:text-rose-700"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {user.role === "board" || user.role === "admin" ? (
                <div className="mt-2 flex flex-col gap-2">
                  <Textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add an annotation for Board discussion..."
                  />
                  <button
                    onClick={submitAnnotation}
                    disabled={!text.trim()}
                    className="self-end rounded bg-foreground px-3 py-1 text-xs font-semibold text-background disabled:opacity-40"
                  >
                    Submit annotation
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function AssetPreview({ item }: { item: ViewerItem }) {
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

function filterLabel(
  filter: "all" | "manuscript" | "sample" | SupportingMaterialKind,
) {
  if (filter === "all") return "All";
  if (filter === "manuscript") return "Manuscript";
  if (filter === "sample") return "Sample pages";
  return MATERIAL_KIND_LABEL[filter];
}

function inferFileType(url: string) {
  const path = url.split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(?:png|jpe?g|webp|gif)$/.test(path)) return "image/*";
  if (path.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

export type { ManuscriptVersion, SupportingMaterial };
