import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileWarning, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  DataPagination,
  FilterSelect,
  QueueActionButton,
  QueuePage,
  QueueTable,
  QueueTabs,
  SearchToolbar,
  StatCard,
  type QueueTab,
} from "@/shared/ui";
import { SelectItem } from "@/components/ui/select";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import type { ReviewItem } from "../../model/editor-access";
import {
  isItemCompleted,
  isItemOverdue,
  isNewReviewItem,
  reviewQueueColumns,
  reviewRowAccent,
} from "./review-queue-table";

type TabKey = "ALL" | "NEW" | "NEEDS" | "OVERDUE" | "COMPLETED";

const PAGE_SIZE = 8;

function matchesTab(item: ReviewItem, tab: TabKey): boolean {
  switch (tab) {
    case "ALL":
      return true;
    case "NEW":
      return isNewReviewItem(item);
    case "NEEDS":
      return !isItemCompleted(item);
    case "OVERDUE":
      return isItemOverdue(item);
    case "COMPLETED":
      return isItemCompleted(item);
  }
}

export function ReviewItemsPanel({
  eyebrow,
  title,
  description,
  items,
  isLoading = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: ReviewItem[];
  isLoading?: boolean;
}) {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [query, setQuery] = useState("");
  const [claimFilter, setClaimFilter] = useState("ALL");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      NEW: items.filter((i) => matchesTab(i, "NEW")).length,
      NEEDS: items.filter((i) => matchesTab(i, "NEEDS")).length,
      UNCLAIMED: items.filter((i) => !i.claimedByEditorId && !isItemCompleted(i)).length,
      MINE: items.filter((i) => i.claimedByEditorId === user?.id).length,
      OVERDUE: items.filter((i) => matchesTab(i, "OVERDUE")).length,
      COMPLETED: items.filter((i) => matchesTab(i, "COMPLETED")).length,
    }),
    [items, user?.id],
  );

  const tabbed = useMemo(() => items.filter((item) => matchesTab(item, tab)), [items, tab]);

  const filtered = useMemo(() => {
    let result = tabbed;

    if (claimFilter === "UNCLAIMED") {
      result = result.filter((item) => !item.claimedByEditorId);
    } else if (claimFilter === "MINE") {
      result = result.filter((item) => item.claimedByEditorId === user?.id);
    }

    if (audienceFilter !== "ALL") {
      result = result.filter(
        (item) => item.targetAudience?.toLowerCase() === audienceFilter.toLowerCase(),
      );
    }

    const needle = query.trim().toLowerCase();
    if (!needle) return result;
    return result.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        (item.seriesTitle ?? "").toLowerCase().includes(needle) ||
        (item.submittedBy ?? "").toLowerCase().includes(needle) ||
        (item.logline ?? "").toLowerCase().includes(needle) ||
        item.status.toLowerCase().includes(needle),
    );
  }, [tabbed, claimFilter, audienceFilter, query, user?.id]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      item: (item) => item.proposalTitle ?? item.seriesTitle ?? item.title,
      author: (item) => item.submittedBy,
      audience: (item) => item.targetAudience ?? "",
      genres: (item) => item.genres?.join(", ") ?? "",
      assignment: (item) => item.claimedByEditorName ?? (item.claimedByEditorId ? "Me" : "Z_Unclaimed"),
      status: (item) => item.status,
      submitted: (item) => new Date(item.submittedAt).getTime(),
      due: (item) => (item.deadline ? new Date(item.deadline).getTime() : 0),
    },
    { key: "submitted", direction: "desc" },
  );

  useEffect(() => {
    setPage(1);
  }, [query, tab, claimFilter, audienceFilter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, sorted.length]);

  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const tabs: QueueTab[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "NEW", label: "New", count: counts.NEW },
    { key: "NEEDS", label: "Needs Review", count: counts.NEEDS },
    { key: "OVERDUE", label: "Overdue", count: counts.OVERDUE },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];

  if (!user) return null;

  return (
    <QueuePage
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <QueueActionButton
          icon={<RefreshCw className="size-4" />}
          label="Refresh"
          onClick={() => queryClient.invalidateQueries()}
        />
      }
      stats={
        <>
          <StatCard
            tone="rose"
            icon={<FileWarning className="size-4" />}
            label="Needs Action"
            value={counts.NEEDS}
            hint="Awaiting editor review"
          />
          <StatCard
            tone="sky"
            icon={<UserPlus className="size-4" />}
            label="Unclaimed Proposals"
            value={counts.UNCLAIMED}
            hint="Requires Tantou editor"
          />
          <StatCard
            tone="emerald"
            icon={<ShieldCheck className="size-4" />}
            label="My Assigned"
            value={counts.MINE}
            hint="Assigned to you"
          />
          <StatCard
            tone="amber"
            icon={<Clock className="size-4" />}
            label="Overdue SLA"
            value={counts.OVERDUE}
            hint="Past due date"
          />
        </>
      }
      tabs={
        <QueueTabs
          tabs={tabs}
          active={tab}
          onChange={(key) => {
            setTab(key as TabKey);
            setPage(1);
          }}
        />
      }
      toolbar={
        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search title, author, pitch..."
          inputClassName="w-60"
          filters={
            <>
              <FilterSelect value={claimFilter} onValueChange={setClaimFilter}>
                <SelectItem value="ALL">All Assignments</SelectItem>
                <SelectItem value="UNCLAIMED">Unclaimed Only</SelectItem>
                <SelectItem value="MINE">Assigned to Me</SelectItem>
              </FilterSelect>
              <FilterSelect value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectItem value="ALL">All Audiences</SelectItem>
                {Object.entries(AUDIENCE_LABEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </FilterSelect>
            </>
          }
        />
      }
      footer={
        <DataPagination
          total={sorted.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemName="items"
        />
      }
    >
      <QueueTable
        columns={reviewQueueColumns(user.id, items)}
        rows={paged}
        getRowKey={(item) => item.id}
        getRowAccent={reviewRowAccent}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        fixed
        empty={isLoading ? "Loading review queue..." : "No items require review."}
      />
    </QueuePage>
  );
}
