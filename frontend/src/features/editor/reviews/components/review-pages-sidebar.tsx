import { SlidersHorizontal } from "lucide-react";
import type { ChapterPage } from "@/entities/series/model/series-types";
import type { StudioComment } from "@/entities/series/model/studio-types";
import { ResolvedImage } from "@/shared/ui";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { pageBadge, statsForComments, TONE_PILL } from "./review-helpers";

export function ReviewPagesSidebar({
  pages,
  commentsByPage,
  selectedPageId,
  onSelectPage,
}: {
  pages: ChapterPage[];
  commentsByPage: Map<string, StudioComment[]>;
  selectedPageId: string;
  onSelectPage: (pageId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="font-serif text-[15px] text-[var(--admin-ink)]">Pages</p>
        <SlidersHorizontal className="size-4 text-[var(--admin-faint)]" />
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {pages.map((page) => {
          const badge = pageBadge(statsForComments(commentsByPage.get(page.id) ?? []));
          const selected = page.id === selectedPageId;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={`flex w-full items-center gap-2.5 rounded-[6px] border p-2 text-left transition-colors ${
                selected
                  ? "border-[var(--admin-ink)] bg-[var(--admin-selection)]"
                  : "border-transparent hover:bg-[var(--admin-hover)]"
              }`}
            >
              <div className="h-12 w-10 shrink-0 overflow-hidden rounded border border-[var(--admin-border)] bg-[var(--admin-page)]">
                <ResolvedImage
                  fileKey={page.fileKey}
                  fallbackUrl={page.fileUrl ?? page.imageUrl}
                  alt={`Page ${chapterPageLabel(page)}`}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full items-center justify-center text-[9px] text-[var(--admin-faint)]">
                      P{chapterPageLabel(page)}
                    </div>
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[var(--admin-ink)]">
                  P{chapterPageLabel(page)}
                </p>
                <span
                  className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${TONE_PILL[badge.tone]}`}
                >
                  {badge.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border px-3 py-2 text-[11px] text-[var(--admin-faint)]">
        {pages.length} pages total
      </div>
    </div>
  );
}
