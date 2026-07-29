import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Stage, Layer, Rect, Image as KImage, Text, Group, Circle, Transformer } from "react-konva";
import { Crosshair, X } from "lucide-react";
import type Konva from "konva";
import type { ChapterPage } from "@/entities/series/model/series-types";
import type {
  StudioComment,
  StudioRegion,
  StudioSelection,
  StudioTool,
} from "@/entities/series/model/studio-types";
import { REGION_STATUS_COLOR, REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import { filesApi } from "@/shared/api/services";
import { chapterPageLabel, isRenderableFileUrl } from "@/entities/chapter/model/chapter-pages";

type RectShape = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageTransform = {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  panX: number;
  panY: number;
};

function naturalToViewportRect(rect: RectShape, transform: ImageTransform): RectShape {
  return {
    x: transform.panX + transform.offsetX + rect.x * transform.scale,
    y: transform.panY + transform.offsetY + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
}

function viewportToNaturalPoint(
  point: { x: number; y: number },
  transform: ImageTransform,
): { x: number; y: number } {
  return {
    x: (point.x - transform.panX - transform.offsetX) / transform.scale,
    y: (point.y - transform.panY - transform.offsetY) / transform.scale,
  };
}

function viewportToNaturalRect(rect: RectShape, transform: ImageTransform): RectShape {
  const start = viewportToNaturalPoint({ x: rect.x, y: rect.y }, transform);
  const end = viewportToNaturalPoint(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    transform,
  );
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function clampRectToImage(rect: RectShape, naturalWidth: number, naturalHeight: number): RectShape {
  const minX = Math.max(0, Math.min(rect.x, naturalWidth));
  const minY = Math.max(0, Math.min(rect.y, naturalHeight));
  const maxX = Math.max(0, Math.min(rect.x + rect.width, naturalWidth));
  const maxY = Math.max(0, Math.min(rect.y + rect.height, naturalHeight));
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

function useImage(url: string | undefined) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url || !isRenderableFileUrl(url)) {
      setImg(null);
      return;
    }
    const i = new window.Image();
    const isExternalHttp = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
    if (!isExternalHttp) {
      i.crossOrigin = "anonymous";
    }
    i.src = url;
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
    return () => {
      i.onload = null;
      i.onerror = null;
    };
  }, [url]);
  return img;
}

function usePageImageUrl(page: ChapterPage | undefined) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function resolveUrl() {
      if (!page) {
        setUrl(undefined);
        return;
      }

      // Prefer the AI-whitened render so the cleaned page (text removed) shows
      // as the canvas base; regions/comments still render on top of it.
      const whitened = page.metadata?.aiWhitened;
      if (whitened?.fileKey) {
        try {
          const fresh = await filesApi.presignDownload(whitened.fileKey);
          if (!cancelled) setUrl(fresh.publicUrl ?? fresh.downloadUrl);
          return;
        } catch {
          // Fall through to the whitened stored url / original image.
        }
      }
      if (isRenderableFileUrl(whitened?.fileUrl)) {
        setUrl(whitened?.fileUrl);
        return;
      }

      if (page.fileKey) {
        try {
          const fresh = await filesApi.presignDownload(page.fileKey);
          if (!cancelled) setUrl(fresh.publicUrl ?? fresh.downloadUrl);
          return;
        } catch {
          // Fall through to the stored URL.
        }
      }

      setUrl(isRenderableFileUrl(page.fileUrl) ? page.fileUrl : undefined);
    }

    resolveUrl();
    const refreshKey = page?.metadata?.aiWhitened?.fileKey ?? page?.fileKey;
    const timer = refreshKey ? window.setInterval(resolveUrl, 13 * 60 * 1000) : undefined;
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [page]);

  return url;
}

type Props = {
  page: ChapterPage | undefined;
  regions: StudioRegion[];
  comments: StudioComment[];
  tool: StudioTool;
  selection: StudioSelection;
  onSelect: (sel: StudioSelection) => void;
  onDrawRegion: (rect: RectShape & { imageWidth: number; imageHeight: number }) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  containerWidth: number;
  containerHeight: number;
  panTarget?: { x: number; y: number; nonce: number } | null;
  onJumpTo?: (x: number, y: number, commentId: string) => void;
  highlightCommentId?: string | null;
  canEditRegions?: boolean;
};

