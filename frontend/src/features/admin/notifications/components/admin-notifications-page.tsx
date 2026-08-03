import { useEffect, useMemo, useState } from "react";
import { Bell, Eye, Megaphone, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActionButton,
  DataPagination,
  DataTable,
  MetricCard,
  MetricGrid,
  PageFrame,
  PageHeader,
  SearchToolbar,
  SortableHeader,
  StateBlock,
} from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { toast } from "sonner";
import { formatDateTime, mapAdminError, useAdminAccess, AccessDenied } from "../../_shared";
import {
  type ManagedNotification,
  useAdminNotificationDeleteMutation,
  useAdminNotificationsQuery,
} from "../api/notifications.queries";
import { BroadcastDetailSheet, type BroadcastDetail } from "./broadcast-detail-sheet";
import { CreateBroadcastDialog } from "./create-broadcast-dialog";

type AudienceFilter = "ALL" | "ALL_USERS" | "ROLE" | "USER";
const ROWS_PER_PAGE = 10;

function groupBroadcasts(items: ManagedNotification[]): BroadcastDetail[] {
  const grouped = new Map<string, BroadcastDetail>();
  for (const item of items) {
    const key = item.batchId ?? item.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.recipientCount += 1;
      continue;
    }
    grouped.set(key, { ...item, recipientCount: 1 });
  }
  return [...grouped.values()];
}

