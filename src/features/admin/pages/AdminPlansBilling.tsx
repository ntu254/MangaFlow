import { StatusBadge } from "@/features/admin/components";
import { adminPlansService } from "@/features/admin/services/admin-plans.service";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function AdminPlansBilling() {
  const [search, setSearch] = useState("");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editPlan, setEditPlan] = useState<{ id: string; name: string; price_monthly: number } | null>(null);
  const [viewPlanSubs, setViewPlanSubs] = useState<{ id: string; name: string; users: number } | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", slug: "", price_monthly: 0, ai_generations_limit: 10, wardrobe_limit: 50, saved_outfits_limit: 20 });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => adminPlansService.getData(),
  });

  const toggleMutation = useMutation({
    mutationFn: (planId: string) => adminPlansService.togglePlanStatus(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });

  const createPlanMutation = useMutation({
    mutationFn: () => adminPlansService.createPlan(planForm),
    onSuccess: () => {
      setShowNewPlan(false);
      setPlanForm({ name: "", slug: "", price_monthly: 0, ai_generations_limit: 10, wardrobe_limit: 50, saved_outfits_limit: 20 });
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: () => adminPlansService.updatePlan(editPlan!.id, { name: planForm.name, price_monthly: planForm.price_monthly }),
    onSuccess: () => {
      setEditPlan(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div><h1 className="text-2xl font-semibold text-foreground font-body">Gói & Thanh Toán</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Đang tải...</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse"><div className="h-3 w-24 bg-muted rounded mb-2" /><div className="h-6 w-16 bg-muted rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filtered = (data.transactions ?? []).filter(
    (t) => !search || t.user.toLowerCase().includes(search.toLowerCase()) || t.plan.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Gói & Thanh Toán</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Quản lý gói đăng ký, giá cả và lịch sử giao dịch thanh toán
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Doanh thu tháng</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.monthlyRevenue}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Người dùng trả phí</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.payingUsers.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium font-body">DT trung bình/người</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.avgRevenuePerUser}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium font-body">Tỷ lệ chuyển đổi</span>
          </div>
          <p className="text-2xl font-semibold font-body">{data.stats.conversionRate}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold font-body">Các gói đăng ký</h3>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => {
            setPlanForm({ name: "", slug: "", price_monthly: 0, ai_generations_limit: 10, wardrobe_limit: 50, saved_outfits_limit: 20 });
            setShowNewPlan(true);
          }}>
            <DollarSign className="h-3.5 w-3.5" /> Tạo gói mới
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Tên gói</TableHead>
              <TableHead className="font-body text-right">Giá</TableHead>
              <TableHead className="font-body text-right">Người dùng</TableHead>
              <TableHead className="font-body text-right">Doanh thu</TableHead>
              <TableHead className="font-body text-right">Credits AI</TableHead>
              <TableHead className="font-body">Trạng thái</TableHead>
              <TableHead className="font-body w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm font-medium font-body">{p.name}</TableCell>
                <TableCell className="text-sm font-body text-right">{p.price}</TableCell>
                <TableCell className="text-sm font-body text-right">{p.users.toLocaleString()}</TableCell>
                <TableCell className="text-sm font-body text-right">{p.revenue}</TableCell>
                <TableCell className="text-sm font-body text-right">{p.credits === -1 ? "∞" : p.credits}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const price = Number(p.price.replace(/[^0-9.]/g, ""));
                        setPlanForm({ name: p.name, slug: p.name.toLowerCase().replace(/\s+/g, "-"), price_monthly: price || 0, ai_generations_limit: p.credits, wardrobe_limit: 50, saved_outfits_limit: 20 });
                        setEditPlan({ id: p.id, name: p.name, price_monthly: price || 0 });
                      }}>
                        <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa gói
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleMutation.mutate(p.id)}>
                        {p.status === "Active" || p.status === "Hoạt động"
                          ? <><EyeOff className="h-4 w-4 mr-2" /> Tạm dừng</>
                          : <><Eye className="h-4 w-4 mr-2" /> Kích hoạt</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewPlanSubs({ id: p.id, name: p.name, users: p.users })}>
                        <Users className="h-4 w-4 mr-2" /> Xem người đăng ký
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
          <h3 className="text-sm font-semibold font-body">Lịch sử giao dịch</h3>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm giao dịch..."
              className="pl-9 h-8 text-sm font-body"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Người dùng</TableHead>
              <TableHead className="font-body">Gói</TableHead>
              <TableHead className="font-body text-right">Số tiền</TableHead>
              <TableHead className="font-body">Phương thức</TableHead>
              <TableHead className="font-body">Ngày</TableHead>
              <TableHead className="font-body">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground font-body">Không tìm thấy giao dịch</TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm font-medium font-body">{t.user}</TableCell>
                  <TableCell className="text-sm font-body">{t.plan}</TableCell>
                  <TableCell className="text-sm font-body text-right font-semibold">{t.amount}</TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{t.method}</TableCell>
                  <TableCell className="text-sm font-body text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    {t.status === "Completed" || t.status === "Hoàn thành" ? (
                      <StatusBadge status="Active" />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        Thất bại
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Gói Mới</DialogTitle>
            <DialogDescription className="srOnly">Tạo gói đăng ký mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Tên gói</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="VD: Pro" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Slug</Label>
              <Input value={planForm.slug} onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })} className="h-9 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Giá (VNĐ/tháng)</Label>
                <Input value={planForm.price_monthly} onChange={(e) => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })} type="number" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Credits AI/tháng</Label>
                <Input value={planForm.ai_generations_limit} onChange={(e) => setPlanForm({ ...planForm, ai_generations_limit: Number(e.target.value) })} type="number" className="h-9" />
              </div>
            </div>
            <Button className="w-full" onClick={() => createPlanMutation.mutate()} disabled={createPlanMutation.isPending || !planForm.name}>
              {createPlanMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Tạo gói
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlan} onOpenChange={(v) => { if (!v) setEditPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói: {editPlan?.name}</DialogTitle>
            <DialogDescription className="srOnly">Chỉnh sửa gói đăng ký</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Tên gói</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Giá (VNĐ/tháng)</Label>
              <Input value={planForm.price_monthly} onChange={(e) => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })} type="number" className="h-9" />
            </div>
            <Button className="w-full" onClick={() => updatePlanMutation.mutate()} disabled={updatePlanMutation.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPlanSubs} onOpenChange={(v) => { if (!v) setViewPlanSubs(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Người đăng ký: {viewPlanSubs?.name}</DialogTitle>
            <DialogDescription className="srOnly">Xem danh sách người đăng ký gói</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg mb-4">
              <span className="text-sm font-body text-muted-foreground">Tổng người đăng ký</span>
              <span className="text-lg font-semibold font-body">{viewPlanSubs?.users ?? 0}</span>
            </div>
             <div className="space-y-2">
              {(viewPlanSubs?.users ?? 0) > 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-4">{viewPlanSubs?.users} người đang đăng ký gói này</p>
              ) : (
                <p className="text-sm text-muted-foreground font-body text-center py-4">Chưa có người đăng ký gói này</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