export default function KonvaPageCanvas({
  page,
  regions,
  comments,
  tool,
  selection,
  onSelect,
  onDrawRegion,
  zoom,
  onZoomChange,
  containerWidth,
  containerHeight,
  panTarget,
  onJumpTo,
  highlightCommentId,
  canEditRegions = false,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [draft, setDraft] = useState<RectShape | null>(null);
  const pageImageUrl = usePageImageUrl(page);
  const img = useImage(pageImageUrl);

  const visibleRegions = useMemo(
    () => regions.filter((r) => r.pageId === page?.id && r.status !== "DISCARDED" && !r.hidden),
    [regions, page?.id],
  );
  const visibleComments = useMemo(
    () => comments.filter((c) => c.pageId === page?.id && c.x != null && c.y != null && !c.hidden),
    [comments, page?.id],
  );
  const highlightComment = useMemo(
    () => (highlightCommentId ? visibleComments.find((c) => c.id === highlightCommentId) : null),
    [highlightCommentId, visibleComments],
  );

  const naturalWidth =
    img?.naturalWidth || img?.width || Number(page?.metadata?.imageWidth) || 1000;
  const naturalHeight =
    img?.naturalHeight || img?.height || Number(page?.metadata?.imageHeight) || 1400;

  // Fit on first layout / page change
  const fitScale = useMemo(() => {
    const padding = 80;
    const sx = (containerWidth - padding) / naturalWidth;
    const sy = (containerHeight - padding) / naturalHeight;
    return Math.max(0.1, Math.min(sx, sy));
  }, [containerWidth, containerHeight, naturalHeight, naturalWidth]);

  useEffect(() => {
    // Center page in stage when zoom changes externally (fit)
    const stageScale = zoom * fitScale;
    const px = (containerWidth - naturalWidth * stageScale) / 2;
    const py = (containerHeight - naturalHeight * stageScale) / 2;
    setPos({ x: px, y: py });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, fitScale, page?.id, naturalHeight, naturalWidth]);

  const stageScale = zoom * fitScale;
  const imageTransform = useMemo<ImageTransform>(
    () => ({
      naturalWidth,
      naturalHeight,
      renderedWidth: naturalWidth * stageScale,
      renderedHeight: naturalHeight * stageScale,
      offsetX: 0,
      offsetY: 0,
      scale: stageScale,
      panX: pos.x,
      panY: pos.y,
    }),
    [naturalHeight, naturalWidth, pos.x, pos.y, stageScale],
  );

  // local open state for HTML comment pin popups
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  useEffect(() => {
    if (selection.kind === "comment") setOpenCommentId(selection.commentId);
  }, [selection]);
  useEffect(() => {
    setOpenCommentId(null);
  }, [page?.id]);
  const popupRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openCommentId) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t)) return;
      if (pinRef.current?.contains(t)) return;
      setOpenCommentId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openCommentId]);

  // Pan canvas to a target image-space coordinate when requested.
  useEffect(() => {
    if (!panTarget) return;
    const px = containerWidth / 2 - panTarget.x * stageScale;
    const py = containerHeight / 2 - panTarget.y * stageScale;
    setPos({ x: px, y: py });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panTarget?.nonce, stageScale, containerWidth, containerHeight]);

  // Attach transformer to selected region
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    if (canEditRegions && selection.kind === "region" && tool === "select") {
      const node = stageRef.current?.findOne<Konva.Node>(`#${selection.regionId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [canEditRegions, selection, tool, regions]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const delta = -e.evt.deltaY;
    const next = Math.min(4, Math.max(0.25, zoom * (delta > 0 ? 1.08 : 0.93)));
    onZoomChange(next);
  };

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool !== "draw-region" || !canEditRegions) return;
    const stage = stageRef.current;
    if (!stage) return;
    const ptr = stage.getPointerPosition();
    if (!ptr) return;
    const p = viewportToNaturalPoint(ptr, imageTransform);
    if (p.x < 0 || p.y < 0 || p.x > naturalWidth || p.y > naturalHeight) return;
    setDraft({ x: p.x, y: p.y, width: 0, height: 0 });
    // Block other interactions
    e.cancelBubble = true;
  };

  const onMouseMove = () => {
    if (!draft) return;
    const stage = stageRef.current;
    const ptr = stage?.getPointerPosition();
    if (!ptr) return;
    const start = naturalToViewportRect(
      { x: draft.x, y: draft.y, width: 0, height: 0 },
      imageTransform,
    );
    const naturalRect = viewportToNaturalRect(
      { x: start.x, y: start.y, width: ptr.x - start.x, height: ptr.y - start.y },
      imageTransform,
    );
    setDraft({
      x: draft.x,
      y: draft.y,
      width: naturalRect.width * (naturalRect.x < draft.x ? -1 : 1),
      height: naturalRect.height * (naturalRect.y < draft.y ? -1 : 1),
    });
  };

  const onMouseUp = () => {
    if (!draft) return;
    const x = Math.min(draft.x, draft.x + draft.width);
    const y = Math.min(draft.y, draft.y + draft.height);
    const w = Math.abs(draft.width);
    const h = Math.abs(draft.height);
    const rect = clampRectToImage({ x, y, width: w, height: h }, naturalWidth, naturalHeight);
    setDraft(null);
    if (rect.width > 2 && rect.height > 2) {
      onDrawRegion({ ...rect, imageWidth: naturalWidth, imageHeight: naturalHeight });
    }
  };

  const draggable = tool === "pan";

  // Dotted grid background pattern (drawn outside the page sheet, behind everything)
  const gridLines: ReactElement[] = useMemo(() => {
    const lines: ReactElement[] = [];
    const step = 32;
    const cols = Math.ceil(containerWidth / step) + 2;
    const rows = Math.ceil(containerHeight / step) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        lines.push(
          <Circle
            key={`g-${r}-${c}`}
            x={c * step}
            y={r * step}
            radius={0.9}
            fill="rgba(24,24,40,0.18)"
            listening={false}
          />,
        );
      }
    }
    return lines;
  }, [containerWidth, containerHeight]);

  return (
    <>
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={(e) => {
          // click on empty stage clears selection
          if (e.target === e.target.getStage()) onSelect({ kind: "none" });
        }}
        style={{
          cursor: tool === "pan" ? "grab" : tool === "draw-region" ? "crosshair" : "default",
        }}
      >
        {/* Background grid */}
        <Layer listening={false}>
          <Rect x={0} y={0} width={containerWidth} height={containerHeight} fill="#f5efe2" />
          {gridLines}
        </Layer>

        {/* Page sheet + image */}
        <Layer
          x={pos.x}
          y={pos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={draggable}
          onDragMove={(e) => setPos({ x: e.target.x(), y: e.target.y() })}
          onDragEnd={(e) => setPos({ x: e.target.x(), y: e.target.y() })}
        >
          <Rect
            x={0}
            y={0}
            width={naturalWidth}
            height={naturalHeight}
            fill="#ffffff"
            shadowColor="rgba(0,0,0,0.18)"
            shadowBlur={24}
            shadowOffset={{ x: 0, y: 8 }}
            cornerRadius={4}
            onClick={() => page && onSelect({ kind: "page", pageId: page.id })}
          />
          {img ? (
            <KImage
              image={img}
              x={0}
              y={0}
              width={naturalWidth}
              height={naturalHeight}
              listening={false}
            />
          ) : (
            <>
              <Text
                text={page ? `Page ${String(page.index).padStart(2, "0")}` : "No page selected"}
                x={0}
                y={naturalHeight / 2 - 36}
                width={naturalWidth}
                align="center"
                fontSize={48}
                fontStyle="bold"
                fill="rgba(24,24,40,0.18)"
                listening={false}
              />
              <Text
                text={
                  page
                    ? "Source page unavailable. Ask the Mangaka to upload the page before work begins."
                    : ""
                }
                x={0}
                y={naturalHeight / 2 + 28}
                width={naturalWidth}
                align="center"
                fontSize={20}
                fill="rgba(24,24,40,0.4)"
                listening={false}
              />
            </>
          )}

          {/* Regions */}
          {visibleRegions.map((r) => {
            const selected = selection.kind === "region" && selection.regionId === r.id;
            const color = REGION_STATUS_COLOR[r.status];
            return (
              <Group key={r.id}>
                <Rect
                  id={r.id}
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  stroke={color}
                  strokeWidth={selected ? 4 : 2.5}
                  dash={r.status === "DETECTED" ? [10, 6] : []}
                  fill={`${color}22`}
                  cornerRadius={4}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect({ kind: "region", regionId: r.id });
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect({ kind: "region", regionId: r.id });
                  }}
                />
                {/* Label tag */}
                <Group x={r.x} y={r.y - 28} listening={false}>
                  <Rect width={170} height={24} fill={color} cornerRadius={3} />
                  <Text
                    text={`${r.label ?? "Region"} · ${REGION_TYPE_LABEL[r.type]}`}
                    fontSize={12}
                    fontStyle="bold"
                    fill="#ffffff"
                    padding={6}
                    width={170}
                  />
                </Group>
                {/* Task badge */}
                {r.taskId ? (
                  <Group x={r.x + r.width - 36} y={r.y + 8} listening={false}>
                    <Rect width={32} height={20} fill="#0f172a" cornerRadius={10} />
                    <Text
                      text="TSK"
                      fontSize={10}
                      fontStyle="bold"
                      fill="#fff"
                      width={32}
                      align="center"
                      y={5}
                    />
                  </Group>
                ) : null}
              </Group>
            );
          })}

          {/* Comment highlight pulse */}
          {highlightComment && highlightComment.x != null && highlightComment.y != null ? (
            <Group listening={false}>
              <Circle
                x={highlightComment.x}
                y={highlightComment.y}
                radius={90}
                stroke="#3b82f6"
                strokeWidth={4}
                opacity={0.85}
                dash={[12, 8]}
              />
              <Circle
                x={highlightComment.x}
                y={highlightComment.y}
                radius={130}
                stroke="#3b82f6"
                strokeWidth={2}
                opacity={0.45}
              />
            </Group>
          ) : null}

          {/* Draft rectangle */}
          {draft ? (
            <Rect
              x={Math.min(draft.x, draft.x + draft.width)}
              y={Math.min(draft.y, draft.y + draft.height)}
              width={Math.abs(draft.width)}
              height={Math.abs(draft.height)}
              stroke="#0f172a"
              dash={[8, 6]}
              fill="rgba(15,23,42,0.08)"
              listening={false}
            />
          ) : null}

          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorSize={10}
            borderStroke="#0f172a"
            anchorStroke="#0f172a"
            anchorFill="#ffffff"
            ignoreStroke
          />
        </Layer>
      </Stage>

      {/* HTML overlay for collapsible comment pins */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ width: containerWidth, height: containerHeight }}
      >
        {visibleComments.map((c) => {
          const commentRect = naturalToViewportRect(
            { x: c.x ?? 0, y: c.y ?? 0, width: 0, height: 0 },
            imageTransform,
          );
          const cx = commentRect.x;
          const cy = commentRect.y;
          const open = openCommentId === c.id;
          const sel = selection.kind === "comment" && selection.commentId === c.id;
          const isBlocking = c.isBlocking;
          const tone =
            c.status === "RESOLVED"
              ? "bg-emerald-500"
              : isBlocking
                ? "bg-rose-500"
                : "bg-amber-500";
          const initial = c.authorName.trim().charAt(0).toUpperCase() || "?";
          return (
            <div
              key={c.id}
              className="absolute"
              style={{ left: cx, top: cy, transform: "translate(-50%, -100%)" }}
              ref={open ? pinRef : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenCommentId((id) => (id === c.id ? null : c.id));
                  onSelect({ kind: "comment", commentId: c.id });
                }}
                className={`pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 transition ${tone} ${
                  sel || open ? "ring-foreground" : "ring-white"
                }`}
                title={`${c.authorName}: ${(c.body || (c.text ?? "")).slice(0, 60)}`}
              >
                {initial}
              </button>
              {open ? (
                <div
                  ref={popupRef}
                  className="pointer-events-auto absolute left-7 top-0 z-20 w-64 rounded-md border border-border bg-card p-2 text-foreground shadow-lg"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${tone}`}
                      >
                        {initial}
                      </span>
                      <span className="text-[11px] font-semibold">{c.authorName}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {onJumpTo ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.x != null && c.y != null) onJumpTo(c.x, c.y, c.id);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                          aria-label="Jump to comment"
                          title="Jump to"
                        >
                          <Crosshair className="h-3 w-3" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCommentId(null);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                        aria-label="Close comment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug text-foreground/90">{c.body || c.text}</p>
                  <div className="mt-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        c.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : isBlocking
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {isBlocking && c.status !== "RESOLVED" ? "Blocking" : c.status}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
