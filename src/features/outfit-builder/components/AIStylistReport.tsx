import { BadgeCheck, Calendar, Palette, Shirt, Camera, Clock, BarChart3, Star, Lightbulb, Sparkles, ShieldCheck, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface AIStylistReportProps {
  hasOutfit: boolean;
  hasPhoto: boolean;
  tryOnImage: string | null;
  tryOnStatus: string;
}

interface ChecklistItem {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "done";
}

export default function AIStylistReport({
  hasOutfit,
  hasPhoto,
  tryOnImage,
  tryOnStatus,
}: AIStylistReportProps) {
  const checklist: ChecklistItem[] = [
    { icon: <Shirt className="w-4 h-4" />, label: "Sản phẩm", status: hasOutfit ? "done" : "pending" },
    { icon: <Camera className="w-4 h-4" />, label: "Ảnh người mẫu", status: hasPhoto ? "done" : "pending" },
  ];

  const isSucceeded = tryOnStatus === "succeed" && !!tryOnImage;

  // Mock styled suggestions
  const getStylistReportData = () => {
    return {
      grade: "A+",
      fitScore: 94,
      harmonyScore: 92,
      colors: [
        { hex: "#1A1A1A", name: "Deep Charcoal" },
        { hex: "#EADDC9", name: "Warm Cream" },
        { hex: "#3A506B", name: "Slate Blue" },
      ],
      fitAnalysis: `Phom dáng trang phục phối hợp hoàn chỉnh với chiều cao của người mẫu. Các chi tiết vai và eo cân đối tốt, tạo tỷ lệ silhouette quyến rũ.`,
      colorAnalysis: `Màu sắc trang phục kết hợp hài hòa với màu da. Sự tương phản dịu mắt giữa màu trung tính và tông màu nhấn tạo ấn tượng thanh lịch.`,
      recommendation: `Đề xuất thêm thắt lưng da bản nhỏ và giày tối giản để tạo điểm nhấn vùng eo. Hoàn thiện với một chiếc đồng hồ dây kim loại mảnh.`,
    };
  };

  const report = getStylistReportData();

  return (
    <aside className="w-full h-full flex flex-col py-8 px-7 gap-7 shrink-0 z-10 overflow-hidden bg-background/30 backdrop-blur-md border border-border/30 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 shrink-0">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground flex items-center gap-2">
            AI Report
            <BadgeCheck className="w-5 h-5 text-foreground" />
          </h2>
          <p className="editorial-label mt-1 text-foreground/80">Báo cáo & Đánh giá</p>
        </div>
        <span className="px-3 py-1.5 bg-foreground/10 text-foreground border border-foreground/20 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-sm">
          Premium
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-8 pr-1 scrollbar-hide pb-10">
        
        {/* Preparation Analysis */}
        <section className="shrink-0">
          <h3 className="editorial-label text-foreground/80 flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-foreground/40" /> Checklist Chuẩn Bị
          </h3>
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/30 p-3 flex flex-col gap-1 shadow-sm">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-secondary/40">
                <span className={`transition-colors ${item.status === "done" ? "text-foreground" : "text-foreground/60"}`}>
                  {item.icon}
                </span>
                <span className={`text-xs font-medium flex-1 ${item.status === "done" ? "text-foreground" : "text-foreground/80"}`}>
                  {item.label}
                </span>
                {item.status === "done" ? (
                  <span className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center shadow-sm border border-foreground/20">
                    <BadgeCheck className="w-3.5 h-3.5 text-foreground" />
                  </span>
                ) : (
                  <Clock className="w-4 h-4 text-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Analysis Area */}
        <section className="flex flex-col gap-4 flex-1 min-h-[300px]">
          <h3 className="editorial-label text-foreground/80 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" /> Phân Tích Chi Tiết
          </h3>

          {!isSucceeded ? (
            // --- EMPTY / INCOMPLETE STATE ---
            <div className="flex-1 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 flex flex-col items-center justify-center p-6 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground/80 mb-4 shadow-sm border border-foreground/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground mb-2">Báo cáo đang bị khóa</p>
              <p className="text-xs text-foreground/80 mb-6 max-w-[200px] leading-relaxed">
                Hoàn thành bước thử đồ ảo để mở khóa báo cáo đánh giá chuyên sâu.
              </p>
              
              {/* Animated Placeholder Cards */}
              <div className="w-full flex flex-col gap-3 opacity-40 select-none pointer-events-none blur-[1px]">
                <div className="h-16 bg-card/40 backdrop-blur-sm rounded-[12px] border border-border/30 shadow-sm flex items-center px-4 gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Star className="w-4 h-4 text-foreground/80" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="h-3 w-20 bg-secondary rounded mb-2" />
                    <div className="h-2 w-28 bg-secondary rounded" />
                  </div>
                </div>
                <div className="h-16 bg-background rounded-[12px] border border-border/30 flex items-center px-4 gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-foreground/80" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="h-3 w-24 bg-secondary rounded mb-2" />
                    <div className="h-2 w-full bg-secondary rounded" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // --- ACTIVE PREMIUM STYLIST REPORT ---
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-grow flex flex-col gap-5"
            >
              {/* Score Dashboard Card */}
              <div className="bg-gradient-to-br from-teal/15 via-teal/5 to-transparent rounded-2xl border border-teal/25 p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-teal/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-teal uppercase tracking-widest">
                    Style Match Grade
                  </span>
                  <span className="text-4xl font-heading font-black text-foreground drop-shadow-sm">{report.grade}</span>
                  <span className="text-xs text-foreground/80">Tuyệt hảo & Sang trọng</span>
                </div>
                
                <div className="flex gap-4 border-l border-border/50 pl-4 h-16 items-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dáng ôm</span>
                    <span className="text-base font-heading font-bold text-foreground mt-1">{report.fitScore}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phối màu</span>
                    <span className="text-base font-heading font-bold text-foreground mt-1">{report.harmonyScore}%</span>
                  </div>
                </div>
              </div>

              {/* Color Palette Analysis */}
              <div className="bg-background/40 backdrop-blur-sm rounded-2xl border border-border/30 p-5 flex flex-col gap-4 shadow-sm">
                <h4 className="editorial-label text-muted-foreground flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-foreground/40" /> Bảng Màu Tương Thích
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {report.colors.map((c, i) => (
                      <div
                        key={c.hex}
                        className="w-10 h-10 rounded-full border-2 border-card shadow-sm hover:-translate-y-1 transition-transform duration-300 relative z-10"
                        style={{ backgroundColor: c.hex, zIndex: 10 - i }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sử dụng các màu <span className="font-semibold text-foreground">{report.colors.map(c => c.name).join(", ")}</span> làm điểm nhấn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Silhouette Fit & Fit Analysis */}
              <div className="bg-background/40 backdrop-blur-sm rounded-2xl border border-border/30 p-5 flex flex-col gap-5 shadow-sm">
                <div>
                  <h4 className="editorial-label text-muted-foreground flex items-center gap-2 mb-3">
                    <Star className="w-3.5 h-3.5 text-foreground/40" /> Đánh Giá Dáng Người
                  </h4>
                  {/* Progress bar */}
                  <div className="w-full bg-secondary/80 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="bg-teal h-2 rounded-full transition-all duration-1000 shadow-[0_0_8px_hsl(var(--teal)/0.6)]"
                      style={{ width: `${report.fitScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3.5">
                    {report.fitAnalysis}
                  </p>
                </div>
                
                <div className="border-t border-border/30 pt-5">
                  <h4 className="editorial-label text-muted-foreground flex items-center gap-2 mb-2">
                    <Heart className="w-3.5 h-3.5 text-foreground/40" /> Phối Màu Sắc & Ánh Sáng
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {report.colorAnalysis}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-gradient-to-br from-accent/15 via-accent/5 to-transparent rounded-2xl border border-accent/25 p-5 flex gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 shadow-sm">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Lời Khuyên Từ Stylist</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {report.recommendation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </aside>
  );
}
