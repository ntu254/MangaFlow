import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const placeholders = [
  "Tôi cần outfit đi cà phê cuối tuần…",
  "Gợi ý outfit công sở nhẹ nhàng…",
  "Mix streetwear dưới 500k…",
  "Tối nay mặc gì đây?",
];

const sampleResponses = [
  {
    text: "☕ Đây là 3 gợi ý casual chic cho buổi cà phê!",
    items: ["Áo linen trắng", "Quần chinos be", "Sneaker canvas"],
  },
  {
    text: "💼 Thanh lịch và chuyên nghiệp — thử những bộ này!",
    items: ["Áo blouse lụa", "Quần âu", "Giày oxford"],
  },
  {
    text: "🔥 Streetwear trong ngân sách? Có ngay!",
    items: ["Hoodie graphic", "Quần cargo", "Chunky sneaker"],
  },
];

const AIInput = () => {
  const [text, setText] = useState("");
  const [pIdx, setPIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [responseIdx, setResponseIdx] = useState(0);

  useEffect(() => {
    const cur = placeholders[pIdx];
    let i = 0;
    setTyped("");
    const iv = setInterval(() => {
      if (i <= cur.length) {
        setTyped(cur.slice(0, i));
        i++;
      } else {
        clearInterval(iv);
        setTimeout(() => setPIdx((p) => (p + 1) % placeholders.length), 2000);
      }
    }, 55);
    return () => clearInterval(iv);
  }, [pIdx]);

  const handleSend = () => {
    if (!text.trim()) return;
    setShowResponse(true);
    setResponseIdx(Math.floor(Math.random() * sampleResponses.length));
    setTimeout(() => {
      setText("");
      setShowResponse(false);
    }, 4000);
  };

  return (
    <section className="relative overflow-hidden bg-secondary/30">

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] min-h-[520px]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center p-12 md:p-16 lg:p-20"
        >
          <div>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-7 h-7 text-accent" />
            </motion.div>
            <p className="editorial-label mb-4">Chat với AI Stylist</p>
            <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground leading-tight">
              Hỏi
              <br />
              <span className="font-semibold text-accent">AI Stylist</span>
            </h2>
            <div className="editorial-divider mt-6" />
            <p className="text-sm text-muted-foreground font-body mt-5 max-w-[260px] leading-relaxed">
              Nhập ý tưởng bất kỳ — AI gợi ý outfit hoàn hảo ngay lập tức. Giống
              như có một stylist riêng 24/7.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="text-xs font-body text-teal font-medium">
                AI đang trực tuyến
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col justify-center p-8 md:p-12 lg:p-16"
        >
          <div className="max-w-lg mx-auto lg:mx-0 w-full">
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-foreground">
                    Redo
                  </p>
                  <p className="text-[10px] font-body text-teal flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block animate-pulse" />
                    Đang hoạt động
                  </p>
                </div>
                <MessageCircle className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>

              <div className="px-5 py-5 min-h-[160px]">
                <AnimatePresence mode="wait">
                  {showResponse ? (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <div className="flex justify-end mb-3">
                        <div className="bg-foreground text-background px-4 py-2.5 rounded-xl rounded-br-sm max-w-[80%]">
                          <p className="text-sm font-body">
                            {text || "Gợi ý outfit"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center mt-1 shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div className="bg-secondary rounded-xl px-4 py-3">
                          <p className="text-sm font-body text-foreground mb-2">
                            {sampleResponses[responseIdx].text}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sampleResponses[responseIdx].items.map(
                              (item, i) => (
                                <motion.span
                                  key={item}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.1 }}
                                  className="text-[10px] font-body font-medium px-3 py-1.5 bg-background border border-border rounded-full text-foreground"
                                >
                                  {item}
                                </motion.span>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-[120px] text-center"
                    >
                      <Sparkles className="w-6 h-6 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground/50 font-body">
                        Nhập câu hỏi hoặc chọn gợi ý bên dưới
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-5 pb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={typed}
                    className="w-full bg-secondary/50 rounded-md px-4 py-3.5 pr-12 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground text-background p-2.5 rounded-md active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Đi cà phê ☕",
                    "Hẹn hò 💕",
                    "Đi làm 💼",
                    "Du lịch ✈️",
                    "Dự tiệc 🎉",
                  ].map((tag, i) => (
                    <motion.button
                      key={tag}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setText(tag)}
                      className="text-[11px] font-body font-medium text-muted-foreground border border-border px-3.5 py-2 rounded-md hover:border-foreground/20 hover:text-foreground hover:bg-secondary/50 transition-all"
                    >
                      {tag}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIInput;
