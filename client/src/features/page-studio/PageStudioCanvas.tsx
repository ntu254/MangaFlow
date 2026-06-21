import { useRef, useEffect, useCallback, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Transformer } from "react-konva";
import type Konva from "konva";
import type { Region } from "@/entities";
import type { PageStudioCollaborator } from "@/shared/api/pages";
import { findStaff } from "@/entities";
import { useStudioStore } from "./useStudioStore";
import { useKonvaImage } from "./useKonvaImage";
import { useCanvasViewport } from "./useCanvasViewport";
import { ContextualTaskPopup } from "./ContextualTaskPopup";
import { useCreateRegion, useUpdateRegion } from "@/shared/queries/useRegions";

export const IMG_W = 800;
export const IMG_H = 1131;

const getRegionColor = (r: Region | { status: string; type: string }) => {
  if (r.status === "ai-suggested") return "#8b5cf6"; // Purple dashed
  if (r.status === "linked-to-task") return "#f97316"; // Orange assigned
  switch (r.type) {
    case "panel":
      return "#eab308"; // Amber/yellow
    case "bubble":
      return "#10b981"; // Emerald green
    case "sfx":
      return "#06b6d4"; // Cyan/blue
    default:
      return "#8b5cf6";
  }
};

interface Props {
  regions: Region[];
  pageId: string;
  seriesId?: string;
  chapterId?: string;
  assistants?: PageStudioCollaborator[];
  onSelectRegion: (id: string | null) => void;
  originalImageUrl?: string | null;
  workingImageUrl?: string | null;
  readOnly?: boolean;
}

