import { Loader2, Sparkles, SlidersHorizontal, Upload, Shirt, X } from "lucide-react";
import { useRef } from "react";

interface ControlPanelProps {
  // Model photo props
  humanImage: string | null;
  setHumanImage: (v: string | null) => void;

  // Mode
  tryOnMode: "one-piece" | "combo";
  setTryOnMode: (v: "one-piece" | "combo") => void;

  // Clothing photo props
  clothImage: string | null;
  setClothImage: (v: string | null) => void;
  clothImageTop: string | null;
  setClothImageTop: (v: string | null) => void;
  clothImageBottom: string | null;
  setClothImageBottom: (v: string | null) => void;

  // Action props
  isTryOnLoading: boolean;
  onStartTryOn: () => void;
  canTryOn: boolean;
}

const OCCASIONS = [
  { value: "casual", label: "Dạo phố" },
  { value: "formal", label: "Sự kiện" },
  { value: "work", label: "Đi làm" },
  { value: "date", label: "Hẹn hò" },
  { value: "party", label: "Tiệc tùng" },
  { value: "street", label: "Đường phố" },
];

const STYLES = [
  { value: "minimalist", label: "Minimalist" },
  { value: "streetwear", label: "Streetwear" },
  { value: "classic", label: "Classic" },
  { value: "korean", label: "Hàn Quốc" },
  { value: "japanese", label: "Nhật Bản" },
  { value: "vintage", label: "Vintage" },
];

