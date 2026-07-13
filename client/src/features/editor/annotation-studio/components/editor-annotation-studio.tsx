import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { useEditorAnnotations } from "../../model/editor-annotations-store";
import { useChapterQuery, useSeriesDetailQuery } from "@/entities/series";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDate } from "@/shared/lib/format-date";
import { AnnotationToolbar, type AnnotationTool } from "./annotation-toolbar";
import { EditorPageCanvas } from "./editor-page-canvas";
import { CommentInspector } from "./comment-inspector";
import { ReviewStatusPill } from "@/entities/submission";

export function EditorAnnotationStudio() {
  const { chapterId } = useParams({ from: "/app/editor/chapters/$chapterId/annotate" });
  const user = useAuth((s) => s.user);
  const { data: chapter, isLoading } = useChapterQuery(chapterId);
  const { data: series } = useSeriesDetailQuery(chapter?.seriesId ?? "");
  const allAnnotations = useEditorAnnotations((s) => s.annotations);
  const addAnn = useEditorAnnotations((s) => s.addAnnotation);

  const [tool, setTool] = useState<AnnotationTool>("select");
  const [activePageId, setActivePageId] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const pages = useMemo(() => chapter?.pages ?? [], [chapter?.pages]);

  useEffect(() => {
    if (!activePageId && pages[0]?.id) setActivePageId(pages[0].id);
  }, [activePageId, pages]);

  const pageAnnotations = useMemo(
    () => allAnnotations.filter((a) => a.pageId === activePageId),
    [allAnnotations, activePageId],
  );
  const selected = useMemo(
    () => pageAnnotations.find((a) => a.id === selectedId),
    [pageAnnotations, selectedId],
  );

  if (isLoading) {
    return (
      <div className="p-10">
        <EmptyState title="Loading chapter" />
      </div>
    );
  }

  if (!chapter || !series) {
    return (
      <div className="p-10">
        <EmptyState title="Chapter not found" />
      </div>
    );
  }

  const blocking = allAnnotations.filter(
    (a) => a.chapterId === chapter.id && a.blocking && a.status !== "RESOLVED",
  ).length;

  const onCanvasClick = (x: number, y: number) => {
    if (!user) return;
    if (tool !== "pin" && tool !== "blocking" && tool !== "draw" && tool !== "text") return;
    const ann = addAnn({
      pageId: activePageId,
      chapterId: chapter.id,
      x,
      y,
      type: tool === "blocking" ? "blocking" : tool === "text" ? "note" : "panel",
      severity: tool === "blocking" ? "high" : "medium",
      blocking: tool === "blocking",
      text: "Add comment...",
      status: "OPEN",
      authorId: user.id,
      authorName: user.name,
    });
    setSelectedId(ann.id);
    setTool("select");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/app/editor/chapters/$chapterId/review"
          params={{ chapterId: chapter.id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Chapter review
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold">{series.title}</span>
          <span className="text-muted-foreground">Ch.{chapter.number}</span>
          <ReviewStatusPill status={chapter.status} />
          {blocking > 0 ? (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-900">
              {blocking} blocking
            </span>
          ) : null}
          <span className="text-muted-foreground">
            Deadline {chapter.reviewDueAt ? formatDate(chapter.reviewDueAt) : "—"}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[180px_1fr_320px]">
        <aside className="space-y-1 overflow-y-auto rounded-md border border-border bg-card p-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pages
          </p>
          {pages.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">No pages yet</p>
          ) : (
            pages.map((p) => {
              const cnt = allAnnotations.filter((a) => a.pageId === p.id).length;
              const blk = allAnnotations.filter((a) => a.pageId === p.id && a.blocking).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActivePageId(p.id);
                    setSelectedId(undefined);
                  }}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs ${
                    activePageId === p.id ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <span>P{String(p.index).padStart(2, "0")}</span>
                  <div className="flex gap-1">
                    {cnt > 0 ? <span className="text-[10px]">{cnt}</span> : null}
                    {blk > 0 ? (
                      <span className="rounded bg-rose-100 px-1 text-[10px] text-rose-900">
                        !{blk}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <main className="flex min-h-0 flex-col gap-2">
          <AnnotationToolbar active={tool} onChange={setTool} />
          <div className="min-h-0 flex-1 overflow-auto">
            <EditorPageCanvas
              annotations={pageAnnotations}
              selectedId={selectedId}
              onCanvasClick={onCanvasClick}
              onSelect={setSelectedId}
            />
          </div>
        </main>

        <aside className="overflow-y-auto">
          <CommentInspector annotation={selected} />
        </aside>
      </div>
    </div>
  );
}
