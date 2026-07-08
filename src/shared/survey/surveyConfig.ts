export const SURVEY_VERSION = "v2";

export interface SurveyQuestion {
  id: string;
  label: string;
  type: "rating" | "yesno" | "select" | "multiselect" | "textarea";
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: SurveyQuestion[];
}

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: "ui",
    title: "Giao diện",
    description: "Đánh giá về giao diện, dễ nhìn, dễ hiểu, dễ thao tác",
    icon: "Monitor",
    questions: [
      {
        id: "ui_easy_view",
        label: "Dễ nhìn (màu sắc, font, bố cục)",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "ui_easy_understand",
        label: "Dễ hiểu (luồng đi, thuật ngữ, hướng dẫn)",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "ui_easy_use",
        label: "Dễ thao tác (tốc độ, phản hồi, mượt mà)",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
  },
  {
    id: "feature",
    title: "Tính năng",
    description: "Đánh giá tính năng có đúng yêu cầu, lỗi, link sản phẩm, chất lượng gợi ý",
    icon: "Zap",
    questions: [
      {
        id: "feature_accurate",
        label: "Đúng yêu cầu của bạn",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "feature_bugs",
        label: "Có gặp lỗi/gian hệ thống không?",
        type: "yesno",
        required: true,
      },
      {
        id: "feature_links",
        label: "Link sản phẩm hoạt động tốt",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "feature_quality",
        label: "Chất lượng gợi ý/phân tích",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
  },
  {
    id: "experience",
    title: "Trải nghiệm",
    description: "Đánh giá vui vẻ, khó chịu, muốn dùng lại, muốn giới thiệu",
    icon: "Heart",
    questions: [
      {
        id: "exp_fun",
        label: "Vui vẻ, thú vị khi sử dụng",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "exp_frustrating",
        label: "Khó chịu, bực bội khi dùng",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "exp_reuse",
        label: "Muốn dùng lại lần sau",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: "exp_recommend",
        label: "Muốn giới thiệu cho bạn bè",
        type: "rating",
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
  },
  {
    id: "demographic",
    title: "Về bạn",
    description: "Thông tin nhân khẩu học để hiểu đối tượng người dùng",
    icon: "User",
    questions: [
      {
        id: "demo_age",
        label: "Nhóm tuổi",
        type: "select",
        required: true,
        options: ["Dưới 18", "18-24", "25-34", "35-44", "45-54", "55+"],
      },
      {
        id: "demo_role",
        label: "Vai trò / Nghề nghiệp",
        type: "select",
        required: true,
        options: ["Sinh viên", "Nhân viên văn phòng", "Doanh nhân", "Freelancer", "Nghệ sĩ/Designer", "Khác"],
      },
      {
        id: "demo_style",
        label: "Gu thời trang bạn thích",
        type: "multiselect",
        required: true,
        options: [
          "Minimalist",
          "Streetwear",
          "Vintage/Retro",
          "Bohemian",
          "Classic/Professional",
          "Sporty/Athleisure",
          "Romantic/Feminine",
          "Edgy/Alternative",
          "Preppy",
          "Khác",
        ],
      },
      {
        id: "demo_channel",
        label: "Bạn biết đến Redo qua đâu?",
        type: "select",
        required: true,
        options: [
          "Facebook/Instagram Ads",
          "TikTok",
          "YouTube",
          "Bạn bè giới thiệu",
          "Tìm kiếm Google",
          "KOL/Influencer",
          "Email marketing",
          "Khác",
        ],
      },
      {
        id: "feedback",
        label: "Bạn muốn góp ý thêm điều gì để Redo tốt hơn?",
        type: "textarea",
        required: false,
        placeholder: "Ví dụ: tính năng bạn cần, điểm gây khó chịu, hoặc điều bạn thích nhất...",
      },
    ],
  },
];

export const ALL_QUESTIONS = SURVEY_SECTIONS.flatMap((s) => s.questions);

export const REQUIRED_QUESTIONS = ALL_QUESTIONS.filter((q) => q.required).map((q) => q.id);

export function validateResponses(responses: Record<string, unknown>): {
  valid: boolean;
  missing: string[];
} {
  const missing = REQUIRED_QUESTIONS.filter((id) => {
    const value = responses[id];
    return value === undefined || value === null || value === "";
  });
  return { valid: missing.length === 0, missing };
}

export interface FeatureSurveyConfig {
  feature: "quiz" | "recommender" | "tryon" | "survey";
  title: string;
  description: string;
  triggerDescription: string;
}

export const FEATURE_CONFIGS: Record<string, FeatureSurveyConfig> = {
  quiz: {
    feature: "quiz",
    title: "Khảo sát trải nghiệm Quiz Style",
    description: "Bạn vừa hoàn thành Quiz tìm gu thời trang. Góp ý giúp Redo tốt hơn nhé!",
    triggerDescription: "Sau khi xem kết quả Quiz",
  },
  recommender: {
    feature: "recommender",
    title: "Khảo sát AI Stylist",
    description: "Bạn vừa nhận gợi ý outfit từ AI Stylist. Trải nghiệm thế nào?",
    triggerDescription: "Sau 3 lần tạo outfit thành công",
  },
  tryon: {
    feature: "tryon",
    title: "Khảo sát Thử đồ ảo",
    description: "Bạn vừa dùng Try-On ảo. Kết quả có giống thực tế không?",
    triggerDescription: "Sau khi xem kết quả Try-On",
  },
  survey: {
    feature: "survey",
    title: "Khảo sát trải nghiệm",
    description: "Đánh giá trải nghiệm tổng quan của bạn với Redo",
    triggerDescription: "Từ trang Cá nhân",
  },
};

export function getFeatureConfig(feature: string): FeatureSurveyConfig {
  return FEATURE_CONFIGS[feature] || FEATURE_CONFIGS.quiz;
}

export function getSessionId(): string {
  let sessionId = localStorage.getItem("redo_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("redo_session_id", sessionId);
  }
  return sessionId;
}

export function getDismissedKey(feature: string): string {
  return `survey_dismissed_${feature}_${SURVEY_VERSION}`;
}

export function getSubmittedKey(feature: string): string {
  return `survey_submitted_${feature}_${SURVEY_VERSION}`;
}

export function isDismissed(feature: string): boolean {
  return localStorage.getItem(getDismissedKey(feature)) === "true";
}

export function isSubmitted(feature: string): boolean {
  return localStorage.getItem(getSubmittedKey(feature)) === "true";
}

export function markDismissed(feature: string): void {
  localStorage.setItem(getDismissedKey(feature), "true");
}

export function markSubmitted(feature: string): void {
  localStorage.setItem(getSubmittedKey(feature), "true");
}

export function shouldShowSurvey(
  feature: string,
  condition: boolean
): boolean {
  if (!condition) return false;
  if (isSubmitted(feature)) return false;
  if (isDismissed(feature)) return false;
  return true;
}

export function markFeatureCompleted(feature: string): void {
  localStorage.setItem(`feature_completed_${feature}`, "true");
}

export function isFeatureCompleted(feature: string): boolean {
  return localStorage.getItem(`feature_completed_${feature}`) === "true";
}

export function allFeaturesCompleted(): boolean {
  return isFeatureCompleted("quiz") && isFeatureCompleted("recommender");
}
