import { useCallback, useEffect, useRef } from "react";
import { useStudioStore } from "./useStudioStore";

const MIN_SCALE = 0.02;
const MAX_SCALE = 64;
const SCALE_FACTOR = 1.085;

/**
 * Viewport hook — wraps all pan/zoom interaction logic.
 * Uses Zustand store for state; returns helpers for components to call.
 */
export function useCanvasViewport(imgW: number, imgH: number) {
  const {
    viewport,
    setViewport,
    activeTool,
    isPanning,
    setIsPanning,
    isSpaceDown,
    setIsSpaceDown,
    containerSize,
  } = useStudioStore();

  const panRef = useRef<{ x: number; y: number } | null>(null);

  // ── coordinate helpers ──────────────────────────────────────────────
  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - viewport.x) / viewport.scale,
      y: (sy - viewport.y) / viewport.scale,
    }),
    [viewport],
  );

  const worldToScreen = useCallback(
    (wx: number, wy: number) => ({
      x: wx * viewport.scale + viewport.x,
      y: wy * viewport.scale + viewport.y,
    }),
    [viewport],
  );

  // ── zoom at pointer ─────────────────────────────────────────────────
  const zoomAtPoint = useCallback(
    (screenX: number, screenY: number, newScale: number) => {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      setViewport((prev) => {
        const worldX = (screenX - prev.x) / prev.scale;
        const worldY = (screenY - prev.y) / prev.scale;
        return {
          x: screenX - worldX * clamped,
          y: screenY - worldY * clamped,
          scale: clamped,
        };
      });
    },
    [setViewport],
  );

  // ── fit to screen ───────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    const { w, h } = containerSize;
    if (!w || !h || !imgW || !imgH) return;
    const PAD = 48;
    const scale = Math.min((w - PAD * 2) / imgW, (h - PAD * 2) / imgH);
    setViewport({
      x: (w - imgW * scale) / 2,
      y: (h - imgH * scale) / 2,
      scale,
    });
  }, [containerSize, imgW, imgH, setViewport]);

  const zoomIn = useCallback(() => {
    const { w, h } = containerSize;
    zoomAtPoint(w / 2, h / 2, viewport.scale * SCALE_FACTOR ** 3);
  }, [containerSize, viewport.scale, zoomAtPoint]);

  const zoomOut = useCallback(() => {
    const { w, h } = containerSize;
    zoomAtPoint(w / 2, h / 2, viewport.scale / SCALE_FACTOR ** 3);
  }, [containerSize, viewport.scale, zoomAtPoint]);

  const resetZoom = useCallback(() => {
    const { w, h } = containerSize;
    setViewport({ x: w / 2 - imgW / 2, y: h / 2 - imgH / 2, scale: 1 });
  }, [containerSize, imgW, imgH, setViewport]);

  // ── wheel handler (to attach via addEventListener for passive:false) ─
  const makeWheelHandler = useCallback(
    (containerEl: HTMLElement) => {
      const handler = (e: WheelEvent) => {
        e.preventDefault();
        const rect = containerEl.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR;
        setViewport((prev) => {
          const newScale = Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, prev.scale * factor),
          );
          const worldX = (sx - prev.x) / prev.scale;
          const worldY = (sy - prev.y) / prev.scale;
          return {
            x: sx - worldX * newScale,
            y: sy - worldY * newScale,
            scale: newScale,
          };
        });
      };
      containerEl.addEventListener("wheel", handler, { passive: false });
      return () => containerEl.removeEventListener("wheel", handler);
    },
    [setViewport],
  );

  // ── mouse handlers (React synthetic) ───────────────────────────────
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isMiddle = e.button === 1;
      const isSpacePan = isSpaceDown && e.button === 0;
      if (isMiddle || isSpacePan || activeTool === "pan") {
        e.preventDefault();
        setIsPanning(true);
        panRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isSpaceDown, activeTool, setIsPanning],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !panRef.current) return;
      const dx = e.clientX - panRef.current.x;
      const dy = e.clientY - panRef.current.y;
      panRef.current = { x: e.clientX, y: e.clientY };
      setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    },
    [isPanning, setViewport],
  );

  const onMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panRef.current = null;
    }
  }, [isPanning, setIsPanning]);

  // ── keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) setIsSpaceDown(true);
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        fitToScreen();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [fitToScreen, zoomIn, zoomOut, setIsSpaceDown]);

  return {
    viewport,
    screenToWorld,
    worldToScreen,
    zoomAtPoint,
    fitToScreen,
    zoomIn,
    zoomOut,
    resetZoom,
    makeWheelHandler,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
}
