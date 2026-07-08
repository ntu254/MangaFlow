import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/features/admin/components";
import { adminAiService } from "@/features/admin/services/admin-ai.service";
import {
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
  Textarea,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  FileText,
  Gauge,
  Loader2,
  MoreHorizontal,
  Play,
  RefreshCw,
  RefreshCcw,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

function CostDisplay({ value }: { value: number }) {
  return <span className="font-mono text-sm">${value.toFixed(2)}</span>;
}

function ModeBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    Production: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    Canary: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    Experimental: "bg-purple-500/15 text-purple-500 border-purple-500/30",
    Fallback: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    Deprecated: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${styles[mode] ?? styles.Deprecated}`}>
      {mode}
    </span>
  );
}

function ProviderStatusIcon({ status }: { status: string }) {
  if (status === "Healthy") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "Rate Limited") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  if (status === "Degraded") return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

export default function AdminAiEngine() {
  const [search, setSearch] = useState("");
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ id: string; name: string; template: string; system_prompt: string } | null>(null);
  const [configuringModel, setConfiguringModel] = useState<{ id: string; name: string } | null>(null);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [deleteModelItem, setDeleteModelItem] = useState<{ id: string; name: string } | null>(null);
  const [deletePromptItem, setDeletePromptItem] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  const [promptForm, setPromptForm] = useState({ name: "", category: "outfit_generation", template: "", system_prompt: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ai"],
    queryFn: () => adminAiService.getData(),
  });

  const { data: modelLogs } = useQuery({
    queryKey: ["admin", "ai", "logs", viewingLogs],
    queryFn: () => adminAiService.getModelLogs(viewingLogs!),
    enabled: !!viewingLogs,
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => adminAiService.retryJob(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "ai"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ modelId, enable }: { modelId: string; enable: boolean }) =>
      adminAiService.toggleModel(modelId, enable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "ai"] }),
  });

  const createPromptMutation = useMutation({
    mutationFn: () => adminAiService.createPrompt(promptForm),
    onSuccess: () => {
      setShowNewPrompt(false);
      setPromptForm({ name: "", category: "outfit_generation", template: "", system_prompt: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "ai"] });
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: () => adminAiService.updatePrompt(editingPrompt!.id, {
      name: promptForm.name,
      template: promptForm.template,
      system_prompt: promptForm.system_prompt || undefined,
    }),
    onSuccess: () => {
      setEditingPrompt(null);
      setPromptForm({ name: "", category: "outfit_generation", template: "", system_prompt: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "ai"] });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => adminAiService.rollbackPrompt(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "ai"] }),
  });

  const deleteModelMutation = useMutation({
    mutationFn: () => adminAiService.deleteModel!(deleteModelItem!.id),
    onSuccess: () => {
      setDeleteModelItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "ai"] });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: () => adminAiService.deletePrompt!(deletePromptItem!.id),
    onSuccess: () => {
      setDeletePromptItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "ai"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-body">AI Engine</h1>
          <p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-3 w-20 bg-muted rounded mb-2" />
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filteredModels = data.models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.task.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">AI Engine</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage AI models, prompts, and monitor generation pipeline — cost, latency, and observability
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Active Models</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.modelsActive}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Brain className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Gen. Today</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.generationsToday.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Success Rate</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.successRate}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Failed Jobs</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.failedJobs}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Avg Latency</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.avgLatency}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium font-body">AI Cost Today</span>
          </div>
          <p className="text-2xl font-semibold font-body"><CostDisplay value={data.stats.aiCostToday} /></p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold font-body">AI Models</h3>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search models..."
              className="w-56 h-8 text-sm font-body"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Model</TableHead>
              <TableHead className="font-body">Provider</TableHead>
              <TableHead className="font-body">Task</TableHead>
              <TableHead className="font-body">Mode</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body text-right">Latency</TableHead>
              <TableHead className="font-body text-right">Requests</TableHead>
              <TableHead className="font-body text-right">Cost</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium font-body">{m.name}</TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{m.provider}</TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{m.task}</TableCell>
                <TableCell><ModeBadge mode={m.mode} /></TableCell>
                <TableCell>
                  <StatusBadge status={m.status === "Active" ? "Active" : "Inactive"} />
                </TableCell>
                <TableCell className="text-sm font-body text-right font-mono">{m.latency}</TableCell>
                <TableCell className="text-sm font-body text-right font-mono">{m.requests.toLocaleString()}</TableCell>
                <TableCell className="text-sm font-body text-right font-mono"><CostDisplay value={m.cost} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleMutation.mutate({ modelId: m.id, enable: m.status !== "Active" })}
                      >
                        <Play className="h-4 w-4 mr-2" /> {m.status === "Active" ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfiguringModel({ id: m.id, name: m.name })}>
                        <Cpu className="h-4 w-4 mr-2" /> Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewingLogs(m.id)}>
                        <Activity className="h-4 w-4 mr-2" /> View Logs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteModelItem({ id: m.id, name: m.name })}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Model
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold font-body">Prompt Templates</h3>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => {
              setPromptForm({ name: "", category: "outfit_generation", template: "", system_prompt: "" });
              setShowNewPrompt(true);
            }}>
              <FileText className="h-3.5 w-3.5" /> New Prompt
            </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Name</TableHead>
              <TableHead className="font-body">Task</TableHead>
              <TableHead className="font-body">Linked Model</TableHead>
              <TableHead className="font-body text-center">Version</TableHead>
              <TableHead className="font-body text-right">Traffic %</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body">Updated</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.templates.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm font-medium font-body">{p.name}</TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{p.task}</TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{p.linkedModel}</TableCell>
                <TableCell className="text-sm font-body text-center">v{p.version}</TableCell>
                <TableCell className="text-sm font-body text-right font-mono">{p.trafficPct}%</TableCell>
                <TableCell><StatusBadge status={p.status === "Active" ? "Active" : "Draft"} /></TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{p.updated}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setPromptForm({ name: p.name, category: p.task, template: "", system_prompt: "" });
                        setEditingPrompt({ id: p.id, name: p.name, template: "", system_prompt: "" });
                      }}>
                        <FileText className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => rollbackMutation.mutate(p.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Rollback
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeletePromptItem({ id: p.id, name: p.name })}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold font-body">Queue Health</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Queue</TableHead>
                <TableHead className="font-body text-right">Waiting</TableHead>
                <TableHead className="font-body text-right">Running</TableHead>
                <TableHead className="font-body text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.queues.map((q) => (
                <TableRow key={q.queue}>
                  <TableCell className="text-sm font-medium font-body">{q.queue}</TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">{q.waiting}</TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">
                    <span className="text-teal">{q.running}</span>
                  </TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">
                    <span className={q.failed > 0 ? "text-destructive" : ""}>{q.failed}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold font-body">Provider Health</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Provider</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body text-right">Error Rate</TableHead>
                <TableHead className="font-body text-right">Rate Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.providers.map((p) => (
                <TableRow key={p.provider}>
                  <TableCell className="text-sm font-medium font-body">{p.provider}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ProviderStatusIcon status={p.status} />
                      <span className="text-xs font-body">{p.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">{p.errorRate}</TableCell>
                  <TableCell className="text-sm font-body text-right font-mono">{p.rateLimit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold font-body">AI Safety</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-body">
                <Shield className="h-4 w-4 text-teal" />
                <span>Blocked Prompts</span>
              </div>
              <span className="text-sm font-mono font-semibold text-destructive">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-body">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Flagged Generations</span>
              </div>
              <span className="text-sm font-mono font-semibold text-amber-500">12</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-body">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span>Safety Hit Rate</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">0.4%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold font-body">Recent Jobs</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">User</TableHead>
              <TableHead className="font-body">Type</TableHead>
              <TableHead className="font-body">Model</TableHead>
              <TableHead className="font-body text-right">Duration</TableHead>
              <TableHead className="font-body text-right">Cost</TableHead>
              <TableHead className="font-body text-center">Retries</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body">Time</TableHead>
              <TableHead className="font-body w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="text-sm font-medium font-body">{j.user}</TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{j.type}</TableCell>
                <TableCell className="text-sm font-body font-mono text-muted-foreground">{j.model}</TableCell>
                <TableCell className="text-sm font-body text-right font-mono">{j.duration}</TableCell>
                <TableCell className="text-sm font-body text-right font-mono">
                  <span className={j.cost > 0.01 ? "text-yellow-500" : ""}>
                    {j.cost > 0 ? `$${j.cost.toFixed(4)}` : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm font-body text-center font-mono">
                  {j.retryCount > 0 ? (
                    <Badge variant="outline" className="text-[10px]">{j.retryCount}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  {j.status === "Success" ? (
                    <StatusBadge status="Active" />
                  ) : j.status === "Pending" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" /> Failed
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-body text-muted-foreground">{j.time}</TableCell>
                <TableCell>
                  {j.status === "Failed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7"
                      onClick={() => retryMutation.mutate(j.id)}
                    >
                      <RotateCcw className="h-3 w-3" /> Retry
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

      <Dialog open={!!deleteModelItem} onOpenChange={(v) => { if (!v) setDeleteModelItem(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription className="srOnly">Confirm model deletion</DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm font-body text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">{deleteModelItem?.name}</span>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModelItem(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteModelMutation.isPending} onClick={() => deleteModelMutation.mutate()}>
              {deleteModelMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePromptItem} onOpenChange={(v) => { if (!v) setDeletePromptItem(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription className="srOnly">Confirm prompt deletion</DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm font-body text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">{deletePromptItem?.name}</span>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletePromptItem(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deletePromptMutation.isPending} onClick={() => deletePromptMutation.mutate()}>
              {deletePromptMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPrompt} onOpenChange={setShowNewPrompt}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Prompt Template</DialogTitle>
            <DialogDescription className="srOnly">Create a new AI prompt template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">Name</Label>
              <Input value={promptForm.name} onChange={(e) => setPromptForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Outfit Generator v2" className="font-body text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">Category</Label>
              <select value={promptForm.category} onChange={(e) => setPromptForm(p => ({ ...p, category: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-border bg-background font-body text-sm">
                <option value="outfit_generation">Outfit Generation</option>
                <option value="style_analysis">Style Analysis</option>
                <option value="trend_analysis">Trend Analysis</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">Template (use {'{{placeholders}}'})</Label>
              <Textarea value={promptForm.template} onChange={(e) => setPromptForm(p => ({ ...p, template: e.target.value }))} placeholder="Generate an outfit for {{occasion}}..." rows={4} className="font-body text-sm resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">System Prompt (optional)</Label>
              <Textarea value={promptForm.system_prompt} onChange={(e) => setPromptForm(p => ({ ...p, system_prompt: e.target.value }))} placeholder="You are a fashion stylist..." rows={3} className="font-body text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowNewPrompt(false)}>Cancel</Button>
            <Button variant="accent" size="sm" disabled={createPromptMutation.isPending || !promptForm.name || !promptForm.template} onClick={() => createPromptMutation.mutate()}>
              {createPromptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPrompt} onOpenChange={(v) => { if (!v) setEditingPrompt(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt: {editingPrompt?.name}</DialogTitle>
            <DialogDescription className="srOnly">Edit prompt template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">Name</Label>
              <Input value={promptForm.name} onChange={(e) => setPromptForm(p => ({ ...p, name: e.target.value }))} className="font-body text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">Template</Label>
              <Textarea value={promptForm.template} onChange={(e) => setPromptForm(p => ({ ...p, template: e.target.value }))} rows={4} className="font-body text-sm resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body font-semibold">System Prompt</Label>
              <Textarea value={promptForm.system_prompt} onChange={(e) => setPromptForm(p => ({ ...p, system_prompt: e.target.value }))} rows={3} className="font-body text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingPrompt(null)}>Cancel</Button>
            <Button variant="accent" size="sm" disabled={updatePromptMutation.isPending} onClick={() => updatePromptMutation.mutate()}>
              {updatePromptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!configuringModel} onOpenChange={(v) => { if (!v) setConfiguringModel(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Configure: {configuringModel?.name}</DialogTitle>
            <DialogDescription className="srOnly">AI model configuration</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm font-body text-muted-foreground">
            Model configuration panel — API keys, rate limits, and provider settings can be managed here.
            <div className="mt-4 p-3 bg-secondary/40 border border-border text-xs">
              Config options coming soon. Use AI Provider Configs tab for detailed settings.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfiguringModel(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingLogs} onOpenChange={(v) => { if (!v) setViewingLogs(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generation Logs</DialogTitle>
            <DialogDescription className="srOnly">AI model generation logs</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {modelLogs?.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-8">No logs found</p>}
            {modelLogs?.map((log) => (
              <div key={log.id} className="p-3 bg-secondary/40 border border-border text-xs font-body">
                <div className="flex items-center justify-between mb-1">
                  <span className={log.success ? "text-teal" : "text-destructive"}>{log.success ? "Success" : "Failed"}</span>
                  <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.latency_ms && <div className="text-muted-foreground">Latency: {log.latency_ms}ms</div>}
                {log.tokens_prompt && <div className="text-muted-foreground">Tokens: {log.tokens_prompt} prompt / {log.tokens_completion} completion</div>}
                {log.error_message && <div className="text-destructive mt-1">{log.error_message}</div>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewingLogs(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
