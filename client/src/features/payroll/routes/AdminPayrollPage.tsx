import { useAuth } from "@/shared/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, CheckCircle2, AlertCircle, Loader2, RefreshCw, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  fetchMonthlySummary,
  markPaid,
  type MonthlyPayrollSummary,
  type AssistantEarning
} from "../api/payroll";
import { apiBaseUrl, parseApiResponse } from "@/shared/api";

type StatusFilter = "ALL" | "PENDING" | "CONFIRMED" | "PAID";

type DataState = {
  summary: MonthlyPayrollSummary | null;
  earnings: AssistantEarning[];
  isLoading: boolean;
  error: string | null;
};

export function AdminPayrollPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<DataState>({
    summary: null,
    earnings: [],
    isLoading: true,
    error: null
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAllEarnings = async (token: string): Promise<AssistantEarning[]> => {
    const response = await fetch(`${apiBaseUrl}/payroll`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return parseApiResponse<AssistantEarning[]>(response, "Failed to fetch all earnings");
  };

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const [summary, earnings] = await Promise.all([
        fetchMonthlySummary(token),
        fetchAllEarnings(token)
      ]);

      setState({ summary, earnings, isLoading: false, error: null });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to load payroll data"
      }));
    }
  }, [getToken]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleMarkPaid = async (earningId: string) => {
    try {
      setActionLoading(`pay-${earningId}`);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await markPaid(token, earningId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to mark paid");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEarnings = state.earnings.filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesAssistant = e.assistantName?.toLowerCase().includes(q);
      const matchesSeries = e.seriesTitle?.toLowerCase().includes(q);
      const matchesId = e.id.toLowerCase().includes(q);
      if (!matchesAssistant && !matchesSeries && !matchesId) return false;
    }
    return true;
  });

  const statusCounts = {
    ALL: state.earnings.length,
    PENDING: state.earnings.filter((e) => e.status === "PENDING").length,
    CONFIRMED: state.earnings.filter((e) => e.status === "CONFIRMED").length,
    PAID: state.earnings.filter((e) => e.status === "PAID").length,
  };

  if (state.isLoading && state.earnings.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#5f5270]">
          <Loader2 className="size-4 animate-spin text-[#9065d5]" />
          Loading payroll data...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb] flex items-center justify-center">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-medium max-w-lg">
          {state.error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/app/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#9065d5] hover:text-[#7f55c7] mb-3">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              Payroll Overview
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Track assistant earnings, bonuses, penalties, and payment status across all series.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => void loadData()} className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">

        {state.summary && (
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Pending</CardTitle>
                <AlertCircle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{state.summary.totalPending.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">{statusCounts.PENDING} earnings</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Confirmed</CardTitle>
                <CheckCircle2 className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{state.summary.totalConfirmed.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">{statusCounts.CONFIRMED} ready for payout</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Paid</CardTitle>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{state.summary.totalPaid.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">{statusCounts.PAID} disbursed</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Total Records</CardTitle>
                <Wallet className="size-4 text-[#9065d5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#2f243a]">{statusCounts.ALL}</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Earning entries</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-[#eadff6] shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-[#f3d7e7]/55">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-[#2f243a]">Earnings</CardTitle>
                <CardDescription className="text-xs text-[#8a7a99]">
                  All assistant earnings across the system.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                <Input
                  placeholder="Search by name, series, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-[#eadff6] rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {(["ALL", "PENDING", "CONFIRMED", "PAID"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-[#9065d5] text-white"
                      : "bg-[#f8f1ff]/40 text-[#5f5270] hover:bg-[#f8f1ff]"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  <span className="ml-1.5 opacity-70">({statusCounts[s]})</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {filteredEarnings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#eadff6] rounded-xl">
                <p className="text-sm text-[#8a7a99]">No earnings match the current filter.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#eadff6] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8f1ff]/20">
                    <TableRow className="border-b border-[#eadff6]">
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Assistant</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Series</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Task Type</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Timing</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Base</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Bonus</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Total</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEarnings.map((e) => (
                      <TableRow key={e.id} className="border-b border-[#eadff6]/50">
                        <TableCell className="font-semibold text-xs text-[#2f243a]">
                          {e.assistantName || <span className="font-mono text-xs text-muted-foreground">{e.assistantId.slice(-6)}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-[#5f5270]">{e.seriesTitle || "Private Series"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-[#8a7a99] uppercase tracking-wider">{e.taskType}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            e.timingStatus === "EARLY" ? "text-emerald-600 bg-emerald-50" :
                            e.timingStatus === "ON_TIME" ? "text-blue-600 bg-blue-50" :
                            e.timingStatus === "LATE_WITHIN_24H" ? "text-amber-600 bg-amber-50" :
                            "text-red-600 bg-red-50"
                          }`}>
                            {e.timingStatus.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs text-[#5f5270]">{e.basePayment.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">
                          <span className={e.bonusAmount > 0 ? "text-emerald-600 font-medium" : "text-[#8a7a99]"}>
                            {e.bonusAmount > 0 ? `+${e.bonusAmount.toLocaleString()}` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-[#2f243a]">{e.finalPayment.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                            e.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            e.status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            e.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-slate-50 text-slate-400 border-slate-200"
                          }`}>
                            {e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {e.status === "CONFIRMED" ? (
                            <Button
                              size="sm"
                              disabled={actionLoading === `pay-${e.id}`}
                              onClick={() => void handleMarkPaid(e.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7.5 px-3 rounded-lg"
                            >
                              {actionLoading === `pay-${e.id}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Disburse"
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#8a7a99]">
                              {e.status === "PAID" ? "Settled" : "Awaiting"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
