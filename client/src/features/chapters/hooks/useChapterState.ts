import { useMemo, useState } from "react";
import type { Chapter } from "@/entities";
import { tasks as allTasks, submissions as allSubs, pagesByChapter } from "@/entities";

export type ChapterTab =
  | "Pages"
  | "Tasks"
  | "Reviews"
  | "Readiness"
  | "Comments"
  | "Activity";

export const CHAPTER_TABS: ChapterTab[] = [
  "Pages",
  "Tasks",
  "Reviews",
  "Readiness",
  "Comments",
  "Activity",
];

export function useChapterState(chapter: Chapter) {
  const pages = useMemo(() => pagesByChapter(chapter.id), [chapter.id]);
  const chTasks = useMemo(
    () => allTasks.filter((t) => t.chapterId === chapter.id),
    [chapter.id],
  );
  const chSubs = useMemo(
    () => allSubs.filter((s) => chTasks.some((t) => t.id === s.taskId)),
    [chTasks],
  );

  const [tab, setTab] = useState<ChapterTab>("Pages");
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(pages[0]?.id);

  return { pages, chTasks, chSubs, tab, setTab, selectedPageId, setSelectedPageId };
}
