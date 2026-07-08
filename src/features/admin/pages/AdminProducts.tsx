import { StatusBadge } from "@/features/admin/components";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import { cn } from "@/lib/utils";
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
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  EyeOff,
  Link2,
  Link2Off,
  Loader2,
  MoreHorizontal,
  MousePointerClick,
  Package,
  Search,
  Star,
  Unlink,
  X,
} from "lucide-react";
import { useState } from "react";

const platformColors: Record<string, string> = {
  Shopee: "bg-[#EE4D2D]",
  "TikTok Shop": "bg-[#FF0050]",
};

type PlatformFilter = "all" | "Shopee" | "TikTok Shop";

type DialogMode =
  | { type: null }
  | { type: "clicks"; productId: string }
  | { type: "link"; productId: string; title: string }
  | { type: "delete"; productId: string; title: string };

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [dialog, setDialog] = useState<DialogMode>({ type: null });
  const [linkUrl, setLinkUrl] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminProductsService.getData(),
  });

  const clicksProductId = dialog.type === "clicks" ? (dialog as any).productId : null;

  const { data: clickData } = useQuery({
    queryKey: ["admin", "products", "clicks", clicksProductId],
    queryFn: () => adminProductsService.getClicks(clicksProductId!),
    enabled: !!clicksProductId,
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (productId: string) => adminProductsService.toggleFeatured(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ productId, hidden }: { productId: string; hidden: boolean }) =>
      adminProductsService.toggleVisibility(productId, hidden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const updateLinkMutation = useMutation({
    mutationFn: () => adminProductsService.updateLink((dialog as { type: "link"; productId: string }).productId, linkUrl),
    onSuccess: () => {
      setDialog({ type: null });
      setLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: () => adminProductsService.deleteProduct!((dialog as { type: "delete"; productId: string }).productId),
    onSuccess: () => {
      setDialog({ type: null });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const products = data?.products ?? [];
  const stats = data?.stats;

  const filtered = products.filter((p) => {
    if (platform !== "all" && p.platform !== platform) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const platforms: PlatformFilter[] = ["all", "Shopee", "TikTok Shop"];

  const selectedProduct = products.find((p) => p.id === clicksProductId);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Products & Platforms</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage product feeds and affiliate links</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-accent mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium font-body">Total Products</span>
            </div>
            <p className="text-2xl font-semibold font-body">{stats.totalProducts}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-teal mb-1">
              <Link2 className="h-4 w-4" />
              <span className="text-xs font-medium font-body">Active Affiliates</span>
            </div>
            <p className="text-2xl font-semibold font-body">{stats.activeAffiliates}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <Unlink className="h-4 w-4" />
              <span className="text-xs font-medium font-body">Broken Links</span>
            </div>
            <p className="text-2xl font-semibold font-body">{stats.brokenLinks}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs font-medium font-body">Total Clicks</span>
            </div>
            <p className="text-2xl font-semibold font-body">{stats.totalClicks.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {platforms.map((p) => (
            <Button
              key={p}
              variant={platform === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(p)}
              className="text-xs capitalize"
            >
              {p === "all" ? "All Platforms" : p}
            </Button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9 h-9 text-sm font-body"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Product</TableHead>
              <TableHead className="font-body">Platform</TableHead>
              <TableHead className="font-body">Category</TableHead>
              <TableHead className="font-body">Affiliate</TableHead>
              <TableHead className="font-body">Link Health</TableHead>
              <TableHead className="font-body text-right">Clicks</TableHead>
              <TableHead className="font-body text-right">Commission</TableHead>
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
                <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground font-body">No products found</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-body">{p.title}</span>
                      {p.featured && <Star className="h-3.5 w-3.5 text-accent fill-accent" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white", platformColors[p.platform])}>
                      {p.platform}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{p.category}</TableCell>
                  <TableCell><StatusBadge status={p.affiliate} /></TableCell>
                  <TableCell>
                    {p.linkHealth === "Broken" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        <Unlink className="h-3 w-3" /> Broken
                      </span>
                    ) : (
                      <StatusBadge status="Active" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-body text-right">{p.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-body text-right">
                    <span className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {p.commission.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDialog({ type: "clicks", productId: p.id })}>
                          <MousePointerClick className="h-4 w-4 mr-2" /> View Clicks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setDialog({ type: "link", productId: p.id, title: p.title });
                          setLinkUrl("");
                        }}>
                          <Link2 className="h-4 w-4 mr-2" /> Update Link
                        </DropdownMenuItem>
                        {p.linkHealth === "Broken" ? (
                          <DropdownMenuItem
                            onClick={() => toggleVisibilityMutation.mutate({ productId: p.id, hidden: true })}
                          >
                            <EyeOff className="h-4 w-4 mr-2" /> Hide Product
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => toggleFeaturedMutation.mutate(p.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          {p.featured ? "Unmark Featured" : "Mark Featured"}
                        </DropdownMenuItem>
                        {p.linkHealth === "Broken" ? (
                          <DropdownMenuItem onClick={() => {
                            setDialog({ type: "link", productId: p.id, title: p.title });
                            setLinkUrl("");
                          }}>
                            <Link2Off className="h-4 w-4 mr-2" /> Fix Affiliate Link
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDialog({ type: "delete", productId: p.id, title: p.title })}>
                          <X className="h-4 w-4 mr-2" /> Delete Product
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

      <Dialog open={dialog.type === "delete"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="srOnly">Confirm product deletion</DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm font-body text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">{dialog.type === "delete" ? (dialog as any).title : ""}</span>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialog({ type: null })}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteProductMutation.isPending} onClick={() => deleteProductMutation.mutate()}>
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "link"} onOpenChange={(v) => { if (!v) { setDialog({ type: null }); setLinkUrl(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Affiliate Link</DialogTitle>
            <DialogDescription className="srOnly">Update affiliate link for {dialog.type === "link" ? (dialog as any).title : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-body text-muted-foreground">Product: <span className="text-foreground font-medium">{dialog.type === "link" ? (dialog as any).title : ""}</span></p>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Affiliate URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-9 font-body text-sm" />
            </div>
            <Button className="w-full" onClick={() => updateLinkMutation.mutate()} disabled={updateLinkMutation.isPending || !linkUrl}>
              {updateLinkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Update Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "clicks"} onOpenChange={(v) => { if (!v) setDialog({ type: null }); }}>
        <DialogContent className="max-w-lg max-h-[70vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-base font-semibold font-body">
              Clicks — {selectedProduct?.title ?? ""}
            </DialogTitle>
            <DialogDescription className="srOnly">View product click details</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(70vh-80px)]">
            <div className="p-6 pt-4">
              {!clickData || clickData.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body py-8 text-center">No click data available</p>
              ) : (
                <div className="space-y-3">
                  {clickData.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground font-body">{c.user}</p>
                        <p className="text-xs text-muted-foreground font-body">via {c.source}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px]">{c.platform}</Badge>
                        <p className="text-xs text-muted-foreground mt-1 font-body">{new Date(c.clicked_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}


