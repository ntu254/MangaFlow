import { CHAPTER_STATUS_LABEL, type ChapterStatus } from "@/entities/series/model/series-types";

const TONES: Record<ChapterStatus, string> = {
  IN_PRODUCTION: "bg-sky-100 text-sky-800 border-sky-300",
  PLANNED: "bg-zinc-200 text-zinc-800 border-zinc-300",
  DRAFTING: "bg-blue-100 text-blue-800 border-blue-300",
  REVISION: "bg-orange-100 text-orange-900 border-orange-300",
  SCHEDULED: "bg-indigo-100 text-indigo-900 border-indigo-300",
  PUBLISHED: "bg-foreground text-background border-foreground",
  ASSISTANT_WORKING: "bg-sky-100 text-sky-800 border-sky-300",
  MANGAKA_REVIEW: "bg-blue-100 text-blue-900 border-blue-300",
  EDITOR_REVIEW: "bg-indigo-100 text-indigo-900 border-indigo-300",
  EDITOR_APPROVED: "bg-emerald-200 text-emerald-900 border-emerald-400",
  READY_FOR_PUBLICATION: "bg-emerald-100 text-emerald-800 border-emerald-300",
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
