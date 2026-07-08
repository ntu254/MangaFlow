import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal, Shirt, Sparkles } from "lucide-react";

import { Navbar } from "@/shared/layout";
import { supabase } from "@/shared/lib";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptOverlay } from "@/features/auth/components/LoginPromptOverlay";
import ControlPanel from "../components/ControlPanel";
import TryOnCanvas from "../components/TryOnCanvas";
import AIStylistReport from "../components/AIStylistReport";
import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/shared/api/config";
import { toast } from "@/hooks/use-toast";
import { useSurveyTrigger } from "@/shared/hooks/useSurveyTrigger";
import { allFeaturesCompleted, markFeatureCompleted } from "@/shared/survey/surveyConfig";
import SurveyModal from "@/shared/components/SurveyModal";

const MAX_POLL_RETRIES = 60;
const POLL_INTERVAL_MS = 3000;



export default function OutfitBuilderPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"controls" | "canvas" | "report">("controls");

  const [humanImage, setHumanImage] = useState<string | null>(null);
  const [tryOnMode, setTryOnMode] = useState<"one-piece" | "combo">("one-piece");
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [clothImageTop, setClothImageTop] = useState<string | null>(null);
  const [clothImageBottom, setClothImageBottom] = useState<string | null>(null);
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);
  const [tryOnTaskId, setTryOnTaskId] = useState<string | null>(null);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [tryOnStatus, setTryOnStatus] = useState<string>("idle");
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const trafficRef = searchParams.get("ref") || "direct";
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const survey = useSurveyTrigger();

  const userId = session?.user?.id ?? "";

  const { data: creditBalance = 0 } = useQuery({
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
  });



  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      survey.checkTriggers &&
      tryOnStatus === "succeed" &&
      tryOnImage &&
      allFeaturesCompleted()
    ) {
      survey.checkTriggers([
        {
          feature: "tryon",
          check: () => true,
          getContext: () => ({ taskId: tryOnTaskId, hasOutfit: true }),
        },
      ]);
      markFeatureCompleted("outfitbuilder");
    }
  }, [tryOnStatus, tryOnImage, tryOnTaskId, survey.checkTriggers]);



  const createCompositeImage = async (topImgBase64: string, bottomImgBase64: string): Promise<string> => {
    return new Promise((resolve) => {
      const topImg = new Image();
      const bottomImg = new Image();
      
      topImg.onload = () => {
        bottomImg.onload = () => {
          const canvas = document.createElement("canvas");
          const width = Math.max(topImg.width, bottomImg.width);
          const height = topImg.height + bottomImg.height;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          
          const topX = (width - topImg.width) / 2;
          ctx.drawImage(topImg, topX, 0);
          
          const bottomX = (width - bottomImg.width) / 2;
          ctx.drawImage(bottomImg, bottomX, topImg.height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        bottomImg.src = bottomImgBase64;
      };
      topImg.src = topImgBase64;
    });
  };

  const startTryOn = async () => {
    const isCombo = tryOnMode === "combo";
    const hasEnoughImages = isCombo ? (humanImage && clothImageTop && clothImageBottom) : (humanImage && clothImage);
    if (!hasEnoughImages || tryOnStatus === "submitting" || tryOnStatus === "processing") return;
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }

    if (creditBalance <= 0) {
      toast({
        title: "Không đủ credit",
        description: "Bạn đã hết lượt tạo AI. Vui lòng nâng cấp gói để tiếp tục.",
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    setTryOnStatus("submitting");
    setTryOnError(null);
    setTryOnImage(null);
    setActiveTab("canvas");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      let finalClothImage = clothImage;
      if (isCombo && clothImageTop && clothImageBottom) {
        finalClothImage = await createCompositeImage(clothImageTop, clothImageBottom);
      }

      const { data, error } = await supabase.functions.invoke("tryon", {
        body: { action: "create", human_image: humanImage, cloth_image: finalClothImage },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        let errMsg = error.message;
        try {
          const body = await error.context.json();
          if (body && body.error) errMsg = body.error;
        } catch {}
        throw new Error(errMsg || "Edge function error");
      }
      if (data?.error) throw new Error(data.error);

      const taskId = data?.data?.task_id;
      if (!taskId) throw new Error("Không nhận được task ID từ server.");

      setTryOnTaskId(taskId);
      setTryOnStatus("processing");
      pollCountRef.current = 0;
      pollTryOnStatus(taskId);
    } catch (err) {
      setTryOnStatus("failed");
      setTryOnError((err as Error).message || "Không thể khởi tạo thử đồ ảo.");
    }
  };

  const pollTryOnStatus = (taskId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      pollCountRef.current++;

      if (pollCountRef.current > MAX_POLL_RETRIES) {
        if (pollRef.current) clearInterval(pollRef.current);
        setTryOnStatus("failed");
        setTryOnError("Hết thời gian chờ. Vui lòng thử lại.");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";

        const { data, error } = await supabase.functions.invoke("tryon", {
          body: { action: "status", task_id: taskId },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (error || data?.error) return;

        const taskData = data?.data;
        const status = taskData?.task_status;
        if (status === "succeed") {
          if (pollRef.current) clearInterval(pollRef.current);
          const imageUrl = taskData?.task_result?.images?.[0]?.url;
          setTryOnImage(imageUrl || null);
          setTryOnStatus("succeed");
        } else if (status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setTryOnStatus("failed");
          setTryOnError(taskData?.task_status_msg || "Thử đồ ảo thất bại.");
        }
      } catch {
        if (pollCountRef.current > MAX_POLL_RETRIES) {
          if (pollRef.current) clearInterval(pollRef.current);
          setTryOnStatus("failed");
          setTryOnError("Lỗi kết nối. Vui lòng thử lại.");
        }
      }
    }, POLL_INTERVAL_MS);
  };

  const trackClick = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      await supabase.functions.invoke("track-click", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { product_id: productId },
      });
    } catch {
      // silent — tracking is best-effort
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/fashion_background_theme.svg')", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "blur(0.5px)" }}
      />
      {showLoginPrompt && <LoginPromptOverlay />}
      <Navbar />
      <main className="flex flex-1 flex-col lg:flex-row overflow-hidden pt-16 w-full relative z-10">
        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden bg-background/60 backdrop-blur-md border-b border-border/40 h-12 shrink-0 px-2 relative z-20">
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-body font-medium transition-colors ${
              activeTab === "controls"
                ? "text-primary border-b-[2px] border-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Cấu hình
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-body font-medium transition-colors ${
              activeTab === "canvas"
                ? "text-primary border-b-[2px] border-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            Thử đồ
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-body font-medium transition-colors ${
              activeTab === "report"
                ? "text-primary border-b-[2px] border-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Báo cáo AI
          </button>
        </div>

        {/* Panels with responsive wrappers */}
        <div className={`${activeTab === "controls" ? "flex flex-1" : "hidden"} lg:flex lg:flex-none lg:w-[380px] lg:p-4 lg:pr-2 relative`}>
          <ControlPanel
            humanImage={humanImage}
            setHumanImage={setHumanImage}
            clothImage={clothImage}
            setClothImage={setClothImage}
            clothImageTop={clothImageTop}
            setClothImageTop={setClothImageTop}
            clothImageBottom={clothImageBottom}
            setClothImageBottom={setClothImageBottom}
            tryOnMode={tryOnMode}
            setTryOnMode={setTryOnMode}
            isTryOnLoading={tryOnStatus === "submitting" || tryOnStatus === "processing"}
            onStartTryOn={startTryOn}
            canTryOn={tryOnMode === "combo" ? (!!humanImage && !!clothImageTop && !!clothImageBottom) : (!!humanImage && !!clothImage)}
          />
        </div>

        <div className={`${activeTab === "canvas" ? "flex flex-1" : "hidden"} lg:flex lg:flex-1 lg:min-w-0 lg:py-4 lg:px-2 relative`}>
          <TryOnCanvas
            isLoading={isLoading}
            error={error || tryOnError || ""}
            humanImage={humanImage}
            selectedClothId={selectedClothId}
            setSelectedClothId={setSelectedClothId}
            setSelectedClothImage={setClothImage}
            tryOnImage={tryOnImage}
            tryOnStatus={tryOnStatus}
          />
        </div>

        <div className={`${activeTab === "report" ? "flex flex-1" : "hidden"} lg:flex lg:flex-none lg:w-[380px] lg:p-4 lg:pl-2 relative`}>
          <AIStylistReport
            hasOutfit={!!clothImage}
            hasPhoto={!!humanImage}
            tryOnImage={tryOnImage}
            tryOnStatus={tryOnStatus}
          />
        </div>
      </main>

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
}
