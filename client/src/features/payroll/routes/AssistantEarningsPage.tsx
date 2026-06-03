import { useAuth } from "@clerk/react";
import { DollarSign, Award, Clock, CheckCircle2, Search, ArrowUpDown, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchMyEarnings, type AssistantEarning } from "../api/payroll";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; earnings: AssistantEarning[] }
  | { status: "error"; message: string };

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
};

const timingStyles = {
  EARLY: "bg-emerald-50 text-emerald-700 border-emerald-200/30",
  ON_TIME: "bg-blue-50 text-blue-700 border-blue-200/30",
  LATE_WITHIN_24H: "bg-amber-50 text-amber-700 border-amber-200/30",
  LATE: "bg-rose-50 text-rose-700 border-rose-200/30"
};

export function AssistantEarningsPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof AssistantEarning>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const loadEarnings = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const earnings = await fetchMyEarnings(token);
      setState({ status: "ready", earnings });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load earnings"
      });
    }
  }, [getToken]);

  useEffect(() => {
    void loadEarnings();
  }, [loadEarnings]);

  const handleSort = (field: keyof AssistantEarning) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-[#5f5270]">
          <Loader2 className="size-4 animate-spin text-[#9065d5]" />
          Loading earnings history...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-medium">
          {state.message}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalEarned = state.earnings
    .filter(e => e.status !== "CANCELLED")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  const pendingAmount = state.earnings
    .filter(e => e.status === "PENDING")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  const confirmedAmount = state.earnings
    .filter(e => e.status === "CONFIRMED")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  const paidAmount = state.earnings
    .filter(e => e.status === "PAID")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  // Filter & Search
  let filtered = state.earnings.filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (searchQuery) {
      const matchTask = e.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeries = e.seriesTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = e.taskType.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTask && !matchSeries && !matchType) return false;
    }
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined) return sortAsc ? 1 : -1;
    if (valB === undefined) return sortAsc ? -1 : 1;

    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    // Numbers
    return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2f243a]">Earnings Dashboard</h1>
            <p className="mt-1.5 text-sm text-[#8a7a99]">Track your work points, payout confirmations, and timing bonuses.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadEarnings()} className="border-[#eadff6] hover:bg-[#f8f1ff]">
            <RefreshCw className="mr-2 size-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Total Accumulated</CardTitle>
              <DollarSign className="size-4 text-[#9065d5]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2f243a]">{totalEarned.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">All non-cancelled earnings</p>
            </CardContent>
          </Card>

          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Awaiting Confirm</CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingAmount.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Pending review by Mangakas</p>
            </CardContent>
          </Card>

          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Confirmed Payouts</CardTitle>
              <Award className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{confirmedAmount.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Approved & confirmed by editors</p>
            </CardContent>
          </Card>

          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Paid to Date</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{paidAmount.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Disbursed to your account</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <Card className="border-[#eadff6] shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-[#f3d7e7]/55">
            <CardTitle className="text-lg font-semibold text-[#2f243a]">Earnings History</CardTitle>
            <CardDescription className="text-xs text-[#8a7a99]">A list of all calculated earnings generated from completed region or page assignments.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {/* Toolbar */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                <input
                  type="text"
                  placeholder="Search series, tasks, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#eadff6] bg-white pl-9 pr-3 py-2 text-sm focus:border-[#9065d5] focus:ring-1 focus:ring-[#9065d5] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "PENDING", "CONFIRMED", "PAID"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      statusFilter === status
                        ? "bg-[#9065d5] text-white shadow-sm"
                        : "bg-white border border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#eadff6] rounded-xl">
                <p className="text-sm text-[#8a7a99]">No earnings records match the selected filters.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#eadff6] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8f1ff]/40">
                    <TableRow className="border-b border-[#eadff6]">
                      <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer hover:bg-[#f8f1ff] text-[#2f243a] font-semibold text-xs">
                        Date <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("seriesTitle")} className="cursor-pointer hover:bg-[#f8f1ff] text-[#2f243a] font-semibold text-xs">
                        Series <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("taskTitle")} className="cursor-pointer hover:bg-[#f8f1ff] text-[#2f243a] font-semibold text-xs">
                        Task <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Type</TableHead>
                      <TableHead onClick={() => handleSort("timingStatus")} className="cursor-pointer hover:bg-[#f8f1ff] text-[#2f243a] font-semibold text-xs">
                        Timing <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("basePayment")} className="cursor-pointer hover:bg-[#f8f1ff] text-right text-[#2f243a] font-semibold text-xs">
                        Base Rate <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Adjustments</TableHead>
                      <TableHead onClick={() => handleSort("finalPayment")} className="cursor-pointer hover:bg-[#f8f1ff] text-right text-[#2f243a] font-semibold text-xs">
                        Total Payout <ArrowUpDown className="inline ml-1 size-3" />
                      </TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => {
                      const adjustments = e.bonusAmount - e.penaltyAmount + e.revisionFee;
                      const hasBonus = e.bonusAmount > 0;
                      const hasPenalty = e.penaltyAmount > 0;

                      return (
                        <TableRow key={e.id} className="border-b border-[#eadff6]/50 hover:bg-[#fffcfd]/40 transition-colors">
                          <TableCell className="font-medium text-xs text-[#5f5270]">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-[#2f243a]">
                            {e.seriesTitle || "Private Series"}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate text-xs text-[#2f243a] font-medium" title={e.taskTitle}>
                            {e.taskTitle || "Unnamed Task"}
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-[#8a7a99] uppercase tracking-wider">
                            {e.taskType}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${timingStyles[e.timingStatus]}`}>
                              {e.timingStatus.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-[#5f5270]">
                            {e.basePayment.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {adjustments === 0 ? (
                              <span className="text-[#8a7a99]">—</span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className={adjustments > 0 ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                                  {adjustments > 0 ? "+" : ""}{adjustments.toLocaleString()}
                                </span>
                                {hasBonus && <span className="text-[9px] text-emerald-500 font-medium">Early Bonus</span>}
                                {hasPenalty && <span className="text-[9px] text-rose-400 font-medium">Late Penalty</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs font-extrabold text-[#2f243a]">
                            {e.finalPayment.toLocaleString()} PTS
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusStyles[e.status]}`}>
                              {e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
