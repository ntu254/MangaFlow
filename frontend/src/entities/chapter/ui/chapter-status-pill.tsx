import { CHAPTER_STATUS_LABEL, type ChapterStatus } from "@/entities/series/model/series-types";

const TONES: Record<ChapterStatus, string> = {
  PLANNED: "bg-zinc-200 text-zinc-800 border-zinc-300",
  IN_PRODUCTION: "bg-blue-100 text-blue-800 border-blue-300",
  TANTOU_REVIEW: "bg-indigo-100 text-indigo-900 border-indigo-300",
  REVISION_REQUIRED: "bg-orange-100 text-orange-900 border-orange-300",
  READY_FOR_PUBLICATION: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PUBLISHED: "bg-foreground text-background border-foreground",
};

export function ChapterStatusPill({
  status,
  className,
}: {
  status: ChapterStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${TONES[status]} ${className ?? ""}`}
    >
      {CHAPTER_STATUS_LABEL[status]}
    </span>
  );
}
