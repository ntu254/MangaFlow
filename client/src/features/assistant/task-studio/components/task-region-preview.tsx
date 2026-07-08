import type { ChapterPage } from "@/entities/series/model/series-types";
import type { StudioComment, StudioRegion } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import { ResolvedImage } from "@/shared/ui";

// Canonical page space matches studio store seed: 1000 x 1400
const CANON_W = 1000;
const CANON_H = 1400;

export function TaskRegionPreview({
  page,
  region,
  comments,
  coverFallback,
}: {
  page?: ChapterPage;
  region?: StudioRegion;
  comments: StudioComment[];
  coverFallback?: string;
}) {
  if (!page) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        Không có page để hiển thị.
      </div>
    );
  }
  return (
    <div className="relative grid h-full place-items-center overflow-hidden rounded-md border border-border bg-muted/30 p-4">
      <div
        className="relative shadow-lg ring-1 ring-border"
        style={{ aspectRatio: `${CANON_W} / ${CANON_H}`, width: "min(100%, 540px)" }}
      >
        {page.fileKey || page.fileUrl || coverFallback ? (
          <ResolvedImage
            fileKey={page.fileKey}
            fallbackUrl={page.fileUrl || page.imageUrl || coverFallback}
            alt=""
            className="absolute inset-0 h-full w-full rounded bg-background object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center rounded bg-background text-xs text-muted-foreground">
            Page {String(page.index).padStart(2, "0")}
          </div>
        )}
        {region ? (
          <div
            className="absolute rounded border-2 border-amber-500 bg-amber-400/15"
            style={{
              left: `${(region.x / CANON_W) * 100}%`,
              top: `${(region.y / CANON_H) * 100}%`,
              width: `${(region.width / CANON_W) * 100}%`,
              height: `${(region.height / CANON_H) * 100}%`,
            }}
          >
            <span className="absolute -top-5 left-0 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {region.label ?? REGION_TYPE_LABEL[region.type]}
            </span>
          </div>
        ) : null}
        {comments
          .filter((c) => typeof c.x === "number" && typeof c.y === "number")
          .map((c) => (
            <span
              key={c.id}
              className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background"
              style={{
                left: `${((c.x ?? 0) / CANON_W) * 100}%`,
                top: `${((c.y ?? 0) / CANON_H) * 100}%`,
              }}
              title={c.text}
            >
              !
            </span>
          ))}
      </div>
    </div>
  );
}
