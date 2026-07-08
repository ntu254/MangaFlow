import { useCallback, useState } from "react";
import {
  type SurveyTriggerConfig,
  type FeatureSurveyConfig,
  getFeatureConfig,
  getSessionId,
  shouldShowSurvey,
  markDismissed,
  markSubmitted,
  SURVEY_VERSION,
} from "@/shared/survey/surveyConfig";
import { supabase } from "@/shared/lib";
import { toast } from "@/hooks/use-toast";

const TEST_EMAIL = "nttu254.vn@gmail.com";

async function isTestUser(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email === TEST_EMAIL;
}

interface SurveyState {
  isOpen: boolean;
  feature: string;
  featureConfig: FeatureSurveyConfig | null;
  triggerContext: Record<string, unknown>;
  responses: Record<string, unknown>;
  currentStep: number;
  isSubmitting: boolean;
  submitError: string | null;
}

const initialState: SurveyState = {
  isOpen: false,
  feature: "",
  featureConfig: null,
  triggerContext: {},
  responses: {},
  currentStep: 0,
  isSubmitting: false,
  submitError: null,
};

export function useSurveyTrigger() {
  const [state, setState] = useState<SurveyState>(initialState);

  const checkTriggers = useCallback(async (triggers: SurveyTriggerConfig[]) => {
    const testUser = await isTestUser();
    for (const trigger of triggers) {
      if (!testUser && !shouldShowSurvey(trigger.feature, trigger.check())) continue;
      openSurvey(trigger.feature, trigger.getContext());
      break;
    }
  }, []);

  const openSurvey = useCallback(
    (feature: string, context: Record<string, unknown> = {}) => {
      const featureConfig = getFeatureConfig(feature);
      setState({
        isOpen: true,
        feature,
        featureConfig,
        triggerContext: context,
        responses: {},
        currentStep: 0,
        isSubmitting: false,
        submitError: null,
      });
    },
    []
  );

  const closeSurvey = useCallback(() => {
    if (state.feature) {
      markDismissed(state.feature);
    }
    setState(initialState);
  }, [state.feature]);

  // Close without permanently marking as dismissed — used for credit-exhaustion flow
  // so the survey can reappear next time the user runs out of credits
  const closeSurveyQuietly = useCallback(() => {
    setState(initialState);
  }, []);

  const dismissSurvey = useCallback(() => {
    if (state.feature) {
      markDismissed(state.feature);
    }
    setState(initialState);
  }, [state.feature]);

  const handleResponseChange = useCallback(
    (questionId: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        responses: { ...prev.responses, [questionId]: value },
      }));
    },
    []
  );

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(Math.max(step, 0), 3),
    }));
  }, []);

  const submitSurvey = useCallback(async () => {
    if (!state.feature) return;

    setState((prev) => ({ ...prev, isSubmitting: true, submitError: null }));

    try {
      const sessionId = getSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        feature: state.feature,
        context: state.triggerContext,
        responses: state.responses,
        feedback: typeof state.responses.feedback === "string" ? state.responses.feedback : null,
        sessionId,
        surveyVersion: SURVEY_VERSION,
      };

      const { data, error } = await supabase.functions.invoke("submit-survey", {
        body: payload,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to submit survey");

      markSubmitted(state.feature);
      submittedFeaturesRef.current.add(state.feature);

      toast({
        title: "Cảm ơn bạn!",
        description: "Đánh giá của bạn đã được gửi thành công ✨",
      });

      setState(initialState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      setState((prev) => ({ ...prev, submitError: message, isSubmitting: false }));
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    }
  }, [state.feature, state.triggerContext, state.responses]);

  return {
    isOpen: state.isOpen,
    feature: state.feature,
    featureConfig: state.featureConfig,
    responses: state.responses,
    currentStep: state.currentStep,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
    checkTriggers,
    openSurvey,
    closeSurvey,
    closeSurveyQuietly,
    dismissSurvey,
    handleResponseChange,
    nextStep,
    prevStep,
    goToStep,
    submitSurvey,
  };
}

const submittedFeaturesRef = { current: new Set<string>() };

export function createQuizTrigger(
  isAnalyzing: boolean,
  quizResult: unknown
): SurveyTriggerConfig {
  return {
    feature: "quiz",
    check: () => !isAnalyzing && !!quizResult,
    getContext: () => ({
      styleDna: quizResult && typeof quizResult === "object" ? quizResult : null,
    }),
    delayMs: 1500,
  };
}

export function createRecommenderTrigger(
  generationCount: number,
  hasResults: boolean,
  activePrompt: string
): SurveyTriggerConfig {
  return {
    feature: "recommender",
    check: () => hasResults && generationCount >= 3,
    getContext: () => ({
      generations: generationCount,
      lastPrompt: activePrompt,
    }),
  };
}

export function createTryOnTrigger(
  tryOnStatus: string,
  tryOnImage: string | null,
  viewMode: "before" | "after",
  tryOnTaskId: string | null,
  outfit: unknown
): SurveyTriggerConfig {
  return {
    feature: "tryon",
    check: () =>
      tryOnStatus === "succeed" && !!tryOnImage && viewMode === "after",
    getContext: () => ({
      taskId: tryOnTaskId,
      hasOutfit: !!outfit,
    }),
  };
}
