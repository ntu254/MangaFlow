import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, ShieldAlert } from "lucide-react";
import type { RankingRow } from "@/entities/board/model/board-types";
import { DataTable, FilterSelect, SearchToolbar, SortableHeader } from "@/shared/ui";
import { SelectItem } from "@/components/ui/select";
import { useSortableData } from "@/shared/lib/use-sortable-data";

const RISK_CLASS: Record<RankingRow["risk"], string> = {
  LOW: "bg-emerald-100 text-emerald-900",
  MEDIUM: "bg-amber-100 text-amber-900",
  HIGH: "bg-rose-100 text-rose-900",
  CRITICAL: "bg-rose-200 text-rose-950",
};

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (riskFilter === "ALL" || row.risk === riskFilter) &&
          (!query.trim() || row.seriesTitle.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [query, riskFilter, rows],
  );
  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      rank: (row) => row.rank,
      series: (row) => row.seriesTitle,
      score: (row) => row.score,
      readerScore: (row) => row.readerScore ?? 0,
      votes: (row) => row.votes,
    },
    { key: "rank", direction: "asc" },
  );

  if (rows.length === 0) {
    return <DataTable isEmpty emptyTitle="No ranking data" emptyDescription="Import a ranking period to start Board review." />;
  }

  return (
    <div className="space-y-4">
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search series"
        filters={
          <FilterSelect value={riskFilter} onValueChange={setRiskFilter}>
            <SelectItem value="ALL">All signals</SelectItem>
            <SelectItem value="HIGH">At risk</SelectItem>
            <SelectItem value="LOW">Stable</SelectItem>
          </FilterSelect>
        }
      />

      {sorted.length === 0 ? (
        <DataTable isEmpty emptyTitle="No matching series" emptyDescription="Try another search or signal filter." />
      ) : (
        <DataTable>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-page)]/60 text-left text-[10px] uppercase tracking-widest text-[var(--admin-faint)]">
                <tr>
                  <th className="px-4 py-3 font-semibold"><SortableHeader label="Rank" sortKey="rank" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                  <th className="min-w-[240px] px-3 py-3 font-semibold"><SortableHeader label="Series" sortKey="series" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-right font-semibold"><SortableHeader label="Final score" sortKey="score" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort} className="justify-end" /></th>
                  <th className="px-3 py-3 text-right font-semibold"><SortableHeader label="Reader score" sortKey="readerScore" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort} className="justify-end" /></th>
                  <th className="px-3 py-3 text-right font-semibold"><SortableHeader label="Votes" sortKey="votes" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort} className="justify-end" /></th>
                  <th className="px-3 py-3 font-semibold">Signal</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
                    <td className="px-4 py-3 font-semibold text-[var(--admin-ink)]">#{row.rank}</td>
                    <td className="px-3 py-3"><p className="font-semibold text-[var(--admin-ink)]">{row.seriesTitle}</p><p className="mt-0.5 text-[11px] text-[var(--admin-faint)]">{row.editorNote || "Active"}</p></td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-[var(--admin-ink)]">{row.score.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--admin-muted)]">{row.readerScore?.toFixed(1) ?? "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--admin-muted)]">{row.votes.toLocaleString()}</td>
                    <td className="px-3 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RISK_CLASS[row.risk]}`}>{row.risk === "HIGH" ? "At risk" : "Stable"}</span></td>
                    <td className="px-4 py-3 text-right">
                      {row.risk === "HIGH" ? (
                        <Link to="/app/board/at-risk" className="inline-flex items-center gap-1 rounded-[5px] bg-rose-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-800"><ShieldAlert className="size-3" /> Review</Link>
                      ) : (
                        <Link to="/app/series/$slug/$tab" params={{ slug: row.seriesId, tab: "overview" }} className="inline-flex items-center gap-1 rounded-[5px] border border-[var(--admin-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--admin-ink)] hover:border-[var(--admin-navy)]">View <ExternalLink className="size-3" /></Link>
                      )}
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
