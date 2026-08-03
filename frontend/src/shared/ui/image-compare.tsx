import { useCallback, useRef, useState } from "react";
import { ResolvedImage } from "./resolved-image";

type ImageSource = {
  fileKey?: string | null;
  url?: string | null;
};

export interface ImageCompareProps {
  beforeFileKey?: string | null;
  beforeUrl?: string | null;
  afterFileKey?: string | null;
  afterUrl?: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

function hasSource(source: ImageSource) {
  return Boolean(source.fileKey || source.url);
}

function clampPosition(value: number) {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

/**
 * Before/after image comparison with a draggable divider. "Before" is the base
 * layer; "after" is clipped horizontally by the divider position. Each layer
 * resolves its own presigned/public display URL via {@link ResolvedImage}, so
 * callers only pass fileKey + fallback url pairs.
 *
 * Degrades gracefully: with a single available image it renders just that
 * image; with none it renders nothing.
 */
export function ImageCompare({
  beforeFileKey,
  beforeUrl,
  afterFileKey,
  afterUrl,
  beforeLabel = "Original",
  afterLabel = "Edited",
  className,
}: ImageCompareProps) {
  const before: ImageSource = { fileKey: beforeFileKey, url: beforeUrl };
  const after: ImageSource = { fileKey: afterFileKey, url: afterUrl };
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0) return;
    setPosition(clampPosition(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    },
    [updateFromClientX],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.buttons !== 1) return;
      updateFromClientX(event.clientX);
    },
    [updateFromClientX],
  );

  const hasBefore = hasSource(before);
  const hasAfter = hasSource(after);

  if (!hasBefore && !hasAfter) return null;

  const imgClass = "block h-full w-full select-none object-contain";
  const labelClass =
    "pointer-events-none absolute top-2 rounded-[4px] bg-black/65 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white";

  // Single-image fallback: nothing meaningful to compare against.
  if (!hasBefore || !hasAfter) {
    const only = hasBefore ? before : after;
    const onlyLabel = hasBefore ? beforeLabel : afterLabel;
    return (
      <div
        className={`relative overflow-hidden rounded-[6px] border border-border bg-muted/30 ${className ?? ""}`}
      >
        <ResolvedImage
          fileKey={only.fileKey}
          fallbackUrl={only.url}
          alt={onlyLabel}
          className={imgClass}
        />
        <span className={`${labelClass} left-2`}>{onlyLabel}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative max-h-[640px] cursor-ew-resize touch-none select-none overflow-hidden rounded-[6px] border border-border bg-muted/30"
      >
        {/* Base layer: before */}
        <ResolvedImage
          fileKey={before.fileKey}
          fallbackUrl={before.url}
          alt={beforeLabel}
          className={imgClass}
          draggable={false}
        />

        {/* Overlay layer: after, revealed on the RIGHT side of the divider
            (before stays on the left as the base layer) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <ResolvedImage
            fileKey={after.fileKey}
            fallbackUrl={after.url}
            alt={afterLabel}
            className={imgClass}
            draggable={false}
          />
        </div>

        {/* Divider handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
          style={{ left: `${position}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-[10px] font-semibold text-foreground shadow">
            ⇄
          </span>
        </div>

        <span className={`${labelClass} left-2`}>{beforeLabel}</span>
        <span className={`${labelClass} right-2`}>{afterLabel}</span>

        {/* Accessible keyboard control */}
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(clampPosition(Number(event.target.value)))}
          aria-label={`Compare ${beforeLabel} and ${afterLabel}`}
          className="absolute inset-x-0 bottom-0 z-20 w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