export default function ControlPanel({
  humanImage,
  setHumanImage,
  clothImage,
  setClothImage,
  clothImageTop,
  setClothImageTop,
  clothImageBottom,
  setClothImageBottom,
  tryOnMode,
  setTryOnMode,
  isTryOnLoading,
  onStartTryOn,
  canTryOn,
}: ControlPanelProps) {
  const modelInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setHumanImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClothUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "one-piece" | "top" | "bottom" = "one-piece") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === "one-piece") {
        setClothImage(result);
      } else if (type === "top") {
        setClothImageTop(result);
      } else if (type === "bottom") {
        setClothImageBottom(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-full h-full flex flex-col py-8 px-7 gap-7 shrink-0 z-10 overflow-hidden bg-background/30 backdrop-blur-md border border-border/30 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">AI Stylist</h2>
          <p className="editorial-label mt-1">Bảng điều khiển</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-8 pr-2 scrollbar-hide pb-10">
        
        {/* Step 1: Model */}
        <section className="flex flex-col gap-3">
          <h3 className="editorial-label text-foreground/80 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-secondary-foreground">1</span>
            Hình ảnh của bạn
          </h3>
          <input
            type="file"
            ref={modelInputRef}
            onChange={handleModelUpload}
            accept="image/*"
            className="hidden"
          />

          {humanImage ? (
            <div className="relative w-full h-32 rounded-2xl overflow-hidden group shadow-sm border border-border/30">
              <img src={humanImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 backdrop-blur-sm">
                <button
                  onClick={() => modelInputRef.current?.click()}
                  className="px-4 py-2 bg-background/50 border border-foreground/20 hover:bg-secondary/30 hover:border-foreground/40 text-foreground text-xs font-semibold rounded-full transition-all shadow-sm"
                >
                  Đổi ảnh
                </button>
                <button
                  onClick={() => setHumanImage(null)}
                  className="p-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => modelInputRef.current?.click()}
              className="w-full h-32 rounded-2xl border border-border/30 hover:border-foreground/30 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center gap-2 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-background/50 border border-foreground/20 shadow-sm backdrop-blur-md flex items-center justify-center text-foreground/80 group-hover:text-primary transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">Tải ảnh người mẫu lên</span>
            </button>
          )}
        </section>

        {/* Step 2: Outfit */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="editorial-label text-foreground/80 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-secondary-foreground">2</span>
              Sản phẩm muốn thử
            </h3>
          </div>
          
          <div className="flex bg-card/40 backdrop-blur-sm border border-border/30 shadow-sm rounded-2xl p-1.5">
            <button
              onClick={() => setTryOnMode("one-piece")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                tryOnMode === "one-piece" ? "bg-background/50 border border-foreground/20 shadow-sm backdrop-blur-md text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              Đồ liền thân
            </button>
            <button
              onClick={() => setTryOnMode("combo")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                tryOnMode === "combo" ? "bg-background/50 border border-foreground/20 shadow-sm backdrop-blur-md text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              Áo + Quần
            </button>
          </div>

          <input
            type="file"
            ref={clothInputRef}
            onChange={(e) => handleClothUpload(e, "one-piece")}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={topInputRef}
            onChange={(e) => handleClothUpload(e, "top")}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={bottomInputRef}
            onChange={(e) => handleClothUpload(e, "bottom")}
            accept="image/*"
            className="hidden"
          />

          {tryOnMode === "one-piece" ? (
            clothImage ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden group shadow-sm border border-border/30">
                <img src={clothImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 backdrop-blur-sm">
                  <button
                    onClick={() => clothInputRef.current?.click()}
                    className="px-4 py-2 bg-background/50 border border-foreground/20 hover:bg-secondary/30 hover:border-foreground/40 text-foreground text-xs font-semibold rounded-full transition-all shadow-sm"
                  >
                    Đổi ảnh
                  </button>
                  <button
                    onClick={() => setClothImage(null)}
                    className="p-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/30 shadow-sm p-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-background/50 border border-foreground/20 shadow-sm backdrop-blur-md flex items-center justify-center text-foreground/80">
                  <Shirt className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-foreground/80 max-w-[80%]">
                  Chọn trang phục (Áo, quần hoặc váy liền)
                </p>
                <button
                  onClick={() => clothInputRef.current?.click()}
                  className="w-full py-2.5 rounded-full bg-background/50 border border-foreground/20 hover:bg-secondary/30 hover:border-foreground/40 text-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Tải ảnh trang phục
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-3">
              {/* Top Image */}
              <div className="flex-1">
                {clothImageTop ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden group shadow-sm border border-border/30">
                    <img src={clothImageTop} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-300 backdrop-blur-sm">
                      <button
                        onClick={() => topInputRef.current?.click()}
                        className="px-2 py-1.5 bg-background/50 border border-foreground/20 hover:bg-secondary/30 hover:border-foreground/40 text-foreground text-[10px] font-semibold rounded-full transition-all shadow-sm"
                      >
                        Đổi
                      </button>
                      <button
                        onClick={() => setClothImageTop(null)}
                        className="p-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full transition-all shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => topInputRef.current?.click()}
                    className="w-full h-32 rounded-2xl border border-border/30 hover:border-foreground/30 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-foreground/80">Tải ảnh Áo</span>
                  </button>
                )}
              </div>
              
              {/* Bottom Image */}
              <div className="flex-1">
                {clothImageBottom ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden group shadow-sm border border-border/30">
                    <img src={clothImageBottom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-300 backdrop-blur-sm">
                      <button
                        onClick={() => bottomInputRef.current?.click()}
                        className="px-2 py-1.5 bg-background/50 border border-foreground/20 hover:bg-secondary/30 hover:border-foreground/40 text-foreground text-[10px] font-semibold rounded-full transition-all shadow-sm"
                      >
                        Đổi
                      </button>
                      <button
                        onClick={() => setClothImageBottom(null)}
                        className="p-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full transition-all shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => bottomInputRef.current?.click()}
                    className="w-full h-32 rounded-2xl border border-border/30 hover:border-foreground/30 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-foreground/80">Tải ảnh Quần</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Button */}
      <div className="p-6 shrink-0 mt-auto z-20">
        <button
          onClick={onStartTryOn}
          disabled={!canTryOn || isTryOnLoading}
          className={`w-full h-14 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
            canTryOn && !isTryOnLoading
              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-[0_16px_34px_-18px_hsl(var(--primary)/0.28)]"
              : "bg-muted text-muted-foreground/60 cursor-not-allowed"
          }`}
        >
          {isTryOnLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Tạo ảnh mặc thử
        </button>
      </div>
    </aside>
  );
}
