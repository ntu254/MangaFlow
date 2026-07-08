import { StatusBadge } from "@/features/admin/components";
import { adminTrendsService } from "@/features/admin/services/admin-trends.service";
import { cn } from "@/lib/utils";
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  ChartLine,
  Edit,
  Eye,
  EyeOff,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  Seasonal: "bg-rose-500",
  Style: "bg-violet-500",
  Lifestyle: "bg-teal-500",
  Street: "bg-orange-500",
  Premium: "bg-amber-500",
  Color: "bg-blue-500",
  Accessories: "bg-pink-500",
};

export default function AdminTrends() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrend, setEditTrend] = useState<{ id: string; title: string; category: string; season: string; description: string; growthPct: string } | null>(null);
  const [form, setForm] = useState({ title: "", category: "", season: "", description: "", growthPct: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "trends"],
    queryFn: () => adminTrendsService.getData(),
  });

  const toggleMutation = useMutation({
    mutationFn: (trendId: string) => adminTrendsService.togglePublish(trendId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "trends"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (trendId: string) => adminTrendsService.deleteTrend(trendId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "trends"] }),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminTrendsService.updateTrend(editTrend!.id, {
      title: form.title || undefined,
      category: form.category || undefined,
      season: form.season || undefined,
      description: form.description || undefined,
      growth_pct: form.growthPct ? Number(form.growthPct) : undefined,
    }),
    onSuccess: () => {
      setEditTrend(null);
      setForm({ title: "", category: "", season: "", description: "", growthPct: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "trends"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminTrendsService.createTrend({
        title: form.title,
        category: form.category,
        season: form.season,
        description: form.description || undefined,
        growthPct: form.growthPct ? Number(form.growthPct) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trends"] });
      setCreateOpen(false);
      setForm({ title: "", category: "", season: "", description: "", growthPct: "" });
    },
  });

  const trends = data?.trends ?? [];
  const filtered = trends.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold text-foreground font-body">Trends & Lookbook</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p></div></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse"><div className="h-3 w-20 bg-muted rounded mb-2" /><div className="h-6 w-12 bg-muted rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-body">Trends & Lookbook</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Manage trend articles and lookbook entries</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Trend
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-accent mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Total Trends</span>
          </div>
          <p className="text-2xl font-semibold font-body">{trends.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Published</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.published}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <EyeOff className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Drafts</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.drafts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <ChartLine className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Avg. Growth</span>
          </div>
          <p className="text-2xl font-semibold font-body">
            {trends.filter((t) => t.growthPct).length > 0
              ? Math.round(trends.reduce((a, t) => a + (t.growthPct || 0), 0) / trends.filter((t) => t.growthPct).length) + "%"
              : "—"}
          </p>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search trends..."
          className="pl-9 h-9 text-sm font-body"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body w-10"></TableHead>
              <TableHead className="font-body">Title</TableHead>
              <TableHead className="font-body">Category</TableHead>
              <TableHead className="font-body">Season</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body text-right">Growth</TableHead>
              <TableHead className="font-body">Date</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground font-body">No trends found</TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold", categoryColors[t.category] || "bg-muted-foreground")}>
                      {t.title[0]}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium font-body">{t.title}</TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{t.category}</TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{t.season}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-sm font-body text-right">
                    {t.growthPct != null ? (
                      <span className="text-teal font-medium">+{t.growthPct}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setForm({ title: t.title, category: t.category, season: t.season, description: "", growthPct: t.growthPct?.toString() ?? "" });
                          setEditTrend({ id: t.id, title: t.title, category: t.category, season: t.season, description: "", growthPct: t.growthPct?.toString() ?? "" });
                        }}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMutation.mutate(t.id)}>
                          {t.status === "Published" ? <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</> : <><Eye className="h-4 w-4 mr-2" /> Publish</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) setCreateOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogDescription className="srOnly">Create a new fashion trend</DialogDescription>
            <DialogTitle className="text-base font-semibold font-body">New Trend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Spring Pastel Revival" className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Seasonal", "Style", "Lifestyle", "Street", "Premium", "Color", "Accessories"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Spring 2026", "Summer 2026", "Fall 2026", "Winter 2026", "All Year"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief trend description" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Growth (%)</Label>
              <Input value={form.growthPct} onChange={(e) => setForm({ ...form, growthPct: e.target.value })} placeholder="e.g. 42" type="number" className="h-9 w-32" />
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.title || !form.category || !form.season}>
              Create Trend
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTrend} onOpenChange={(v) => { if (!v) { setEditTrend(null); setForm({ title: "", category: "", season: "", description: "", growthPct: "" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogDescription className="srOnly">Edit fashion trend</DialogDescription>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold font-body">Edit: {editTrend?.title}</DialogTitle>
              
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Seasonal", "Style", "Lifestyle", "Street", "Premium", "Color", "Accessories"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Spring 2026", "Summer 2026", "Fall 2026", "Winter 2026", "All Year"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Growth (%)</Label>
              <Input value={form.growthPct} onChange={(e) => setForm({ ...form, growthPct: e.target.value })} type="number" className="h-9 w-32" />
            </div>
            <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
