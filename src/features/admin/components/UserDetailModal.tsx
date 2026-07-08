import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, ScrollArea } from "@/shared/ui";
import { adminUsersService } from "@/features/admin/services/admin-users.service";
import { useQuery } from "@tanstack/react-query";
import { Ban, CheckCircle2, X } from "lucide-react";

interface Props {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ userId, open, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminUsersService.getUserDetail(userId!),
    enabled: !!userId && open,
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogDescription className="srOnly">View user details</DialogDescription>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold font-body">User Details</DialogTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <ScrollArea className="max-h-[calc(85vh-64px)]">
            <div className="p-6 pt-4 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground">
                  {data.profile.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold font-body text-foreground">{data.profile.name}</h2>
                    {data.profile.is_banned ? (
                      <Badge variant="destructive" className="text-[10px] h-5">Banned</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] h-5 bg-green-600">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-body">{data.profile.email}</p>
                  <p className="text-xs text-muted-foreground font-body font-mono mt-0.5">ID: {data.profile.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-3">Subscription</h4>
                  {data.subscription ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground font-body">Plan</span>
                        <span className="text-sm font-medium text-foreground font-body">{data.subscription.plan_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground font-body">Status</span>
                        <Badge variant={data.subscription.status === "active" ? "default" : "secondary"} className="text-[10px] h-5">{data.subscription.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground font-body">Billing</span>
                        <span className="text-sm text-foreground font-body">{data.subscription.billing_cycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground font-body">Period end</span>
                        <span className="text-sm text-foreground font-body">{new Date(data.subscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground font-body">No active subscription</p>
                  )}
                </div>

                <div className="bg-muted/40 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-3">Credits</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground font-body">Balance</span>
                      <span className="text-sm font-semibold text-foreground font-body">{data.credits.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground font-body">Earned</span>
                      <span className="text-sm text-foreground font-body">{data.credits.lifetime_earned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground font-body">Spent</span>
                      <span className="text-sm text-foreground font-body">{data.credits.lifetime_spent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-3">AI Usage</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground font-body">{data.ai_usage.total_jobs}</p>
                    <p className="text-xs text-muted-foreground font-body">Total Jobs</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600 font-body">{data.ai_usage.successful}</p>
                    <p className="text-xs text-muted-foreground font-body">Successful</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-500 font-body">{data.ai_usage.failed}</p>
                    <p className="text-xs text-muted-foreground font-body">Failed</p>
                  </div>
                </div>
                {data.ai_usage.recent_jobs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 font-body">Recent Jobs</p>
                    <div className="space-y-1.5">
                      {data.ai_usage.recent_jobs.map((j) => (
                        <div key={j.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {j.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Ban className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-foreground font-body">{j.job_type.replace("_", " ")}</span>
                          </div>
                          <span className="text-muted-foreground font-body">{new Date(j.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/40 rounded-lg p-4 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body mb-3">Credit History</h4>
                <div className="space-y-1.5">
                  {data.credits.recent_transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium font-body ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {t.amount > 0 ? "+" : ""}{t.amount}
                        </span>
                        <span className="text-muted-foreground font-body">{t.description}</span>
                      </div>
                      <span className="text-muted-foreground font-body">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {data.profile.ban_reason && (
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider font-body mb-1">Ban Reason</h4>
                  <p className="text-sm text-red-600 font-body">{data.profile.ban_reason}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