export function AdminNotificationsPage() {
  const { canQueryAdmin, denial } = useAdminAccess();
  const {
    data: managedItems = [],
    isLoading,
    error,
    refetch,
  } = useAdminNotificationsQuery({ enabled: canQueryAdmin });
  const deleteNotification = useAdminNotificationDeleteMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<BroadcastDetail | null>(null);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("ALL");
  const [page, setPage] = useState(1);

  const broadcasts = useMemo(() => groupBroadcasts(managedItems), [managedItems]);
  const filteredBroadcasts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return broadcasts.filter((broadcast) => {
      const matchesSearch =
        !normalizedSearch ||
        [broadcast.title, broadcast.message, broadcast.kind, broadcast.batchId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesAudience =
        audienceFilter === "ALL" ||
        (audienceFilter === "ALL_USERS" && broadcast.audienceType === "ALL") ||
        (audienceFilter === "ROLE" && broadcast.audienceType === "ROLE") ||
        (audienceFilter === "USER" && broadcast.audienceType === "USER");
      return matchesSearch && matchesAudience;
    });
  }, [audienceFilter, broadcasts, search]);
  const {
    sorted: sortedBroadcasts,
    sortKey,
    sortDirection,
    toggleSort,
  } = useSortableData(
    filteredBroadcasts,
    {
      title: (broadcast) => broadcast.title,
      audience: (broadcast) =>
        broadcast.audienceType === "ROLE"
          ? (broadcast.audienceRole ?? "Role")
          : broadcast.audienceType === "ALL"
            ? "All users"
            : "Specific user",
      recipients: (broadcast) => broadcast.recipientCount,
      priority: (broadcast) => broadcast.priority ?? "NORMAL",
      sentAt: (broadcast) => new Date(broadcast.sentAt ?? broadcast.createdAt),
    },
    { key: "sentAt", direction: "desc" },
  );
  useEffect(() => setPage(1), [audienceFilter, search, sortKey, sortDirection]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredBroadcasts.length / ROWS_PER_PAGE));
    setPage((currentPage) => Math.min(currentPage, lastPage));
  }, [filteredBroadcasts.length]);

  const recipientCount = broadcasts.reduce(
    (total, broadcast) => total + broadcast.recipientCount,
    0,
  );
  const hasFilters = Boolean(search) || audienceFilter !== "ALL";
  const visibleBroadcasts = sortedBroadcasts.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  if (denial) {
    return (
      <AccessDenied
        title="Notifications"
        description="You do not have permission to manage operational broadcasts."
        denial={denial}
      />
    );
  }

  const deleteBroadcast = (broadcast: BroadcastDetail) => {
    deleteNotification.mutate(broadcast.id, {
      onSuccess: () => {
        toast.success("Broadcast deleted.");
        setSelected(null);
      },
      onError: (deleteError) => toast.error(mapAdminError(deleteError)),
    });
  };

  return (
    <PageFrame className="bg-[var(--admin-page)] p-0">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1400px] px-5 py-7 lg:px-8">
        <PageHeader
          eyebrow="Admin / Communications"
          title="Notifications"
          description="Create and review operational broadcasts sent across MangaFlow."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
              <ActionButton onClick={() => setCreateOpen(true)}>
                <Megaphone className="size-4" />
                New broadcast
              </ActionButton>
            </>
          }
        />

        <MetricGrid className="mt-7 md:grid-cols-2">
          <MetricCard
            icon={<Bell className="size-5" />}
            label="Total broadcasts"
            value={broadcasts.length}
            hint="All sent messages"
          />
          <MetricCard
            icon={<Megaphone className="size-5" />}
            label="Recipients reached"
            value={recipientCount}
            hint="Across all broadcasts"
            tone="success"
          />
        </MetricGrid>

        <SearchToolbar
          className="mt-7"
          query={search}
          onQueryChange={setSearch}
          placeholder="Search broadcasts by title or message"
          filters={
            <>
              <Select
                value={audienceFilter}
                onValueChange={(value) => setAudienceFilter(value as AudienceFilter)}
              >
                <SelectTrigger className="h-10 w-[150px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All audiences</SelectItem>
                  <SelectItem value="ALL_USERS">All users</SelectItem>
                  <SelectItem value="ROLE">By role</SelectItem>
                  <SelectItem value="USER">Specific user</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              disabled={!hasFilters}
              onClick={() => {
                setSearch("");
                setAudienceFilter("ALL");
              }}
              className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          }
        />

        <DataTable className="mt-5" isLoading={isLoading} skeletonRows={6} skeletonColumns={6}>
          {error ? (
            <div className="p-5">
              <StateBlock
                tone="danger"
                title="Could not load broadcasts"
                description={mapAdminError(error)}
              />
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="p-5">
              <StateBlock
                tone="default"
                title={hasFilters ? "No matching broadcasts" : "No broadcasts yet"}
                description={
                  hasFilters
                    ? "Try a different search or filter."
                    : "Create the first operational broadcast to start the history."
                }
                action={
                  !hasFilters ? (
                    <Button onClick={() => setCreateOpen(true)}>Create broadcast</Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--admin-border)] hover:bg-transparent">
                    <TableHead className="h-12 pl-5 font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      <SortableHeader
                        label="Broadcast"
                        sortKey="title"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      <SortableHeader
                        label="Audience"
                        sortKey="audience"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      <SortableHeader
                        label="Recipients"
                        sortKey="recipients"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      <SortableHeader
                        label="Priority"
                        sortKey="priority"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      <SortableHeader
                        label="Sent"
                        sortKey="sentAt"
                        activeSortKey={sortKey}
                        direction={sortDirection}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="pr-5 text-center font-serif text-[14px] font-semibold text-[var(--admin-ink)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBroadcasts.map((broadcast) => (
                    <TableRow
                      key={broadcast.batchId ?? broadcast.id}
                      className="border-[var(--admin-border)] hover:bg-[var(--admin-hover)]"
                    >
                      <TableCell className="max-w-[330px] pl-5">
                        <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
                          {broadcast.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[var(--admin-faint)]">
                          {broadcast.message}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--admin-muted)]">
                        {broadcast.audienceType === "ROLE"
                          ? (broadcast.audienceRole ?? "Role")
                          : broadcast.audienceType === "ALL"
                            ? "All users"
                            : "Specific user"}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-[var(--admin-muted)]">
                        {broadcast.recipientCount}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--admin-muted)]">
                        {broadcast.priority ?? "NORMAL"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-[var(--admin-faint)]">
                        {formatDateTime(broadcast.sentAt ?? broadcast.createdAt)}
                      </TableCell>
                      <TableCell className="pr-5 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setSelected(broadcast)}
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataTable>
        <DataPagination
          total={filteredBroadcasts.length}
          page={page}
          pageSize={ROWS_PER_PAGE}
          onPageChange={setPage}
          itemName="broadcasts"
        />
      </section>

      <CreateBroadcastDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void refetch()}
      />
      <BroadcastDetailSheet
        broadcast={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onDelete={() => selected && deleteBroadcast(selected)}
        deleting={deleteNotification.isPending}
      />
    </PageFrame>
  );
}
