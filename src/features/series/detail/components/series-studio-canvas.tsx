import type { ReactNode } from "react";
import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";
import { useChaptersForSeriesQuery, useSeriesDetailQuery } from "@/entities/series";
import { StudioTab } from "./studio-tab";

type Props = {
  seriesId: string;
  initialChapterId?: string;
  initialPageId?: string;
  initialTaskId?: string;
  initialRegionId?: string;
  backLink?: ReactNode;
};

/**
 * Role-agnostic entry to the shared Studio canvas. Per-role restrictions (read-only, tools,
 * visible layers, no-access) are enforced inside StudioTab via getStudioPermissions.
 */
export function SeriesStudioCanvas({
  seriesId,
  initialChapterId,
  initialPageId,
  initialTaskId,
  initialRegionId,
  backLink,
}: Props) {
  const user = useAuth((s) => s.user);
  const { data: series, isLoading: seriesLoading } = useSeriesDetailQuery(seriesId);
  const seriesIds = useMemo(() => (seriesId ? [seriesId] : []), [seriesId]);
  const { data: chapters = [], isLoading: chaptersLoading } = useChaptersForSeriesQuery(seriesIds);

  if (!user) return null;

  if (seriesLoading || chaptersLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-md border border-border bg-card/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <RefreshCw className="size-3.5 animate-spin" />
          Đang tải Studio canvas...
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <EmptyState
        title="Không tìm thấy series"
        description="Series không tồn tại hoặc bạn không có quyền truy cập."
        action={backLink}
      />
    );
  }

  return (
    <StudioTab
      series={series}
      chapters={chapters}
      user={user}
      initialChapterId={initialChapterId}
      initialPageId={initialPageId}
      initialTaskId={initialTaskId}
      initialRegionId={initialRegionId}
    />
  );
}
