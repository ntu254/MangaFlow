import { useNavigate } from "@tanstack/react-router";
import { useChapterQuery } from "@/entities/series";
import type { StudioTool } from "@/entities/series/model/studio-types";
import { SeriesStudioCanvas } from "@/features/series/detail";
import { EmptyState } from "@/shared/ui/empty-state";

type Props = {
  chapterId: string;
  initialTool?: StudioTool;
};

/**
 * Focused entry point for an Editor's chapter review. The workspace stays the
 * shared Studio canvas; Studio permissions tailor it to review-only work.
 */
export function EditorChapterStudio({ chapterId, initialTool }: Props) {
  const navigate = useNavigate();
  const { data: chapter, isLoading } = useChapterQuery(chapterId);

  if (isLoading) {
    return (
      <div className="p-10">
        <EmptyState title="Opening shared Studio canvas…" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="p-10">
        <EmptyState title="Chapter review not found" />
      </div>
    );
  }

  return (
    <SeriesStudioCanvas
      seriesId={chapter.seriesId}
      initialChapterId={chapter.id}
      initialTool={initialTool}
      onBack={() => navigate({ to: "/app/editor/review" })}
    />
  );
}
