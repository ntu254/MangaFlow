import { StatusBadge } from "@/features/admin/components";
import { adminFeedbackService } from "@/features/admin/services/admin-feedback.service";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

type StatusFilter = "all" | "new" | "in review" | "resolved";

const priorityColors: Record<string, string> = {
  High: "text-destructive",
  Medium: "text-amber-600",
  Low: "text-muted-foreground",
};

export default function AdminFeedback() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [detailReport, setDetailReport] = useState<{ id: string; type: string; user: string; detail: string; priority: string; status: string; date: string } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: () => adminFeedbackService.getData(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
      adminFeedbackService.updateStatus(reportId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });

  const escalateMutation = useMutation({
    mutationFn: (reportId: string) => adminFeedbackService.escalate(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });

  const reports = data?.reports ?? [];

  const filtered = reports.filter((r) => {
    if (filter !== "all" && r.status.toLowerCase() !== filter) return false;
    if (search && !r.type.toLowerCase().includes(search.toLowerCase()) && !r.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "New", value: "new" },
    { label: "In Review", value: "in review" },
    { label: "Resolved", value: "resolved" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div><h1 className="text-2xl font-semibold text-foreground font-body">Feedback & Reports</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p></div>
        <div className="bg-card border border-border rounded-lg p-12 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Feedback & Reports</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">{data?.total ?? 0} total reports</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)} className="text-xs">{f.label}</Button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-9 h-9 text-sm font-body" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Type</TableHead>
              <TableHead className="font-body">User</TableHead>
              <TableHead className="font-body">Priority</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body">Date</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground font-body">No reports found</TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium font-body">{r.type}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5 truncate max-w-xs">{r.detail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-body">{r.user}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-semibold font-body ${priorityColors[r.priority]}`}>{r.priority}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{r.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailReport({ id: r.id, type: r.type, user: r.user, detail: r.detail, priority: r.priority, status: r.status, date: r.date })}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                        {r.status !== "In Review" && (
                          <DropdownMenuItem onClick={() => statusMutation.mutate({ reportId: r.id, status: "In Review" })}>
                            <Clock className="h-4 w-4 mr-2" /> Mark In Review
                          </DropdownMenuItem>
                        )}
                        {r.status !== "Resolved" && (
                          <DropdownMenuItem onClick={() => statusMutation.mutate({ reportId: r.id, status: "Resolved" })}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => escalateMutation.mutate(r.id)}>
                          <AlertCircle className="h-4 w-4 mr-2" /> Escalate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detailReport} onOpenChange={(v) => { if (!v) setDetailReport(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold font-body">Report Details</DialogTitle>
              
            </div>
            <DialogDescription className="srOnly">View report details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm font-body">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Type:</span><p className="text-foreground font-medium">{detailReport?.type}</p></div>
              <div><span className="text-muted-foreground">User:</span><p className="text-foreground font-medium">{detailReport?.user}</p></div>
              <div><span className="text-muted-foreground">Priority:</span><p className="text-foreground font-medium">{detailReport?.priority}</p></div>
              <div><span className="text-muted-foreground">Status:</span><p className="text-foreground font-medium">{detailReport?.status}</p></div>
              <div><span className="text-muted-foreground">Date:</span><p className="text-foreground font-medium">{detailReport?.date}</p></div>
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground text-xs">Description:</span>
              <p className="text-foreground mt-1">{detailReport?.detail}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
