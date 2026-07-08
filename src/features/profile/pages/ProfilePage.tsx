import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/shared/layout";
import {
  Button,
  Input,
  Label,
  Switch,
  Textarea,
} from "@/shared/ui";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  ClipboardList,
  Crown,
  Edit2,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShoppingBag,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authService, type SocialProvider } from "@/features/auth/services/auth.service";
import { supabase } from "@/shared/lib";
import { useSurveyTrigger } from "@/shared/hooks/useSurveyTrigger";
import SurveyModal from "@/shared/components/SurveyModal";
import {
  profileService,
  type Profile,
  type UserNotificationPreferences,
} from "../services/profile.service";

const tabs = [
  { id: "profile", label: "Hồ sơ", icon: User },
  { id: "security", label: "Bảo mật", icon: Lock },
  { id: "platforms", label: "Nền tảng", icon: ExternalLink },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "subscription", label: "Đăng ký", icon: Crown },
  { id: "danger", label: "Nguy hiểm", icon: AlertTriangle },
];

const platformsList = [
  { name: "Shopee", connected: true, accent: "bg-orange-500" },
  { name: "TikTok Shop", connected: false, accent: "bg-foreground" },
];

const styleOptions = ["Minimal", "Casual", "Streetwear", "Office", "Elegant", "Athleisure"];
const occasionOptions = ["Work", "Weekend", "Date night", "Travel", "Party", "Workout"];
const colorOptions = ["Black", "White", "Beige", "Navy", "Sage", "Rose"];

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`bg-card p-4 md:p-6 ${className}`}>{children}</div>;

const SectionHead = ({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
}) => (
  <div className="mb-5">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-foreground/40" />
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
    </div>
    {sub && <p className="font-body text-xs text-foreground/50 mt-1">{sub}</p>}
  </div>
);

const InfoCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-secondary/40 p-4 md:p-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-foreground/30" />
      <p className="font-body text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
        {title}
      </p>
    </div>
    <div className="font-body text-sm text-foreground/60 leading-relaxed">{children}</div>
  </div>
);

