import { useAuth } from "@/features/auth/hooks/useAuth";

export interface SurveyTriggerContext {
  feature: "quiz" | "recommender" | "tryon";
  context: Record<string, unknown>;
}

export type TriggerCheckFn = () => boolean;

export interface SurveyTriggerConfig {
  feature: "quiz" | "recommender" | "tryon";
  check: TriggerCheckFn;
  getContext: () => Record<string, unknown>;
  delayMs?: number;
}

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
      tryOnStatus === "succeed" &&
      !!tryOnImage &&
      viewMode === "after",
    getContext: () => ({
      taskId: tryOnTaskId,
      hasOutfit: !!outfit,
    }),
  };
}

export function useSurveyTrigger(): {
  checkTriggers: (
    triggers: SurveyTriggerConfig[]
  ) => SurveyTriggerConfig | null;
} {
  const { session } = useAuth();

  const checkTriggers = (triggers: SurveyTriggerConfig[]): SurveyTriggerConfig | null => {
    for (const trigger of triggers) {
      if (trigger.check()) {
        return trigger;
      }
    }
    return null;
  };

  return { checkTriggers };
}

export function getSurveyPayload(
  trigger: SurveyTriggerConfig,
  responses: Record<string, unknown>,
  sessionId: string,
  surveyVersion: string
): {
  feature: string;
  context: Record<string, unknown>;
  responses: Record<string, unknown>;
  sessionId: string;
  surveyVersion: string;
  userId: string | null;
} {
  return {
    feature: trigger.feature,
    context: trigger.getContext(),
    responses,
    sessionId,
    surveyVersion,
    userId: session?.user?.id ?? null,
  };
}