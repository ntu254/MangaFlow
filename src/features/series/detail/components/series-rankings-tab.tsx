import { AlertCircle, TrendingUp, Vote, Award, ShieldAlert } from "lucide-react";
import { useRankingsQuery, mapApiError, type SeriesRanking } from "../../api/series-queries";
import type { ProductionSeries } from "@/entities/series";

export function SeriesRankingsTab({ series }: { series: ProductionSeries }) {
  const { data: rankings = [], isLoading, isError, error } = useRankingsQuery(series.id);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-md border border-border bg-card" />;
  }

  if (isError) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50/20 p-6 text-center space-y-2">
        <AlertCircle className="mx-auto size-8 text-rose-500" />
        <h3 className="font-semibold text-rose-900">Không thể tải dữ liệu xếp hạng</h3>
        <p className="text-xs text-rose-700">{mapApiError(error)}</p>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu xếp hạng tuần cho tác phẩm "{series.title}".
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Điểm Final Score</span>
            <TrendingUp className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {rankings[0]?.finalScore?.toFixed(1) || "—"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Điểm số tổng hợp mới nhất</p>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Độc giả đánh giá</span>
            <Award className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {rankings[0]?.readerScore?.toFixed(1) || "—"}/10
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Điểm bình chọn trung bình</p>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng lượt Vote</span>
            <Vote className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {rankings[0]?.voteCount?.toLocaleString("vi-VN") || "—"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Phiếu bầu trong tuần hiện tại</p>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tình trạng rủi ro
            </span>
            <ShieldAlert className="size-4" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                rankings[0]?.atRisk
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {rankings[0]?.atRisk ? "AT RISK" : "AN TOÀN"}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {rankings[0]?.atRisk
              ? "Tác phẩm có nguy cơ bị huỷ do lượng vote giảm."
              : "Chỉ số tương tác ổn định."}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Lịch sử xếp hạng qua các tuần
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-semibold">Tuần (Period)</th>
                <th className="px-3 py-2 text-right font-semibold">Lượt bầu chọn</th>
                <th className="px-3 py-2 text-right font-semibold">Reader Score</th>
                <th className="px-3 py-2 text-right font-semibold">Final Score</th>
                <th className="px-3 py-2 text-left font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r: SeriesRanking) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{r.period}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {r.voteCount?.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">
                    {r.readerScore?.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-foreground">
                    {r.finalScore?.toFixed(1)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        r.atRisk ? "bg-rose-100 text-rose-800" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status || (r.atRisk ? "AT_RISK" : "SUBMITTED")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
