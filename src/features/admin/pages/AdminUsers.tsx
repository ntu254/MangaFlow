import { UserDetailModal } from "@/features/admin/components";
import { StatusBadge } from "@/features/admin/components";
import { adminUsersService } from "@/features/admin/services/admin-users.service";
import { supabase } from "@/shared/lib/supabase";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Coins,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldX,
  UserPlus,
  UserCog,
} from "lucide-react";
import { useState } from "react";

type Filter =
  | "all"
  | "active"
  | "inactive"
  | "banned"
  | "free"
  | "premium"
  | "pro"
  | "heavy_users"
  | "high_ai_usage"
  | "no_activity"
  | "trial_ending"
  | "credit_exhausted";

type DialogMode =
  | { type: null }
  | { type: "user_detail"; userId: string }
  | { type: "adjust_credits"; userId: string }
  | { type: "ai_activity"; userId: string; name: string; ai_generations: number }
  | { type: "billing"; userId: string; name: string; plan: string }
  | { type: "change_plan"; userId: string; name: string; plan: string }
  | { type: "prompts"; userId: string; name: string }
  | { type: "new_user" };

export default function AdminUsers() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogMode>({ type: null });
  const [creditAmount, setCreditAmount] = useState(0);
  const [newUserForm, setNewUserForm] = useState({ email: "", password: "", display_name: "", plan: "Free" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminUsersService.listUsers(),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminUsersService.suspendUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => adminUsersService.unsuspendUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: () => adminUsersService.adjustCredits((dialog as { type: "adjust_credits"; userId: string }).userId, creditAmount),
    onSuccess: () => {
      setDialog({ type: null });
      setCreditAmount(0);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: () => adminUsersService.createUser(newUserForm),
    onSuccess: () => {
      setDialog({ type: null });
      setNewUserForm({ email: "", password: "", display_name: "", plan: "Free" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, planName }: { userId: string; planName: string }) => {
      const { data: plan } = await supabase.from("plans").select("id").eq("name", planName).maybeSingle();
      if (!plan) throw new Error("Plan not found");
      const { data: existing } = await supabase.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        await supabase.from("subscriptions").update({ plan_id: plan.id, status: "active" }).eq("id", existing.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: userId, plan_id: plan.id, status: "active",
          billing_cycle: "monthly",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }
    },
    onSuccess: () => {
      setDialog({ type: null });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("name").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  const users = data?.users ?? [];

  const filtered = users.filter((u) => {
    if (filter === "active" && u.status !== "Active") return false;
    if (filter === "inactive" && u.status !== "Inactive") return false;
    if (filter === "banned" && !u.is_banned) return false;
    if (filter === "free" && u.plan !== "Free") return false;
    if (filter === "premium" && u.plan !== "Premium") return false;
    if (filter === "pro" && u.plan !== "Pro") return false;
    if (filter === "heavy_users" && u.ai_generations < 100) return false;
    if (filter === "high_ai_usage" && !u.high_ai_usage) return false;
    if (filter === "credit_exhausted" && u.credits_balance > 0) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Banned", value: "banned" },
    { label: "Free", value: "free" },
    { label: "Premium", value: "premium" },
    { label: "Pro", value: "pro" },
    { label: "High AI Usage", value: "high_ai_usage" },
    { label: "Heavy Users", value: "heavy_users" },
    { label: "Credit Exhausted", value: "credit_exhausted" },
  ];

  const formatActive = (date: string | null) => {
    if (!date) return "N/A";
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date;
  };

  return (
    <>
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Users</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage user accounts, AI usage, and retention</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 h-9 text-sm font-body"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setDialog({ type: "new_user" }); setNewUserForm({ email: "", password: "", display_name: "", plan: "Free" }); }}>
            <UserPlus className="h-3.5 w-3.5" /> New User
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">User</TableHead>
              <TableHead className="font-body">Plan</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body text-right">Credits</TableHead>
              <TableHead className="font-body text-right">AI Generations</TableHead>
              <TableHead className="font-body">Last Active</TableHead>
              <TableHead className="font-body text-right">Revenue</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-3 w-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground font-body">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium font-body truncate">{u.name}</span>
                          {u.is_banned && <Badge variant="destructive" className="text-[9px] h-4 px-1">Banned</Badge>}
                          {u.high_ai_usage && (
                            <Badge variant="default" className="text-[9px] h-4 px-1 bg-amber-600 hover:bg-amber-600">
                              <AlertTriangle className="h-3 w-3 mr-0.5" /> High AI
                            </Badge>
                          )}
                          {u.suspicious && (
                            <Badge variant="default" className="text-[9px] h-4 px-1 bg-red-700 hover:bg-red-700">
                              <ShieldX className="h-3 w-3 mr-0.5" /> Suspicious
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-body truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={u.plan} /></TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">{u.credits_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">
                    <span className={u.high_ai_usage ? "text-amber-500 font-semibold" : ""}>
                      {u.ai_generations}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{formatActive(u.last_active)}</TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">
                    {u.revenue > 0 ? `$${u.revenue}` : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setDialog({ type: "user_detail", userId: u.id })}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ type: "ai_activity", userId: u.id, name: u.name, ai_generations: u.ai_generations })}>
                          <Activity className="h-4 w-4 mr-2" />
                          View AI Activity
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setDialog({ type: "adjust_credits", userId: u.id }); setCreditAmount(0); }}>
                          <Coins className="h-4 w-4 mr-2" />
                          Adjust Credits
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ type: "billing", userId: u.id, name: u.name, plan: u.plan })}>
                          <Banknote className="h-4 w-4 mr-2" />
                          View Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ type: "change_plan", userId: u.id, name: u.name, plan: u.plan })}>
                          <UserCog className="h-4 w-4 mr-2" />
                          Change Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ type: "prompts", userId: u.id, name: u.name })}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Prompts
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.is_banned ? (
                          <DropdownMenuItem onClick={() => unsuspendMutation.mutate(u.id)}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Reinstate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => suspendMutation.mutate(u.id)}>
                            <ShieldX className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserDetailModal
        userId={dialog.type === "user_detail" ? dialog.userId : null}
        open={dialog.type === "user_detail"}
        onClose={() => setDialog({ type: null })}
      />

      <Dialog open={dialog.type === "adjust_credits"} onOpenChange={(v) => { if (!v) { setDialog({ type: null }); setCreditAmount(0); } }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription className="srOnly">Manually adjust user credit balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-body text-foreground">Amount (positive to add, negative to deduct)</label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                className="h-9 font-mono"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => adjustCreditsMutation.mutate()}
              disabled={adjustCreditsMutation.isPending || creditAmount === 0}
            >
              {adjustCreditsMutation.isPending ? "Saving..." : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "ai_activity"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Activity: {dialog.type === "ai_activity" ? dialog.name : ""}</DialogTitle>
            <DialogDescription className="srOnly">View user AI generation activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/40 rounded-lg p-4 border border-border text-center">
                <p className="text-2xl font-semibold font-body">{dialog.type === "ai_activity" ? dialog.ai_generations : 0}</p>
                <p className="text-xs text-muted-foreground font-body">Total Generations</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-4 border border-border text-center">
                <p className="text-2xl font-semibold font-body text-teal">92%</p>
                <p className="text-xs text-muted-foreground font-body">Success Rate</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase font-body">Recent Activity</h4>
              {["Outfit Generation", "Style Analysis", "Trend Analysis"].map((t, i) => (
                <div key={t} className="flex items-center justify-between text-sm">
                  <span className="font-body">{t}</span>
                  <span className="text-muted-foreground font-body font-mono">{[24, 8, 3][i]} times</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "billing"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Billing: {dialog.type === "billing" ? dialog.name : ""}</DialogTitle>
            <DialogDescription className="srOnly">View user billing history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg">
              <span className="text-sm font-body">Current Plan</span>
              <span className="text-sm font-semibold font-body">{dialog.type === "billing" ? dialog.plan : ""}</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase font-body">Recent Payments</h4>
              {[{ amount: "$29", date: "May 15, 2026", method: "Credit Card", status: "Paid" }].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg text-sm">
                  <div>
                    <p className="font-medium font-body">{p.amount}</p>
                    <p className="text-xs text-muted-foreground font-body">{p.date} via {p.method}</p>
                  </div>
                  <span className="text-xs text-teal font-medium font-body">{p.status}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground font-body text-center pt-2">View full billing history in the payments dashboard.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "change_plan"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Plan: {dialog.type === "change_plan" ? dialog.name : ""}</DialogTitle>
            <DialogDescription className="srOnly">Change user subscription plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-body text-muted-foreground">Current plan: <span className="font-medium text-foreground">{dialog.type === "change_plan" ? dialog.plan : ""}</span></p>
            <div className="grid gap-3">
              {(plans.length > 0 ? plans.map((p) => p.name) : ["Free", "Premium", "Pro"]).map((plan) => (
                <div
                  key={plan}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors text-sm ${
                    dialog.type === "change_plan" && dialog.plan === plan
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    if (dialog.type === "change_plan" && dialog.plan !== plan) {
                      changePlanMutation.mutate({ userId: dialog.userId, planName: plan });
                    }
                  }}
                >
                  <div>
                    <p className="font-medium font-body">{plan}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {plan === "Free" ? "Basic access" : plan === "Premium" ? "AI features + 200 credits/mo" : "Unlimited AI + priority"}
                    </p>
                  </div>
                  {dialog.type === "change_plan" && dialog.plan === plan && <span className="text-primary text-xs font-medium font-body">Current</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-body text-center">Plan change will take effect immediately. Billing will be prorated.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "prompts"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recent Prompts: {dialog.type === "prompts" ? dialog.name : ""}</DialogTitle>
            <DialogDescription className="srOnly">View user prompt history</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { prompt: "Generate a summer outfit for a beach wedding", time: "2 hours ago", status: "Success" },
              { prompt: "Style analysis for my wardrobe", time: "1 day ago", status: "Success" },
              { prompt: "Trend-forecast for fall 2026", time: "3 days ago", status: "Failed" },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-muted/40 border border-border rounded-lg text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body text-foreground flex-1 truncate">{p.prompt}</p>
                  <span className={`text-xs font-medium shrink-0 ${p.status === "Success" ? "text-teal" : "text-destructive"}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1">{p.time}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "new_user"} onOpenChange={(v) => { if (!v) { setDialog({ type: null }); setNewUserForm({ email: "", password: "", display_name: "", plan: "Free" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription className="srOnly">Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs font-body text-foreground text-right">Email *</Label>
              <Input value={newUserForm.email} onChange={(e) => setNewUserForm(f => ({ ...f, email: e.target.value }))} placeholder="user@email.com" className="h-9 font-body text-sm" />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs font-body text-foreground text-right">Password *</Label>
              <Input value={newUserForm.password} onChange={(e) => setNewUserForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder="Min 6 characters" className="h-9 font-body text-sm" />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs font-body text-foreground text-right">Display Name</Label>
              <Input value={newUserForm.display_name} onChange={(e) => setNewUserForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Optional" className="h-9 font-body text-sm" />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs font-body text-foreground text-right">Plan</Label>
              <select value={newUserForm.plan} onChange={(e) => setNewUserForm(f => ({ ...f, plan: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-border bg-background font-body text-sm">
                <option value="Free">Free</option>
                <option value="Premium">Premium</option>
                <option value="Pro">Pro</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground font-body">User will receive a welcome email with login instructions.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDialog({ type: null }); setNewUserForm({ email: "", password: "", display_name: "", plan: "Free" }); }}>Cancel</Button>
            <Button size="sm" disabled={createUserMutation.isPending || !newUserForm.email || !newUserForm.password} onClick={() => createUserMutation.mutate()}>
              {createUserMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
