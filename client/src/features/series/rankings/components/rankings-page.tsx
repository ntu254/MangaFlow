import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  EmptyState,
  MetricCard,
  MetricGrid,
  PageHeader,
  StateBlock,
  StatusPill,
} from "@/shared/ui";
import { Link } from "@tanstack/react-router";
import { Award, BookOpen, ShieldAlert, TrendingUp, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import {
  mapApiError,
  type SeriesRanking,
  useMySeriesQuery,
  useRankingsQuery,
} from "../../api/series-queries";

export function RankingsPage() {
  const {
    data: seriesList = [],
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useMySeriesQuery();
  const [selectedSeriesId, setSelectedSeriesId] = useState("");

  const activeSeriesId = selectedSeriesId || seriesList[0]?.id || "";
  const activeSeries = useMemo(
    () => seriesList.find((series) => series.id === activeSeriesId),
    [seriesList, activeSeriesId],
  );
  const {
    data: rankings = [],
    isLoading: isRankingsLoading,
    isError: isRankingsError,
    error: rankingsError,
  } = useRankingsQuery(activeSeriesId);
  const latest = rankings[0];

  if (isSeriesLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Bảng xếp hạng & Đánh giá"
          description="Đang tải danh sách tác phẩm và dữ liệu xếp hạng."
        />
        <DataTable isLoading skeletonRows={6} skeletonColumns={5} />
      </div>
    );
  }

  if (isSeriesError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Bảng xếp hạng & Đánh giá"
          description="Theo dõi hiệu suất và phản hồi độc giả theo tuần."
        />
        <StateBlock
          tone="danger"
          title="Không thể tải danh sách tác phẩm"
          description={mapApiError(seriesError)}
        />
      </div>
    );
  }

  if (seriesList.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Bảng xếp hạng & Đánh giá"
          description="Theo dõi hiệu suất và phản hồi độc giả theo tuần."
        />
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="Chưa có tác phẩm"
          description="Bạn chưa sở hữu tác phẩm đang sản xuất để xem dữ liệu xếp hạng."
          action={
            <Link
              to="/app/series"
              className="inline-flex h-10 items-center rounded-[6px] border border-[var(--admin-navy)] bg-[var(--admin-navy)] px-4 text-[13px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Quay lại Series
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Bảng xếp hạng & Đánh giá"
        description="Theo dõi phản hồi độc giả, điểm số trung bình và cảnh báo sức khỏe của tác phẩm."
        actions={
          seriesList.length > 1 ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="series-select"
                className="text-[12px] font-semibold text-[var(--admin-muted)]"
              >
                Tác phẩm
              </label>
              <Select value={activeSeriesId} onValueChange={setSelectedSeriesId}>
                <SelectTrigger
                  id="series-select"
                  className="h-10 w-56 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seriesList.map((series) => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null
        }
      />

      {isRankingsError ? (
        <StateBlock
          tone="danger"
          title="Không thể tải dữ liệu xếp hạng"
          description={mapApiError(rankingsError)}
        />
      ) : null}

      {!isRankingsError && !isRankingsLoading && rankings.length > 0 ? (
        <MetricGrid>
          <MetricCard
            icon={<TrendingUp className="size-5" />}
            label="Final Score"
            value={latest?.finalScore?.toFixed(1) ?? "-"}
            hint="Điểm tổng hợp mới nhất"
          />
          <MetricCard
            icon={<Award className="size-5" />}
            label="Reader Score"
            value={`${latest?.readerScore?.toFixed(1) ?? "-"}/10`}
            hint="Điểm bình chọn trung bình"
          />
          <MetricCard
            icon={<Vote className="size-5" />}
            label="Tổng lượt vote"
            value={latest?.voteCount?.toLocaleString("vi-VN") ?? "-"}
            hint="Phiếu bầu trong tuần hiện tại"
          />
          <MetricCard
            icon={<ShieldAlert className="size-5" />}
            label="Tình trạng rủi ro"
            value={latest?.atRisk ? "At risk" : "Stable"}
            hint={
              latest?.atRisk
                ? "Lượng vote đang giảm và cần được theo dõi."
                : "Chỉ số tương tác đang ổn định."
            }
            tone={latest?.atRisk ? "danger" : "success"}
          />
        </MetricGrid>
      ) : null}

      {isRankingsLoading ? (
        <DataTable isLoading skeletonRows={6} skeletonColumns={5} />
      ) : isRankingsError ? null : rankings.length === 0 ? (
        <DataTable
          isEmpty
          emptyTitle="Chưa có dữ liệu xếp hạng"
          emptyDescription={`Chưa có dữ liệu theo tuần cho tác phẩm "${activeSeries?.title ?? ""}".`}
        />
      ) : (
        <DataTable>
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="font-serif text-[18px] font-semibold text-[var(--admin-ink)]">
              Lịch sử xếp hạng theo tuần
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-left font-serif text-[14px] text-[var(--admin-ink)]">
                  <th className="px-5 py-3 font-semibold">Tuần</th>
                  <th className="px-3 py-3 text-right font-semibold">Lượt bình chọn</th>
                  <th className="px-3 py-3 text-right font-semibold">Reader Score</th>
                  <th className="px-3 py-3 text-right font-semibold">Final Score</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((ranking: SeriesRanking) => (
                  <tr
                    key={ranking.id}
                    className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover)]"
                  >
                    <td className="px-5 py-3 font-semibold text-[var(--admin-ink)]">
                      {ranking.period}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                      {ranking.voteCount?.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                      {ranking.readerScore?.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-[var(--admin-ink)] tabular-nums">
                      {ranking.finalScore?.toFixed(1)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        status={ranking.status || (ranking.atRisk ? "at_risk" : "submitted")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
