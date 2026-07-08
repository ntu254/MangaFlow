import { recommenderService } from "@/features/recommender/services/recommender.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptOverlay } from "@/features/auth/components/LoginPromptOverlay";
import type { Outfit } from "@/features/recommender/types";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib";
import { apiConfig } from "@/shared/api/config";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSurveyTrigger } from "@/shared/hooks/useSurveyTrigger";
import { type FeatureSurveyConfig } from "@/shared/survey/surveyConfig";
import SurveyModal from "@/shared/components/SurveyModal";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOutfitsGenerated: (outfits: Outfit[], message: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const QUICK_SUGGESTIONS = [
  { label: "Dạ tiệc", prompt: "Dạ tiệc sang trọng tối nay" },
  { label: "Đi học", prompt: "Outfit đi học năng động" },
  { label: "Đi chơi", prompt: "Outfit đi chơi cuối tuần thoải mái" },
  { label: "Công sở", prompt: "Style công sở nữ tính" },
  { label: "Hẹn hò", prompt: "Outfit đi hẹn hò lãng mạn" },
];

const ChatSidebar = ({ isOpen, onToggle, onOutfitsGenerated, isGenerating, setIsGenerating }: ChatSidebarProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [recentHistory, setRecentHistory] = useState<string[]>(() => {
    // Guests don't have a session yet so we defer; history only shown for logged-in users
    if (!session) return [];
    try {
      const saved = localStorage.getItem("redo_recent_prompts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const survey = useSurveyTrigger();

  const userId = session?.user?.id ?? "";

  const { data: creditBalance = 0, refetch: refetchCredits } = useQuery({
    queryKey: ["user-credits-balance", userId],
    queryFn: async () => {
      if (apiConfig.useMockApi) {
        return 10;
      }
      try {
        const { data: uc, error } = await supabase
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return (uc as any)?.balance ?? 0;
      } catch (err) {
        console.error("Failed to fetch user credits:", err);
        return 0;
      }
    },
    enabled: !!userId,
    refetchInterval: 15_000, // Re-check credits every 15s to stay in sync with server-side deductions
    staleTime: 5_000,
  });

  const saveHistory = (items: string[]) => {
    setRecentHistory(items);
    try {
      localStorage.setItem("redo_recent_prompts", JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save history to localStorage:", e);
    }
  };

  const handleCreditExhausted = () => {
    // Always show survey when credits run out, regardless of if they submitted it before
    survey.openSurvey("survey", { creditBalance: 0 });
  };

  const handleSurveyDismiss = () => {
    // Close without permanently marking as dismissed — survey can reappear next time
    survey.closeSurveyQuietly();
    toast({
      title: "Không đủ credit",
      description: "Bạn đã hết lượt tạo AI. Vui lòng nâng cấp gói để tiếp tục.",
      variant: "destructive",
    });
    navigate("/pricing");
  };

  const handleSurveySubmit = async () => {
    await survey.submitSurvey();
    toast({
      title: "Không đủ credit",
      description: "Cảm ơn bạn đã đánh giá! Vui lòng nâng cấp gói để tiếp tục sử dụng AI.",
      variant: "destructive",
    });
    navigate("/pricing");
  };

  const sendMsg = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isGenerating) return;

    // Guest users cannot use AI features
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }

    if (creditBalance <= 0) {
      handleCreditExhausted();
      return;
    }

    setInput("");

    // Update history list
    const nextHistory = [msg, ...recentHistory.filter((h) => h !== msg)].slice(0, 5);
    saveHistory(nextHistory);

    setIsGenerating(true);
    try {
      const result = await recommenderService.converse(msg);
      onOutfitsGenerated(result.outfits, msg);

      // Refetch credit balance after generation — the edge function deducts credits server-side
      await refetchCredits();

      // Check if credits are now exhausted after this generation
      const freshCredits = queryClient.getQueryData<number>(["user-credits-balance", userId]) ?? 0;
      if (freshCredits <= 0) {
        handleCreditExhausted();
      }
    } catch (e) {
      // Handle credit exhaustion from the edge function
      if (e instanceof Error && e.message === "CREDIT_EXHAUSTED") {
        await refetchCredits();
        handleCreditExhausted();
        return;
      }
      console.error("converse failed:", e);
      // Also refetch on error in case credits were deducted despite the error
      await refetchCredits();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {showLoginPrompt && <LoginPromptOverlay />}
      
      {/* Survey Modal for credits exhausted */}
      {survey.isOpen && survey.featureConfig && (
        <SurveyModal
          isOpen={survey.isOpen}
          featureConfig={survey.featureConfig}
          responses={survey.responses}
          currentStep={survey.currentStep}
          isSubmitting={survey.isSubmitting}
          submitError={survey.submitError}
          onDismiss={handleSurveyDismiss}
          onResponseChange={survey.handleResponseChange}
          onNext={survey.nextStep}
          onPrev={survey.prevStep}
          onGoToStep={survey.goToStep}
          onSubmit={handleSurveySubmit}
        />
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="md:hidden fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {/* Desktop Vertical Tab when collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-foreground text-background py-4 px-1.5 rounded-r-xl hover:pl-2.5 transition-all shadow-lg items-center gap-1.5 flex-col"
          style={{ writingMode: "vertical-rl" }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[10px] font-heading font-semibold tracking-wider uppercase whitespace-nowrap">
            AI Stylist
          </span>
        </button>
      )}

      {/* Main Sidebar Drawer */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : -350, width: isOpen ? 320 : 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className={`fixed top-16 md:sticky z-40 h-[calc(100vh-4rem)] flex flex-col shrink-0 overflow-hidden ${
          !isOpen ? "pointer-events-none opacity-0 md:w-0" : "w-[320px] opacity-100"
        }`}
      >
        <div className="w-[320px] h-full flex flex-col p-4 py-6 space-y-4 overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="flex items-center justify-between bg-background/60 backdrop-blur-md border border-border/40 p-4 rounded-2xl shadow-sm">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-foreground/70" /> AI Stylist
              </h2>
              <p className="text-[11px] font-body text-muted-foreground mt-0.5">
                Bạn muốn mặc gì hôm nay?
              </p>
            </div>
            <button
              onClick={onToggle}
              className="hidden md:flex items-center gap-1 text-[10px] font-body text-muted-foreground hover:text-foreground border border-border/60 px-2 py-1 rounded-lg transition-colors bg-background/40"
            >
              <ChevronLeft className="w-3 h-3" /> Thu gọn
            </button>
          </div>

          {/* Prompt Input Box */}
          <div className="space-y-2 bg-background/60 backdrop-blur-md border border-border/40 p-4 rounded-2xl shadow-sm">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 block">
              Yêu cầu của bạn
            </label>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMsg();
                  }
                }}
                placeholder="VD: phối đầm lụa dự tiệc tối sang trọng dưới 2 triệu..."
                rows={3}
                className="w-full bg-secondary/20 border border-border/60 p-3 pr-10 text-xs font-body rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all placeholder:text-muted-foreground/50 resize-none"
              />
              <button
                onClick={() => void sendMsg()}
                disabled={!input.trim() || isGenerating}
                className="absolute right-2 bottom-3 bg-foreground text-background p-2 rounded-lg active:scale-95 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2.5 bg-background/60 backdrop-blur-md border border-border/40 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 block">
              Gợi ý nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => void sendMsg(s.prompt)}
                  disabled={isGenerating}
                  className="text-xs font-body px-3 py-1.5 rounded-full border border-foreground/20 bg-background/50 hover:border-foreground/40 hover:text-foreground hover:bg-secondary/30 transition-all disabled:opacity-40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent History — only shown for logged-in users */}
          {session && (
            <div className="flex-1 space-y-2.5 overflow-hidden flex flex-col bg-background/60 backdrop-blur-md border border-border/40 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 block">
                  Lịch sử gần đây
                </span>
                {recentHistory.length > 0 && (
                  <button
                    onClick={() => saveHistory([])}
                    className="text-[10px] font-body text-muted-foreground/60 hover:text-destructive transition-colors"
                  >
                    Xoá tất cả
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {recentHistory.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/40 font-body italic py-2">Chưa có lịch sử</p>
                ) : (
                  recentHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-2 py-2 px-2.5 rounded-lg hover:bg-secondary/40 transition-colors"
                    >
                      <button
                        onClick={() => void sendMsg(h)}
                        disabled={isGenerating}
                        className="flex-1 text-left flex items-start gap-2 text-xs font-body text-foreground/85 hover:text-foreground transition-colors disabled:opacity-50 min-w-0"
                      >
                        <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-colors" />
                        <span className="truncate">{h}</span>
                      </button>
                      <button
                        onClick={() => saveHistory(recentHistory.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/50 hover:text-destructive transition-all shrink-0"
                        title="Xoá"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ChatSidebar;

