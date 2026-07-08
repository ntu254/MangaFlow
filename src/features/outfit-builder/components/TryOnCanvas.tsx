import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Flame, Loader2, ShoppingBag, Shirt, Sparkles, X } from "lucide-react";

interface OutfitItem {
  id: string;
  name: string;
  image_url: string;
  price: number;
  affiliate_url: string;
  brand: string;
  slot: string;
  click_count: number;
}

interface TryOnCanvasProps {
  isLoading: boolean;
  error: string;

  // Try-on props
  humanImage: string | null;
  selectedClothId: string | null;
  setSelectedClothId: (id: string | null) => void;
  setSelectedClothImage: (url: string | null) => void;
  tryOnImage: string | null;
  tryOnStatus: string;
}

export default function TryOnCanvas({
  isLoading,
  error,
  humanImage,
  selectedClothId,
  setSelectedClothId,
  setSelectedClothImage,
  tryOnImage,
  tryOnStatus,
}: TryOnCanvasProps) {

  return (
    <section className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full z-10">
      {/* Header */}
      <header className="min-h-[5rem] py-3 border-b border-border/40 flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Kết quả AI</h1>
          <p className="editorial-label mt-1">Trải nghiệm mặc thử</p>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col min-h-0 bg-transparent">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-6 shadow-sm border border-accent/20">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">AI đang phối đồ...</h2>
              <p className="mt-2 text-sm text-muted-foreground">Đang phân tích phong cách và chọn lọc sản phẩm phù hợp nhất.</p>
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6 shadow-sm border border-destructive/20">
                <X className="w-8 h-8" />
              </div>
              <p className="text-sm text-foreground/80 mb-6 max-w-sm leading-relaxed font-medium">{error}</p>
            </motion.div>
          )}

          {!isLoading && !error && (
            <motion.div
              key="tryon-after"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col justify-center items-center overflow-hidden p-6 md:p-8"
            >
              {tryOnStatus === "submitting" || tryOnStatus === "processing" ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-sm">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                      <h3 className="font-heading text-2xl font-bold text-foreground">Đang xử lý thử đồ ảo...</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        Redo đang tiến hành tạo hình ảnh ghép. Quá trình này thông thường sẽ mất từ 10 đến 30 giây. Vui lòng đợi trong giây lát!
                      </p>
                    </div>
                  ) : tryOnStatus === "succeed" && tryOnImage ? (
                    <div className="relative h-[68vh] max-h-full aspect-[3/4] md:aspect-[9/16] rounded-[24px] overflow-hidden border border-border/40 shadow-lg bg-card/10 flex items-center justify-center">
                      {/* Blurred background clone to avoid empty margins */}
                      <img
                        src={tryOnImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                      />
                      {/* Main result image */}
                      <img
                        src={tryOnImage}
                        alt="Try-on result"
                        className="relative z-10 w-full h-full object-contain"
                      />
                      <div className="absolute bottom-4 left-4 bg-teal text-teal-foreground px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm z-20 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" /> Redo AI
                      </div>
                    </div>
                  ) : (
                    <div className="text-center max-w-md space-y-4">
                      <div className="w-20 h-20 flex items-center justify-center text-foreground/80 mx-auto">
                        <Shirt className="w-12 h-12 opacity-50" />
                      </div>
                      <h3 className="font-heading text-2xl font-bold text-foreground">Chưa có kết quả thử đồ ảo</h3>
                      <p className="text-sm text-foreground/80 max-w-sm leading-relaxed mx-auto">
                        Hãy đảm bảo bạn đã tải ảnh model tại Bước 1, chọn trang phục mong muốn tại Bước 2, sau đó nhấp nút **"Tạo ảnh mặc thử"** ở góc dưới cùng bên trái.
                      </p>
                    </div>
                  )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status */}
      <footer className="h-14 flex items-center px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isLoading || tryOnStatus === "processing" ? "bg-accent animate-pulse shadow-[0_0_8px_hsl(var(--accent)/0.6)]" : "bg-muted-foreground/40"}`} />
          <span className="editorial-label text-foreground/80">
            {isLoading
              ? "Đang phân tích dữ liệu..."
              : tryOnStatus === "submitting" || tryOnStatus === "processing"
              ? "Hệ thống đang xử lý Try-On..."
              : "Trạng thái: Sẵn sàng"}
          </span>
        </div>
      </footer>
    </section>
  );
}
