import { useMemo, useState } from "react";
import { useAuth } from "@/shared/auth";
import { useCommentsQuery, useMyChaptersQuery, useMySeriesQuery } from "@/entities/series";
import { chaptersForEditor, getPublicationReadiness } from "../../model/editor-access";
import { PageHeader } from "@/shared/ui";
import { PublicationTable } from "./publications/publication-table";

type Tab = "READY" | "SCHEDULED" | "PUBLISHED" | "OTHER";
const TABS: Array<{ key: Tab; label: string }> = [
  { key: "READY", label: "Ready" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "PUBLISHED", label: "Published" },
  { key: "OTHER", label: "Failed / Cancelled" },
];

export function EditorPublicationsPage() {
  const user = useAuth((s) => s.user);
  const { data: series = [] } = useMySeriesQuery();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: comments = [] } = useCommentsQuery({});
  const [tab, setTab] = useState<Tab>("READY");

  const mine = useMemo(
    () => (user ? chaptersForEditor(chapters, series, user.id) : []),
    [chapters, series, user],
  );

  const rows = useMemo(() => {
    if (tab === "READY")
      return mine.filter(
        (c) =>
          (c.status === "EDITOR_APPROVED" || c.status === "READY_FOR_PUBLICATION") &&
          getPublicationReadiness(c, comments).ready,
      );
    if (tab === "SCHEDULED") return mine.filter((c) => c.publication?.status === "SCHEDULED");
    if (tab === "PUBLISHED") return mine.filter((c) => c.status === "PUBLISHED");
    return [];
  }, [mine, tab, comments]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <PageHeader
        eyebrow="Editor"
        title="Publications"
        description="Quản lý chapter sẵn sàng xuất bản, lịch publish và trạng thái phát hành."
      />

      <div className="flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-t px-3 py-1.5 text-xs font-semibold ${
              tab === t.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PublicationTable
        rows={rows}
        series={series}
        emptyText={
          tab === "READY"
            ? "Chưa có chapter nào sẵn sàng xuất bản"
            : tab === "SCHEDULED"
              ? "Chưa có chapter nào được lên lịch"
              : tab === "PUBLISHED"
                ? "Chưa có chapter nào được publish"
                : "Không có chapter Failed / Cancelled"
        }
      />
    </div>
  );
}