const ToggleChip = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-2 text-xs font-body font-semibold transition-colors ${
      active
        ? "bg-foreground/10 text-foreground font-medium"
        : "bg-secondary/50 text-foreground/55 hover:text-foreground hover:bg-secondary"
    }`}
  >
    {children}
  </button>
);

const formatCurrency = (amount?: number | null, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const panelAnim = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.2 },
};

type ProfileForm = {
  display_name: string;
  email: string;
  preferred_styles: string[];
  favorite_colors: string[];
  preferred_occasions: string[];
  budget_min: string;
  budget_max: string;
  body_size: string;
};

const ProfilePanel = ({
  profile: initial,
  onSave,
  onAvatarUpload,
  onResetPersonalization,
  isResetting,
}: {
  profile: Profile | null;
  onSave: (updates: Parameters<typeof profileService.updateProfile>[1]) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onResetPersonalization: () => Promise<void>;
  isResetting: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    display_name: "",
    email: "",
    preferred_styles: [],
    favorite_colors: [],
    preferred_occasions: [],
    budget_min: "",
    budget_max: "",
    body_size: "",
  });

  useEffect(() => {
    const bodySize = initial?.body_size ? JSON.stringify(initial.body_size, null, 2) : "";
    setForm({
      display_name: initial?.display_name ?? "",
      email: initial?.email ?? "",
      preferred_styles: initial?.preferred_styles ?? [],
      favorite_colors: initial?.favorite_colors ?? [],
      preferred_occasions: initial?.preferred_occasions ?? [],
      budget_min: initial?.budget_min?.toString() ?? "",
      budget_max: initial?.budget_max?.toString() ?? "",
      body_size: bodySize,
    });
  }, [initial]);

  const toggleArray = (key: "preferred_styles" | "favorite_colors" | "preferred_occasions", value: string) => {
    setForm((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      let bodySize: Record<string, unknown> | null = null;
      if (form.body_size.trim()) {
        bodySize = JSON.parse(form.body_size);
      }
      await onSave({
        display_name: form.display_name || null,
        preferred_styles: form.preferred_styles,
        favorite_colors: form.favorite_colors,
        preferred_occasions: form.preferred_occasions,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        body_size: bodySize,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const avatarInitial = (initial?.display_name || initial?.email || "U")[0].toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <SectionHead icon={User} title="Thông tin cá nhân" />
            <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={() => setEditing(!editing)}>
              <Edit2 className="w-3 h-3" /> {editing ? "Hủy" : "Chỉnh sửa"}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">Email</Label>
                <Input value={form.email} disabled className="font-body text-sm text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                  Tên hiển thị
                </Label>
                <Input
                  value={form.display_name}
                  disabled={!editing}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="font-body text-sm text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                Phong cách yêu thích
              </Label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((style) => (
                  <ToggleChip
                    key={style}
                    active={form.preferred_styles.includes(style)}
                    onClick={() => editing && toggleArray("preferred_styles", style)}
                  >
                    {style}
                  </ToggleChip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                Màu yêu thích
              </Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <ToggleChip
                    key={color}
                    active={form.favorite_colors.includes(color)}
                    onClick={() => editing && toggleArray("favorite_colors", color)}
                  >
                    {color}
                  </ToggleChip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                Dịp mặc ưu tiên
              </Label>
              <div className="flex flex-wrap gap-2">
                {occasionOptions.map((occasion) => (
                  <ToggleChip
                    key={occasion}
                    active={form.preferred_occasions.includes(occasion)}
                    onClick={() => editing && toggleArray("preferred_occasions", occasion)}
                  >
                    {occasion}
                  </ToggleChip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                  Ngân sách tối thiểu
                </Label>
                <Input
                  type="number"
                  value={form.budget_min}
                  disabled={!editing}
                  onChange={(e) => setForm((p) => ({ ...p, budget_min: e.target.value }))}
                  className="font-body text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                  Ngân sách tối đa
                </Label>
                <Input
                  type="number"
                  value={form.budget_max}
                  disabled={!editing}
                  onChange={(e) => setForm((p) => ({ ...p, budget_max: e.target.value }))}
                  className="font-body text-sm text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-body font-semibold text-foreground/60 uppercase tracking-wider">
                Size cơ thể
              </Label>
              <Textarea
                value={form.body_size}
                disabled={!editing}
                onChange={(e) => setForm((p) => ({ ...p, body_size: e.target.value }))}
                placeholder='{"height_cm":165,"top":"M","bottom":"28","shoe_eu":38}'
                className="min-h-24 font-mono text-xs"
              />
            </div>

            <AnimatePresence>
              {editing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  <Button variant="default" size="sm" className="gap-1.5 font-body text-xs bg-foreground text-background" disabled={saving} onClick={save}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Lưu
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={() => setEditing(false)}>
                    <X className="w-3 h-3" /> Hủy
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <motion.div className="w-16 h-16 bg-secondary flex items-center justify-center shrink-0 overflow-hidden" whileHover={{ scale: 1.05 }}>
              {initial?.avatar_url ? (
                <img src={initial.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading text-xl font-semibold text-foreground">{avatarInitial}</span>
              )}
            </motion.div>
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold text-foreground truncate">{initial?.display_name ?? "User"}</p>
              {initial?.style_dna && Object.keys(initial.style_dna).length > 0 && (
                <span className="text-[11px] font-body font-semibold text-accent uppercase tracking-wider">
                  {Object.entries(initial.style_dna)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .slice(0, 2)
                    .map(([s]) => s)
                    .join(" · ")}
                </span>
              )}
            </div>
          </div>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  await onAvatarUpload(file);
                } finally {
                  setUploading(false);
                  event.target.value = "";
                }
              }}
            />
            <span className="inline-flex w-full items-center justify-center gap-2 h-9 px-4 bg-background/85 text-foreground hover:bg-secondary/90 font-body text-xs font-medium cursor-pointer">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />} Upload avatar
            </span>
          </label>

          <div className="space-y-2.5 text-sm font-body mt-4">
            <div className="flex items-center gap-2 text-foreground/60">
              <User className="w-3.5 h-3.5" />
              {initial?.created_at
                ? `Tham gia ${new Date(initial.created_at).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`
                : "Thành viên mới"}
            </div>
          </div>
          <Link to="/style-profile" className="block mt-4">
            <Button variant="outline" size="sm" className="w-full gap-1.5 font-body text-xs">
              <ShoppingBag className="w-3 h-3" /> Xem Style Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 font-body text-xs mt-2"
            onClick={onResetPersonalization}
            disabled={isResetting}
          >
            {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Reset AI personalization
          </Button>
        </Card>

        <InfoCard icon={Sparkles} title="Mẹo">
          Hoàn thiện hồ sơ giúp AI hiểu phong cách của bạn chính xác hơn và gợi ý outfit phù hợp hơn.
        </InfoCard>
      </div>
    </div>
  );
};

const SecurityPanel = ({
  profile,
  onSave,
}: {
  profile: Profile | null;
  onSave: (updates: Parameters<typeof profileService.updateProfile>[1]) => Promise<void>;
}) => {
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const twoFactorEnabled = profile?.two_factor_enabled ?? false;

  const { data: identities } = useQuery({
    queryKey: ["user-identities"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.identities ?? [];
    },
    staleTime: 30_000,
  });

  const hasGoogle = identities?.some((id) => id.provider === "google") ?? false;
  const hasPassword = identities?.some((id) => id.provider === "email") ?? false;

  const handleLinkGoogle = async () => {
    setLinking(true);
    try {
      await authService.linkProvider("google");
    } catch {
      setLinking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="divide-y divide-border/40">
          <SectionHead icon={Lock} title="Bảo mật" sub="Quản lý mật khẩu và xác thực" />
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-foreground/40" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Mật khẩu</p>
                <p className="font-body text-[11px] text-foreground/50">Cập nhật qua email đặt lại mật khẩu</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 font-body text-xs">
              <Link to="/forgot-password">
                <Lock className="w-3 h-3" /> Đổi mật khẩu
              </Link>
            </Button>
          </div>
          {hasPassword && (
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                  <Lock className="w-4 h-4 text-foreground/40" />
                </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Xác thực hai yếu tố</p>
                    <p className="font-body text-[11px] text-foreground/50">Lưu trạng thái sẵn sàng cho provider hỗ trợ 2FA</p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  disabled={saving}
                  onCheckedChange={async (checked) => {
                    setSaving(true);
                    try {
                      await onSave({ two_factor_enabled: checked });
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>
          )}
        </Card>

        <Card>
          <SectionHead icon={User} title="Tài khoản liên kết" sub="Kết nối tài khoản Google để đăng nhập nhanh" />
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Google</p>
                <p className="font-body text-[11px] text-foreground/50">
                  {hasGoogle ? "Đã liên kết" : "Chưa liên kết"}
                </p>
              </div>
            </div>
            {hasGoogle ? (
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-body font-semibold border border-green-200">
                Đã kết nối
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-body text-xs"
                onClick={handleLinkGoogle}
                disabled={linking}
              >
                {linking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Liên kết Google
              </Button>
            )}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <InfoCard icon={Lock} title="Bảo mật tài khoản">
          {hasPassword
            ? "2FA hiện được lưu như preference trong hồ sơ. Khi bật provider MFA, preference này có thể dùng để mở luồng enroll."
            : "Liên kết Google giúp bạn đăng nhập nhanh mà không cần mật khẩu."}
        </InfoCard>
        <div className="bg-secondary/40 p-6">
          <p className="font-body text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-3">Hoạt động gần đây</p>
          <p className="mb-1 text-sm text-foreground/60">Phiên hiện tại:</p>
          <p className="text-foreground font-semibold text-sm">Đang hoạt động</p>
          <p className="text-xs text-foreground/60 mt-1">Trình duyệt hiện tại</p>
        </div>
      </div>
    </div>
  );
};

const PlatformsPanel = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2">
      <Card>
        <SectionHead icon={ExternalLink} title="Nền tảng kết nối" sub="Kết nối tài khoản mua sắm" />
        <div className="divide-y divide-border/40">
          {platformsList.map((p) => (
          <div key={p.name} className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${p.accent} flex items-center justify-center`}>
                <span className="text-white text-xs font-body font-bold">{p.name[0]}</span>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">{p.name}</p>
                <p className={`text-[11px] font-body font-medium ${p.connected ? "text-green-600" : "text-foreground/40"}`}>
                  {p.connected ? "Đã kết nối" : "Chưa kết nối"}
                </p>
              </div>
            </div>
            <Button variant={p.connected ? "outline" : "accent"} size="sm" className="font-body text-xs h-8">
              {p.connected ? "Ngắt kết nối" : "Kết nối"}
            </Button>
          </div>
        ))}
        </div>
      </Card>
    </div>
    <div className="space-y-4">
      <Card className="bg-secondary/40">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-3.5 h-3.5 text-accent" />
          <p className="font-body text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Tổng quan</p>
        </div>
        <div className="space-y-3 font-body text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">Đã kết nối</span>
            <span className="font-semibold text-foreground">3 / 5</span>
          </div>
          <div className="w-full h-1.5 bg-secondary">
            <div className="h-full bg-foreground/20" style={{ width: "60%" }} />
          </div>
        </div>
      </Card>
      <InfoCard icon={Sparkles} title="Lợi ích kết nối">
        Kết nối tài khoản mua sắm để nhận gợi ý sản phẩm phù hợp phong cách và theo dõi giá ưu đãi.
      </InfoCard>
    </div>
  </div>
);