export function PageStudioCanvas({
  regions,
  pageId,
  seriesId,
  chapterId,
  assistants = [],
  onSelectRegion,
  originalImageUrl,
  workingImageUrl,
  readOnly = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const {
    selectedRegionId,
    activeTool,
    setActiveTool,
    isPanning,
    isSpaceDown,
    setContainerSize,
    regionTasks,
    showRegions,
    compareOriginal,
  } = useStudioStore();

  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftRegion, setDraftRegion] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const { mutate: createRegion } = useCreateRegion(pageId);
  const { mutate: updateRegion } = useUpdateRegion(pageId);

  const {
    viewport,
    fitToScreen,
    makeWheelHandler,
    onMouseDown: viewportOnMouseDown,
    onMouseMove: viewportOnMouseMove,
    onMouseUp: viewportOnMouseUp,
  } = useCanvasViewport(IMG_W, IMG_H);

  const [image, imageStatus] = useKonvaImage(
    compareOriginal ? originalImageUrl || "" : workingImageUrl || "",
  );

  // ── measure container ───────────────────────────────────────────────
  const [size, setSize] = useState({ w: 900, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      setSize({ w, h });
      setContainerSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setContainerSize]);

  // ── wheel: passive:false needed to preventDefault ───────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return makeWheelHandler(el);
  }, [makeWheelHandler]);

  // ── fit on first image load ─────────────────────────────────────────
  const fittedRef = useRef(false);
  useEffect(() => {
    if (imageStatus === "loaded" && !fittedRef.current && size.w > 100) {
      fittedRef.current = true;
      fitToScreen();
    }
  }, [imageStatus, size, fitToScreen]);

  // ── Handlers for drawing ─────────────────────────────────────────────
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return transform.point(pos);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent | any) => {
    if (compareOriginal) {
      viewportOnMouseDown(e);
      return;
    }

    const isDrawingTool =
      activeTool === "rect" || activeTool === "bubble" || activeTool === "polygon";

    if (!readOnly && isDrawingTool && !isSpaceDown && !isPanning) {
      const pos = getRelativePointerPosition();
      if (pos) {
        setIsDrawing(true);
        setDraftRegion({ x: pos.x, y: pos.y, w: 0, h: 0 });
        // Deselect if drawing
        onSelectRegion(null);
        return;
      }
    }

    // Check if clicked on empty stage to deselect
    if (e.target === stageRef.current || e.target.name() === "working-image") {
      onSelectRegion(null);
    }

    viewportOnMouseDown(e);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent | any) => {
    if (!readOnly && isDrawing && draftRegion && !compareOriginal) {
      const pos = getRelativePointerPosition();
      if (pos) {
        setDraftRegion({
          x: draftRegion.x,
          y: draftRegion.y,
          w: pos.x - draftRegion.x,
          h: pos.y - draftRegion.y,
        });
      }
      return;
    }
    viewportOnMouseMove(e);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent | any) => {
    if (!readOnly && isDrawing && draftRegion && !compareOriginal) {
      setIsDrawing(false);
      // Normalize coordinates
      const rw = Math.abs(draftRegion.w);
      const rh = Math.abs(draftRegion.h);
      if (rw > 5 && rh > 5) {
        const rx = draftRegion.w < 0 ? draftRegion.x + draftRegion.w : draftRegion.x;
        const ry = draftRegion.h < 0 ? draftRegion.y + draftRegion.h : draftRegion.y;

        // Clamp and normalize coordinates
        const clamp = (val: number) => Math.max(0, Math.min(1, val));

        let nx = rx / IMG_W;
        let ny = ry / IMG_H;
        let nw = rw / IMG_W;
        let nh = rh / IMG_H;

        // Ensure x+w <= 1 and y+h <= 1
        nx = clamp(nx);
        ny = clamp(ny);
        nw = clamp(nw);
        nh = clamp(nh);

        if (nx + nw > 1) nw = 1 - nx;
        if (ny + nh > 1) nh = 1 - ny;

        const normalized = {
          x: nx,
          y: ny,
          w: nw,
          h: nh,
        };

        createRegion({
          type: activeTool === "rect" ? "panel" : activeTool,
          coords: normalized,
        });

        // Reset tool
        setActiveTool("select");
      }
      setDraftRegion(null);
      return;
    }
    viewportOnMouseUp();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, r: Region) => {
    if (compareOriginal || readOnly) return;
    const node = e.target;
    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    let newX = clamp(node.x() / IMG_W);
    let newY = clamp(node.y() / IMG_H);

    if (newX + r.coords.w > 1) newX = 1 - r.coords.w;
    if (newY + r.coords.h > 1) newY = 1 - r.coords.h;

    updateRegion({
      regionId: r.id,
      payload: {
        coords: { ...r.coords, x: newX, y: newY },
      },
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, r: Region) => {
    if (compareOriginal || readOnly) return;
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    const newX = clamp(node.x() / IMG_W);
    const newY = clamp(node.y() / IMG_H);
    let newW = clamp(Math.max(5, node.width() * scaleX) / IMG_W);
    let newH = clamp(Math.max(5, node.height() * scaleY) / IMG_H);

    if (newX + newW > 1) newW = 1 - newX;
    if (newY + newH > 1) newH = 1 - newY;

    updateRegion({
      regionId: r.id,
      payload: {
        coords: { x: newX, y: newY, w: newW, h: newH },
      },
    });
  };

  // ── cursor ──────────────────────────────────────────────────────────
  const cursor = isPanning
    ? "grabbing"
    : activeTool === "pan" || isSpaceDown
      ? "grab"
      : !readOnly &&
          !compareOriginal &&
          (activeTool === "rect" || activeTool === "bubble" || activeTool === "polygon")
        ? "crosshair"
        : "default";

  // ── Transformer attachment ──────────────────────────────────────────
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<{ [key: string]: Konva.Rect | null }>({});

  useEffect(() => {
    if (compareOriginal) {
      trRef.current?.nodes([]);
      return;
    }
    if (selectedRegionId && shapeRefs.current[selectedRegionId]) {
      trRef.current?.nodes([shapeRefs.current[selectedRegionId]!]);
      trRef.current?.getLayer()?.batchDraw();
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedRegionId, compareOriginal, regions]);

  // ── render ──────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background"
      style={{ cursor, userSelect: "none" }}
    >
      {/* Dotted background via CSS */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, var(--canvas-dots) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        listening={!isPanning}
        style={{ position: "absolute", top: 0, left: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* ── Working image layer ──────────────────── */}
        <Layer listening={false}>
          {image ? (
            <KonvaImage
              image={image}
              name="working-image"
              width={IMG_W}
              height={IMG_H}
              shadowColor="#000"
              shadowBlur={60}
              shadowOpacity={0.6}
              shadowOffsetY={4}
            />
          ) : (
            <>
              {/* Placeholder while image loads */}
              <Rect
                width={IMG_W}
                height={IMG_H}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: IMG_W, y: IMG_H }}
                fillLinearGradientColorStops={[0, "#1f1f2e", 1, "#2a1f3d"]}
                shadowColor="#000"
                shadowBlur={60}
                shadowOpacity={0.6}
              />
              <Text
                x={IMG_W / 2}
                y={IMG_H / 2}
                text={imageStatus === "loading" ? "Loading image…" : "Image failed to load"}
                fontSize={16}
                fill="#666"
                align="center"
                verticalAlign="middle"
                offsetX={120}
                offsetY={10}
              />
            </>
          )}
        </Layer>

        {/* ── Regions layer ────────────────────────── */}
        <Layer>
          {showRegions &&
            regions
              .filter((r) => r.status !== "rejected")
              .map((r) => {
                const rx = r.coords.x * IMG_W;
                const ry = r.coords.y * IMG_H;
                const rw = r.coords.w * IMG_W;
                const rh = r.coords.h * IMG_H;
                const color = getRegionColor(r);
                const isSelected = r.id === selectedRegionId;
                const sw = (isSelected ? 2.5 : 1.5) / viewport.scale;
                const dash =
                  r.status === "ai-suggested"
                    ? [10 / viewport.scale, 5 / viewport.scale]
                    : undefined;

                return (
                  <Group key={r.id}>
                    {/* Fill */}
                    <Rect
                      ref={(node) => {
                        shapeRefs.current[r.id] = node;
                      }}
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      fill={
                        isSelected
                          ? `${color}15`
                          : r.status === "ai-suggested"
                            ? `${color}08`
                            : `${color}0c`
                      }
                      stroke={color}
                      strokeWidth={sw}
                      dash={dash}
                      cornerRadius={3 / viewport.scale}
                      draggable={!readOnly && !compareOriginal && isSelected}
                      onDragEnd={(e) => handleDragEnd(e, r)}
                      onTransformEnd={(e) => handleTransformEnd(e, r)}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        onSelectRegion(r.id);
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        onSelectRegion(r.id);
                      }}
                      onMouseEnter={(e) => {
                        if (compareOriginal) return;
                        e.target.getStage()!.container().style.cursor = "pointer";
                        setHoveredRegionId(r.id);
                      }}
                      onMouseLeave={(e) => {
                        if (compareOriginal) return;
                        e.target.getStage()!.container().style.cursor = cursor;
                        setHoveredRegionId(null);
                      }}
                    />
                    {/* Type label */}
                    <Text
                      x={rx + 5 / viewport.scale}
                      y={ry + 5 / viewport.scale}
                      text={r.type.toUpperCase()}
                      fontSize={9 / viewport.scale}
                      fontStyle="bold"
                      fill={color}
                      listening={false}
                    />
                    {/* AI badge */}
                    {r.status === "ai-suggested" && (
                      <Text
                        x={rx + rw - 22 / viewport.scale}
                        y={ry + 5 / viewport.scale}
                        text="AI"
                        fontSize={8 / viewport.scale}
                        fontStyle="bold"
                        fill={color}
                        listening={false}
                      />
                    )}
                  </Group>
                );
              })}

          {/* Transformer */}
          {!readOnly && !compareOriginal && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              ignoreStroke={true}
              anchorSize={8 / viewport.scale}
              borderDash={[4 / viewport.scale, 4 / viewport.scale]}
              borderStrokeWidth={1.5 / viewport.scale}
              keepRatio={false}
            />
          )}

          {/* Draft Region being drawn */}
          {!readOnly && isDrawing && draftRegion && !compareOriginal && (
            <Rect
              x={draftRegion.w < 0 ? draftRegion.x + draftRegion.w : draftRegion.x}
              y={draftRegion.h < 0 ? draftRegion.y + draftRegion.h : draftRegion.y}
              width={Math.abs(draftRegion.w)}
              height={Math.abs(draftRegion.h)}
              fill="rgba(139, 92, 246, 0.1)"
              stroke="#8b5cf6"
              strokeWidth={1.5 / viewport.scale}
              dash={[5 / viewport.scale, 5 / viewport.scale]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Contextual Task Popup */}
      {selectedRegion &&
        selectedRegion.status !== "rejected" &&
        selectedRegion.status !== "ai-suggested" &&
        !readOnly &&
        !compareOriginal && (
          <ContextualTaskPopup
            region={selectedRegion}
            seriesId={seriesId}
            chapterId={chapterId}
            pageId={pageId}
            assistants={assistants}
            onRegionTypeChange={(type) =>
              updateRegion({ regionId: selectedRegion.id, payload: { type } })
            }
            onClose={() => onSelectRegion(null)}
          />
      )}

      {/* Hover tooltip for tasks */}
      {(() => {
        if (compareOriginal) return null;
        const hoveredRegion = regions.find((r) => r.id === hoveredRegionId);
        if (!hoveredRegion || hoveredRegion.id === selectedRegionId) return null;
        const task = regionTasks[hoveredRegion.id];
        if (!task) return null;
        const staffName = findStaff(task.assigneeId)?.name || "Unassigned";

        const rx = hoveredRegion.coords.x * IMG_W;
        const ry = hoveredRegion.coords.y * IMG_H;
        const rw = hoveredRegion.coords.w * IMG_W;

        const tx = rx * viewport.scale + viewport.x + (rw * viewport.scale) / 2;
        const ty = ry * viewport.scale + viewport.y - 32;

        return (
          <div
            className="absolute z-50 bg-zinc-950/90 border border-zinc-700/50 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-xl -translate-x-1/2 pointer-events-none select-none flex flex-col gap-0.5"
            style={{ left: `${tx}px`, top: `${ty}px` }}
          >
            <div className="text-zinc-400 font-medium">Task: {task.taskType}</div>
            <div>Assignee: {staffName}</div>
          </div>
        );
      })()}

      {compareOriginal && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-500 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] shadow-lg pointer-events-none">
          Read-Only Mode
        </div>
      )}
    </div>
  );
}
