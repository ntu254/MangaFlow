import { useAuth } from "@/shared/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, CheckCircle2, AlertCircle, Plus, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchTaskRates,
  createTaskRate,
  updateTaskRate,
  deactivateTaskRate,
  fetchMonthlySummary,
  markPaid,
  type TaskRate,
  type MonthlyPayrollSummary,
  type AssistantEarning
} from "../api/payroll";
import { apiBaseUrl, parseApiResponse } from "@/shared/api";

type DataState = {
  rates: TaskRate[];
  summary: MonthlyPayrollSummary | null;
  allEarnings: AssistantEarning[];
  isLoading: boolean;
  error: string | null;
};

const taskTypes = ["BACKGROUND", "INKING", "SCREENTONE", "CLEANUP", "EFFECT", "OTHER"];

export function AdminTaskRatesPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<DataState>({
    rates: [],
    summary: null,
    allEarnings: [],
    isLoading: true,
    error: null
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaskRate | null>(null);
  const [formData, setFormData] = useState({
    taskType: "BACKGROUND",
    rate: 100,
    currency: "POINT",
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all earnings for admin
  const fetchAllEarnings = async (token: string): Promise<AssistantEarning[]> => {
    const response = await fetch(`${apiBaseUrl}/payroll`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return parseApiResponse<AssistantEarning[]>(response, "Failed to fetch all earnings");
  };

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const [rates, summary, allEarnings] = await Promise.all([
        fetchTaskRates(token),
        fetchMonthlySummary(token),
        fetchAllEarnings(token)
      ]);

      setState({
        rates,
        summary,
        allEarnings,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to load admin payroll workspace"
      }));
    }
  }, [getToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingRate(null);
    setFormData({
      taskType: "BACKGROUND",
      rate: 100,
      currency: "POINT",
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (rate: TaskRate) => {
    setEditingRate(rate);
    setFormData({
      taskType: rate.taskType,
      rate: rate.rate,
      currency: rate.currency,
      isActive: rate.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      if (editingRate) {
        await updateTaskRate(token, editingRate.id, {
          rate: formData.rate,
          currency: formData.currency,
          isActive: formData.isActive
        });
      } else {
        await createTaskRate(token, {
          taskType: formData.taskType,
          rate: formData.rate,
          currency: formData.currency,
          isActive: formData.isActive
        });
      }

      setDialogOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (rateId: string) => {
    if (!confirm("Are you sure you want to deactivate this task rate?")) return;
    try {
      setActionLoading(`deactivate-${rateId}`);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      await deactivateTaskRate(token, rateId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate rate");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (earningId: string) => {
    try {
      setActionLoading(`pay-${earningId}`);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      await markPaid(token, earningId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to mark paid");
    } finally {
      setActionLoading(null);
    }
  };

  if (state.isLoading && state.rates.length === 0) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-[#5f5270]">
          <Loader2 className="size-4 animate-spin text-[#9065d5]" />
          Loading admin payroll workspace...
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

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/app/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#9065d5] hover:text-[#7f55c7] mb-3">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              System Payroll & Rates
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Manage global assistant task rates and disburse confirmed point payouts.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleOpenCreate} className="bg-[#9065d5] hover:bg-[#7c54be] text-white">
              <Plus className="mr-2 size-4" /> Create Rate
            </Button>
            <Button variant="outline" onClick={() => void loadData()} className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">

        {/* Summary Grid */}
        {state.summary && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Global Pending</CardTitle>
                <AlertCircle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{state.summary.totalPending.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Pending review by Mangakas</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Global Confirmed</CardTitle>
                <CheckCircle2 className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{state.summary.totalConfirmed.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Confirmed & ready for payout</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Total Disbursed</CardTitle>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{state.summary.totalPaid.toLocaleString()} PTS</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Total paid across all series</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section 1: Global Task Rates */}
        <Card className="border-[#eadff6] shadow-sm bg-white mb-8">
          <CardHeader className="pb-4 border-b border-[#f3d7e7]/55">
            <CardTitle className="text-lg font-semibold text-[#2f243a] flex items-center gap-2">
              <Settings className="size-5 text-[#9065d5]" />
              Base Task Rates
            </CardTitle>
            <CardDescription className="text-xs text-[#8a7a99]">
              Define base payouts for different region/task scopes. Active configurations will override task defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="rounded-xl border border-[#eadff6] overflow-hidden">
              <Table>
                <TableHeader className="bg-[#f8f1ff]/20">
                  <TableRow className="border-b border-[#eadff6]">
                    <TableHead className="text-[#2f243a] font-semibold text-xs">Task Type</TableHead>
                    <TableHead className="text-[#2f243a] font-semibold text-xs text-right">Base Rate</TableHead>
                    <TableHead className="text-[#2f243a] font-semibold text-xs">Currency</TableHead>
                    <TableHead className="text-[#2f243a] font-semibold text-xs text-center">Status</TableHead>
                    <TableHead className="text-[#2f243a] font-semibold text-xs text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.rates.map((r) => (
                    <TableRow key={r.id} className="border-b border-[#eadff6]/50">
                      <TableCell className="font-semibold text-xs text-[#2f243a]">{r.taskType}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-[#2f243a]">{r.rate.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-[#5f5270] font-medium">{r.currency}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(r)} className="text-xs h-7.5 px-2.5 rounded-md border-[#eadff6] hover:bg-[#f8f1ff]">
                            Edit
                          </Button>
                          {r.isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading === `deactivate-${r.id}`}
                              onClick={() => void handleDeactivate(r.id)}
                              className="text-xs h-7.5 px-2.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100/60"
                            >
                              {actionLoading === `deactivate-${r.id}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Deactivate"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Global Payout List */}
        <Card className="border-[#eadff6] shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-[#f3d7e7]/55">
            <CardTitle className="text-lg font-semibold text-[#2f243a]">Global Payouts & Disbursals</CardTitle>
            <CardDescription className="text-xs text-[#8a7a99]">View all calculated assistant earnings and mark confirmed balances as paid.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {state.allEarnings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#eadff6] rounded-xl">
                <p className="text-sm text-[#8a7a99]">No earning logs exist in the database.</p>
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
                      <TableHead className="text-right text-[#2f243a] font-semibold text-xs">Amount</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-center text-[#2f243a] font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.allEarnings.map((e) => (
                      <TableRow key={e.id} className="border-b border-[#eadff6]/50">
                        <TableCell className="font-semibold text-xs text-[#2f243a]">
                          {e.assistantName || <span className="font-mono text-xs text-muted-foreground">{e.assistantId.slice(-6)}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-[#5f5270]">{e.seriesTitle || "Private Series"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-[#8a7a99] uppercase tracking-wider">{e.taskType}</TableCell>
                        <TableCell className="text-xs text-[#5f5270]">{e.timingStatus}</TableCell>
                        <TableCell className="text-right text-xs font-extrabold text-[#2f243a]">{e.finalPayment.toLocaleString()} PTS</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                            e.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : e.status === "CONFIRMED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
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
                                "Disburse Payment"
                              )}
                            </Button>
                          ) : e.status === "PAID" ? (
                            <span className="text-xs text-emerald-600 font-semibold">Settled</span>
                          ) : (
                            <span className="text-xs text-[#8a7a99]">Awaiting Confirm</span>
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

        {/* Rate configuration dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white border-[#eadff6]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#2f243a]">
                  {editingRate ? "Update Task Rate" : "Create New Task Rate"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#8a7a99]">
                  Configure payout rates for region assignment task tags.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskType" className="text-right text-xs font-semibold text-[#5f5270]">Task Type</Label>
                  <Select
                    disabled={!!editingRate}
                    value={formData.taskType}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, taskType: val || "BACKGROUND" }))}
                  >
                    <SelectTrigger className="col-span-3 border-[#eadff6] text-[#2f243a]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#eadff6]">
                      {taskTypes.map((t) => (
                        <SelectItem key={t} value={t} className="focus:bg-[#f8f1ff] focus:text-[#9065d5]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rate" className="text-right text-xs font-semibold text-[#5f5270]">Rate (Points)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="1"
                    value={formData.rate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rate: parseInt(e.target.value) || 0 }))}
                    className="col-span-3 border-[#eadff6] text-[#2f243a]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right text-xs font-semibold text-[#5f5270]">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                    className="col-span-3 border-[#eadff6] text-[#2f243a]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right text-xs font-semibold text-[#5f5270]">Status</Label>
                  <Select
                    value={formData.isActive ? "true" : "false"}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, isActive: val === "true" }))}
                  >
                    <SelectTrigger className="col-span-3 border-[#eadff6] text-[#2f243a]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#eadff6]">
                      <SelectItem value="true" className="focus:bg-[#f8f1ff] focus:text-[#9065d5]">Active</SelectItem>
                      <SelectItem value="false" className="focus:bg-[#f8f1ff] focus:text-[#9065d5]">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-[#eadff6] hover:bg-[#f8f1ff]">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[#9065d5] hover:bg-[#7f55c7] text-white">
                  {submitting ? "Saving..." : "Save Rate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