const NotificationsPanel = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: () => profileService.getNotificationPreferences(userId),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Omit<UserNotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>) =>
      profileService.updateNotificationPreferences(userId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences", userId] }),
  });

  const items = [
    { key: "trend_alerts" as const, label: "Cập nhật xu hướng", desc: "Xu hướng thời trang mới nhất", icon: Sparkles },
    { key: "outfit_suggestions" as const, label: "Gợi ý outfit", desc: "AI gợi ý outfit phù hợp", icon: Sparkles },
    { key: "promotions" as const, label: "Ưu đãi mua sắm", desc: "Giảm giá từ sàn kết nối", icon: ShoppingBag },
    { key: "subscription_reminders" as const, label: "Nhắc gói đăng ký", desc: "Gia hạn, quota và hóa đơn", icon: Crown },
  ];

  if (isLoading) {
    return <Loader2 className="w-5 h-5 animate-spin text-accent" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card className="divide-y divide-border/40">
          <SectionHead icon={Bell} title="Thông báo" sub="Tùy chỉnh cách bạn nhận thông báo" />
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-foreground/40" />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="font-body text-[11px] text-foreground/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={Boolean(prefs?.[item.key])}
                disabled={updateMutation.isPending}
                onCheckedChange={(value) => updateMutation.mutate({ [item.key]: value })}
              />
            </div>
          ))}

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-foreground">Push notification</p>
              <p className="font-body text-[11px] text-foreground/50">Cho phép thông báo trên thiết bị</p>
            </div>
            <Switch checked={Boolean(prefs?.push_enabled)} onCheckedChange={(value) => updateMutation.mutate({ push_enabled: value })} />
          </div>
          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-foreground">Email notification</p>
              <p className="font-body text-[11px] text-foreground/50">Nhận bản tin và nhắc nhở qua email</p>
            </div>
            <Switch checked={Boolean(prefs?.email_enabled)} onCheckedChange={(value) => updateMutation.mutate({ email_enabled: value })} />
          </div>
        </Card>
      </div>
      <div>
        <InfoCard icon={Bell} title="Về thông báo">
          Cài đặt này được lưu vào Supabase và sẽ là nguồn dữ liệu cho push, email, trend alerts và campaign sau này.
        </InfoCard>
      </div>
    </div>
  );
};

