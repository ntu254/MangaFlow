import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useState } from "react";
import { Coins, UserCheck, CreditCard, RefreshCw, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchSeriesList, type Series } from "@/features/series/api/series";
import { listTasks, type Task } from "@/features/task/api/task";
import { fetchSeriesPayroll, calculateTaskEarning, confirmTaskEarning, type AssistantEarning } from "../api/payroll";

type DataState = {
  seriesList: Series[];
  selectedSeriesId: string | null;
  earnings: AssistantEarning[];
  approvedTasks: Task[];
  isLoading: boolean;
  error: string | null;
};

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/60",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200/60",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/60"
};

const timingStyles = {
  EARLY: "bg-emerald-50 text-emerald-700 border-emerald-200/30",
  ON_TIME: "bg-blue-50 text-blue-700 border-blue-200/30",
  LATE_WITHIN_24H: "bg-amber-50 text-amber-700 border-amber-200/30",
  LATE: "bg-rose-50 text-rose-700 border-rose-200/30"
};

export function MangakaPayrollPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<DataState>({
    seriesList: [],
    selectedSeriesId: null,
    earnings: [],
    approvedTasks: [],
    isLoading: true,
    error: null
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async (seriesId?: string | null) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      // 1. Fetch series list
      const series = await fetchSeriesList(token);
      if (series.length === 0) {
        setState({
          seriesList: [],
          selectedSeriesId: null,
          earnings: [],
          approvedTasks: [],
          isLoading: false,
          error: null
        });
        return;
      }

      // 2. Select series (default to first one if none selected)
      const activeSeriesId = seriesId || state.selectedSeriesId || series[0].id;

      // 3. Fetch payroll details and all tasks
      const [payroll, tasks] = await Promise.all([
        fetchSeriesPayroll(token, activeSeriesId),
        listTasks(token)
      ]);

      // 4. Filter tasks that are in approved state and belong to this series
      const approved = tasks.filter(
        t => t.seriesId === activeSeriesId && ["MANGAKA_APPROVED", "EDITOR_APPROVED"].includes(t.status)
      );

      setState({
        seriesList: series,
        selectedSeriesId: activeSeriesId,
        earnings: payroll,
        approvedTasks: approved,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to fetch payroll data"
      }));
    }
  }, [getToken, state.selectedSeriesId]);

  useEffect(() => {
    void loadData();
  }, []);

  const handleCalculate = async (taskId: string) => {
    try {
      setActionLoading(`calc-${taskId}`);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      await calculateTaskEarning(token, taskId);
      await loadData(state.selectedSeriesId);
    } catch (err: any) {
      alert(err.message || "Failed to calculate earning");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (taskId: string) => {
    try {
      setActionLoading(`confirm-${taskId}`);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      await confirmTaskEarning(token, taskId);
      await loadData(state.selectedSeriesId);
    } catch (err: any) {
      alert(err.message || "Failed to confirm earning");
    } finally {
      setActionLoading(null);
    }
  };

  if (state.isLoading && state.seriesList.length === 0) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-[#5f5270]">
          <Loader2 className="size-4 animate-spin text-[#9065d5]" />
          Loading series payroll...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-medium">
          {state.error}
        </div>
      </div>
    );
  }

  if (state.seriesList.length === 0) {
    return (
      <div className="container max-w-6xl py-8 text-center border-2 border-dashed border-[#eadff6] rounded-2xl bg-white">
        <h3 className="text-lg font-bold text-[#2f243a] mb-2">No Series Found</h3>
        <p className="text-sm text-[#8a7a99] mb-4">You need to have at least one active series to manage payroll.</p>
      </div>
    );
  }

  // Summary counts
  const totalAccumulated = state.earnings
    .filter(e => e.status !== "CANCELLED")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  const pendingConfirmation = state.earnings
    .filter(e => e.status === "PENDING")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  const confirmedPayouts = state.earnings
    .filter(e => e.status === "CONFIRMED")
    .reduce((sum, e) => sum + e.finalPayment, 0);

  // Group approved tasks into:
  // - calculated: task already has an earning document
  // - uncalculated: task does NOT have an earning document
  const earningTaskIds = new Set(state.earnings.map(e => e.taskId));
  const uncalculatedTasks = state.approvedTasks.filter(t => !earningTaskIds.has(t.id));

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2f243a]">Series Payroll</h1>
            <p className="mt-1.5 text-sm text-[#8a7a99]">Calculate assistant payout points, check deadlines, and authorize payouts.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={state.selectedSeriesId || ""}
              onValueChange={(val) => void loadData(val)}
            >
              <SelectTrigger className="w-[200px] border-[#eadff6] bg-white text-[#2f243a]">
                <SelectValue placeholder="Select Series" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#eadff6]">
                {state.seriesList.map(s => (
                  <SelectItem key={s.id} value={s.id} className="focus:bg-[#f8f1ff] focus:text-[#9065d5]">{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => void loadData(state.selectedSeriesId)} className="border-[#eadff6] hover:bg-[#f8f1ff]">
              <RefreshCw className="size-4 text-[#5f5270]" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Series Total Payout</CardTitle>
              <Coins className="size-4 text-[#9065d5]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2f243a]">{totalAccumulated.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Calculated assistant earnings</p>
            </CardContent>
          </Card>

          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Awaiting Confirmation</CardTitle>
              <UserCheck className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingConfirmation.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Mangaka action required</p>
            </CardContent>
          </Card>

          <Card className="border-[#eadff6] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Confirmed Payouts</CardTitle>
              <CreditCard className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{confirmedPayouts.toLocaleString()} PTS</div>
              <p className="text-[11px] text-[#8a7a99] mt-1">Awaiting Admin distribution</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Eligible Tasks for Calculation */}
        {uncalculatedTasks.length > 0 && (
          <Card className="border-[#eadff6] shadow-sm bg-white mb-8">
            <CardHeader className="bg-[#fff3f8]/30 border-b border-[#f3d7e7]/55">
              <CardTitle className="text-lg font-semibold text-[#2f243a] flex items-center gap-2">
                <Calculator className="size-5 text-[#e560bc]" />
                Calculate Payouts for Approved Tasks
              </CardTitle>
              <CardDescription className="text-xs text-[#8a7a99]">
                These tasks have been approved by you or an editor but do not have earnings calculated yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-xl border border-[#eadff6] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#fff3f8]/10">
                    <TableRow className="border-b border-[#eadff6]">
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Task Title</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Type</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Assistant ID</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Base Rate</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Revisions</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uncalculatedTasks.map((t) => (
                      <TableRow key={t.id} className="border-b border-[#eadff6]/50">
                        <TableCell className="font-semibold text-xs text-[#2f243a]">{t.title}</TableCell>
                        <TableCell className="text-[10px] font-bold text-[#8a7a99] uppercase tracking-wider">{t.type}</TableCell>
                        <TableCell className="text-xs text-[#5f5270] truncate max-w-[120px] font-mono" title={t.assignedTo}>{t.assignedTo}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-[#2f243a]">{t.baseRate.toLocaleString()} PTS</TableCell>
                        <TableCell className="text-center text-xs font-semibold text-[#5f5270]">Round {t.revisionRound}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            disabled={actionLoading === `calc-${t.id}`}
                            onClick={() => void handleCalculate(t.id)}
                            className="bg-[#9065d5] hover:bg-[#7f55c7] text-white text-xs h-7.5 px-3 rounded-lg"
                          >
                            {actionLoading === `calc-${t.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Calculate Earning"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 2: Calculated Earnings & Payout Statuses */}
        <Card className="border-[#eadff6] shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-[#f3d7e7]/55">
            <CardTitle className="text-lg font-semibold text-[#2f243a]">Earnings List</CardTitle>
            <CardDescription className="text-xs text-[#8a7a99]">Confirm pending earnings to authorize administrative payouts.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {state.earnings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#eadff6] rounded-xl">
                <p className="text-sm text-[#8a7a99]">No earnings records calculated yet for this series.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#eadff6] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8f1ff]/40">
                    <TableRow className="border-b border-[#eadff6]">
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Assistant Name</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Task</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Type</TableHead>
                      <TableHead className="text-[#2f243a] font-semibold text-xs">Timing</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Base Rate</TableHead>
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Total payout</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.earnings.map((e) => (
                      <TableRow key={e.id} className="border-b border-[#eadff6]/50">
                        <TableCell className="font-semibold text-xs text-[#2f243a]">
                          {e.assistantName || <span className="font-mono text-xs text-muted-foreground">{e.assistantId.slice(-6)}</span>}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs text-[#5f5270] font-medium" title={e.taskTitle}>
                          {e.taskTitle || "Unnamed Task"}
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-[#8a7a99] uppercase tracking-wider">
                          {e.taskType}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${timingStyles[e.timingStatus]}`}>
                            {e.timingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-[#5f5270]">
                          {e.basePayment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-extrabold text-[#2f243a]">
                          {e.finalPayment.toLocaleString()} PTS
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusStyles[e.status]}`}>
                            {e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {e.status === "PENDING" ? (
                            <Button
                              size="sm"
                              disabled={actionLoading === `confirm-${e.taskId}`}
                              onClick={() => void handleConfirm(e.taskId)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7.5 px-3 rounded-lg"
                            >
                              {actionLoading === `confirm-${e.taskId}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#8a7a99] font-medium">Ready / Disbursed</span>
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