const SubscriptionPanel = ({ userId }: { userId: string }) => {
  const { data: plan } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      const { data: sub } = await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", userId).maybeSingle();
      const { data: credits } = await supabase.from("user_credits").select("*").eq("user_id", userId).maybeSingle();
      return { sub, credits };
    },
    enabled: !!userId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", userId],
    queryFn: () => profileService.listPayments(userId),
    enabled: !!userId,
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined;
      const hasPending = data?.some((p) => p.status === "pending" || p.status === "processing");
      return hasPending ? 3000 : false;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", userId],
    queryFn: () => profileService.listInvoices(userId),
    enabled: !!userId,
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined;
      const hasPending = data?.some((i) => i.status === "pending" || i.status === "processing");
      return hasPending ? 3000 : false;
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-subscription-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["payments", userId] });
        queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["invoices", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);

  const planName = (plan?.sub as any)?.plans?.name ?? "Free";
  const aiLimit = (plan?.sub as any)?.plans?.ai_generations_limit ?? 10;
  const creditBalance = (plan?.credits as any)?.balance ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 -translate-y-12 translate-x-12" />
          <SectionHead icon={Crown} title="Gói đăng ký" />
          <div className="flex items-center gap-2 mb-4">
            <span className="font-heading text-xl font-bold text-foreground">{planName}</span>
            <span className="text-[10px] font-body font-semibold uppercase tracking-wider bg-secondary text-foreground/50 px-2 py-0.5">
              {plan?.sub ? "Đã đăng ký" : "Hiện tại"}
            </span>
          </div>
          <p className="font-body text-sm text-foreground/60 mb-5">
            {planName === "Free" ? "Nâng cấp để mở khóa toàn bộ tính năng AI styling." : `Gói ${planName} đang hoạt động.`}
          </p>
          <Button variant="default" className="gap-2 font-body bg-foreground text-background" onClick={() => window.location.href = "/pricing"}>
            <Crown className="w-4 h-4" /> {planName === "Free" ? "Nâng cấp Premium" : "Quản lý gói"}
          </Button>
        </Card>

        <Card className="divide-y divide-border/40">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground/40" />
              <h2 className="font-heading text-lg font-semibold text-foreground">Lịch sử thanh toán</h2>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="font-body text-sm text-foreground/50 py-4">Chưa có giao dịch thanh toán.</p>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
                  <p className="font-body text-xs text-foreground/50">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("vi-VN") : new Date(payment.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span className="text-xs font-body font-semibold text-foreground/55">{payment.status}</span>
              </div>
            ))
          )}
        </Card>

        <Card className="divide-y divide-border/40">
          <div className="mb-5">
            <h2 className="font-heading text-lg font-semibold text-foreground">Hóa đơn</h2>
          </div>
          {invoices.length === 0 ? (
            <p className="font-body text-sm text-foreground/50 py-4">Chưa có hóa đơn.</p>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                  <p className="font-body text-xs text-foreground/50">{formatCurrency(invoice.amount, invoice.currency)} · {invoice.status}</p>
                </div>
                {invoice.pdf_url && (
                  <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                    <a href={invoice.pdf_url} target="_blank" rel="noreferrer">Mở</a>
                  </Button>
                )}
              </div>
              ))
            )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-secondary/40">
          <p className="font-body text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-3">Sử dụng tháng này</p>
          <div className="space-y-3 font-body text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-foreground/60">AI Credits</span>
                <span className="text-foreground font-semibold">{aiLimit > 0 ? `${creditBalance} / ${aiLimit}` : "Không giới hạn"}</span>
              </div>
              {aiLimit > 0 && (
                <div className="w-full h-1.5 bg-secondary">
                  <div className="h-full bg-foreground/20" style={{ width: `${Math.min(100, (creditBalance / aiLimit) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        </Card>
        <InfoCard icon={Crown} title="Premium">
          Gói Premium bao gồm tạo outfit không giới hạn, phân tích nâng cao và hỗ trợ ưu tiên.
        </InfoCard>
      </div>
    </div>
  );
};

const DangerPanel = ({
  profile,
  planName,
  onLogout,
  onDeleteAccount,
  onExportData,
  isDeleting,
  isExporting,
}: {
  profile: Profile | null;
  planName: string;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onExportData: () => Promise<void>;
  isDeleting: boolean;
  isExporting: boolean;
}) => {
  const [showDelete, setShowDelete] = useState(false);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card className="divide-y divide-border/40">
          <SectionHead icon={AlertTriangle} title="Vùng nguy hiểm" sub="Hành động không thể hoàn tác" />
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-foreground/40" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Export dữ liệu cá nhân</p>
                <p className="font-body text-[11px] text-foreground/50">Tải xuống profile, wardrobe, outfits và billing</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={onExportData} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />} Export
            </Button>
          </div>
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary flex items-center justify-center">
                <LogOut className="w-4 h-4 text-foreground/40" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Đăng xuất</p>
                <p className="font-body text-[11px] text-foreground/50">Đăng xuất khỏi tài khoản hiện tại</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 font-body text-xs" onClick={onLogout}>
              <LogOut className="w-3 h-3" /> Đăng xuất
            </Button>
          </div>
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-destructive">Xóa tài khoản</p>
                <p className="font-body text-[11px] text-foreground/50">Xóa vĩnh viễn tài khoản và dữ liệu</p>
              </div>
            </div>
            {!showDelete ? (
              <Button variant="outline" size="sm" className="font-body text-xs text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-3 h-3 mr-1" /> Xóa
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <Button variant="destructive" size="sm" className="font-body text-xs gap-1" onClick={onDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Xác nhận
                </Button>
                <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => setShowDelete(false)}>
                  Hủy
                </Button>
              </motion.div>
            )}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="bg-secondary/40">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-3.5 h-3.5 text-foreground/40" />
            <p className="font-body text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Thông tin tài khoản</p>
          </div>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-foreground/60">Email</span>
              <span className="text-foreground font-medium truncate">{profile?.email ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Tham gia</span>
              <span className="text-foreground font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN") : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Gói</span>
              <span className="text-foreground font-medium">{planName}</span>
            </div>
          </div>
        </Card>
        <InfoCard icon={AlertTriangle} title="Cảnh báo">
          <p>Xóa tài khoản sẽ xóa vĩnh viễn dữ liệu gắn với tài khoản, bao gồm tủ đồ, outfit đã lưu và lịch sử phong cách.</p>
          <a href="mailto:support@redo.ai" className="inline-flex items-center gap-1 text-accent text-xs font-medium mt-2 hover:underline">
            <ExternalLink className="w-3 h-3" /> Liên hệ hỗ trợ
          </a>
        </InfoCard>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [active, setActive] = useState("profile");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { session, user, logout } = useAuth();
  const survey = useSurveyTrigger();

  const userId = user?.id ?? "";

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });

  const { data: plan } = useQuery({
    queryKey: ["subscription-summary", userId],
    queryFn: async () => {
      const { data: sub } = await supabase.from("subscriptions").select("plans(name)").eq("user_id", userId).maybeSingle();
      return sub;
    },
    enabled: !!userId,
  });

  const planName = (plan as any)?.plans?.name ?? "Free";

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof profileService.updateProfile>[1]) => profileService.updateProfile(userId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(userId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  const resetMutation = useMutation({
    mutationFn: () => profileService.resetPersonalization(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setStatusMessage("Đã reset dữ liệu cá nhân hóa AI.");
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => authService.exportPersonalData(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `redo-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Đã export dữ liệu cá nhân.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: async () => {
      await logout();
      navigate("/", { replace: true });
    },
  });

  const profileSave = async (updates: Parameters<typeof profileService.updateProfile>[1]) => {
    await updateMutation.mutateAsync(updates);
    setStatusMessage("Đã lưu hồ sơ.");
  };

  const ActivePanel = () => {
    switch (active) {
      case "profile":
        return (
          <ProfilePanel
            profile={profile ?? null}
            onSave={profileSave}
            onAvatarUpload={(file) => avatarMutation.mutateAsync(file).then(() => undefined)}
            onResetPersonalization={() => resetMutation.mutateAsync().then(() => undefined)}
            isResetting={resetMutation.isPending}
          />
        );
      case "security":
        return <SecurityPanel profile={profile ?? null} onSave={profileSave} />;
      case "platforms":
        return <PlatformsPanel />;
      case "notifications":
        return <NotificationsPanel userId={userId} />;
      case "subscription":
        return <SubscriptionPanel userId={userId} />;
      case "danger":
        return (
          <DangerPanel
            profile={profile ?? null}
            planName={planName}
            onLogout={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
            onDeleteAccount={() => deleteMutation.mutateAsync().then(() => undefined)}
            onExportData={() => exportMutation.mutateAsync().then(() => undefined)}
            isDeleting={deleteMutation.isPending}
            isExporting={exportMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  const errorMessage = useMemo(() => {
    if (error) return (error as Error).message;
    if (updateMutation.error) return (updateMutation.error as Error).message;
    if (avatarMutation.error) return (avatarMutation.error as Error).message;
    if (resetMutation.error) return (resetMutation.error as Error).message;
    if (deleteMutation.error) return (deleteMutation.error as Error).message;
    if (exportMutation.error) return (exportMutation.error as Error).message;
    return null;
  }, [avatarMutation.error, deleteMutation.error, error, exportMutation.error, resetMutation.error, updateMutation.error]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-widest mb-1">Tài khoản</p>
            <div className="flex items-center justify-between">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Cài đặt tài khoản</h1>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-body"
                onClick={() => survey.openSurvey("survey", {})}
              >
                <ClipboardList className="w-4 h-4" />
                Khảo sát
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 flex gap-6">
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-0.5">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-200 relative ${
                    isActive ? "text-foreground bg-secondary" : "text-foreground/45 hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-foreground" : ""}`} />
                  <span className={`font-body text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md flex overflow-x-auto px-2 py-1.5 gap-1 scrollbar-hide border-t border-border/80 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-body font-semibold whitespace-nowrap transition-colors ${
                active === tab.id ? "text-foreground font-semibold" : "text-foreground/40"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {statusMessage && (
            <div className="mb-4 flex items-center justify-between gap-3 bg-green-500/5 p-4 text-sm font-body text-green-700">
              <span>{statusMessage}</span>
              <button type="button" onClick={() => setStatusMessage(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 bg-destructive/5 p-4 text-sm font-body text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {isLoading || !session ? (
            <div className="min-h-80 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={active} {...panelAnim}>
                <ActivePanel />
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <SurveyModal
        isOpen={survey.isOpen}
        featureConfig={survey.featureConfig!}
        responses={survey.responses}
        currentStep={survey.currentStep}
        isSubmitting={survey.isSubmitting}
        submitError={survey.submitError}
        onDismiss={survey.dismissSurvey}
        onResponseChange={survey.handleResponseChange}
        onNext={survey.nextStep}
        onPrev={survey.prevStep}
        onGoToStep={survey.goToStep}
        onSubmit={survey.submitSurvey}
      />
    </div>
  );
};

export default ProfilePage;
