import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Zap,
  Heart,
  User,
  Star,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  SURVEY_SECTIONS,
  type FeatureSurveyConfig,
} from "@/shared/survey/surveyConfig";

const SECTION_ICONS = {
  Monitor,
  Zap,
  Heart,
  User,
};

interface SurveyModalProps {
  isOpen: boolean;
  featureConfig: FeatureSurveyConfig;
  responses: Record<string, unknown>;
  currentStep: number;
  isSubmitting: boolean;
  submitError: string | null;
  onDismiss: () => void;
  onResponseChange: (questionId: string, value: unknown) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
  onSubmit: () => void;
}

export default function SurveyModal({
  isOpen,
  featureConfig,
  responses,
  currentStep,
  isSubmitting,
  submitError,
  onDismiss,
  onResponseChange,
  onNext,
  onPrev,
  onGoToStep,
  onSubmit,
}: SurveyModalProps) {
  const section = SURVEY_SECTIONS[currentStep];
  const IconComponent = SECTION_ICONS[section.icon as keyof typeof SECTION_ICONS] || Star;
  const isLastStep = currentStep === SURVEY_SECTIONS.length - 1;
  const isFirstStep = currentStep === 0;

  const renderQuestion = (question: (typeof SURVEY_SECTIONS)[0]["questions"][0]) => {
    switch (question.type) {
      case "rating":
        return (
          <RatingQuestion
            key={question.id}
            question={question}
            value={responses[question.id] as number | undefined}
            onChange={(val) => onResponseChange(question.id, val)}
          />
        );
      case "yesno":
        return (
          <YesNoQuestion
            key={question.id}
            question={question}
            value={responses[question.id] as boolean | undefined}
            onChange={(val) => onResponseChange(question.id, val)}
          />
        );
      case "select":
        return (
          <SelectQuestion
            key={question.id}
            question={question}
            value={responses[question.id] as string | undefined}
            onChange={(val) => onResponseChange(question.id, val)}
          />
        );
      case "multiselect":
        return (
          <MultiSelectQuestion
            key={question.id}
            question={question}
            value={(responses[question.id] as string[]) || []}
            onChange={(val) => onResponseChange(question.id, val)}
          />
        );
      case "textarea":
        return (
          <TextareaQuestion
            key={question.id}
            question={question}
            value={responses[question.id] as string | undefined}
            onChange={(val) => onResponseChange(question.id, val)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onDismiss();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-border/30">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {featureConfig.title}
                </h2>
                <p className="text-xs font-body text-muted-foreground mt-0.5">
                  {featureConfig.description}
                </p>
              </div>
              <button
                onClick={onDismiss}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2">
                {SURVEY_SECTIONS.map((s, i) => {
                  const isCompleted = i < currentStep;
                  const isActive = i === currentStep;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onGoToStep(i)}
                      className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                        isCompleted
                          ? "bg-foreground"
                          : isActive
                          ? "bg-foreground/50"
                          : "bg-secondary"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-body text-muted-foreground">
                  Bước {currentStep + 1}/{SURVEY_SECTIONS.length}
                </span>
                <span className="text-[10px] font-body text-muted-foreground">
                  {section.title}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">
                        {section.title}
                      </h3>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {section.questions.map(renderQuestion)}
                  </div>
                </motion.div>
              </AnimatePresence>

              {submitError && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-body">
                  {submitError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 pt-4 border-t border-border/30">
              <button
                onClick={isFirstStep ? onDismiss : onPrev}
                className="h-9 px-4 rounded-lg text-xs font-body font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                {isFirstStep ? "Để sau" : "Quay lại"}
              </button>

              {isLastStep ? (
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-lg bg-foreground text-background text-xs font-body font-semibold hover:bg-foreground/90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Gửi đánh giá
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="h-9 px-5 rounded-lg bg-foreground text-background text-xs font-body font-semibold hover:bg-foreground/90 transition-colors cursor-pointer flex items-center gap-2"
                >
                  Tiếp
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RatingQuestion({
  question,
  value,
  onChange,
}: {
  question: { id: string; label: string; min?: number; max?: number };
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  const min = question.min ?? 1;
  const max = question.max ?? 5;
  const labels = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];

  return (
    <div>
      <label className="text-sm font-body font-medium text-foreground block mb-2.5">
        {question.label}
      </label>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-lg text-sm font-body font-semibold transition-all cursor-pointer ${
              value === num
                ? "bg-foreground text-background shadow-sm scale-105"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      {value !== undefined && (
        <p className="text-[10px] font-body text-muted-foreground mt-1.5">
          {labels[value] || ""}
        </p>
      )}
    </div>
  );
}

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: { id: string; label: string };
  value: boolean | undefined;
  onChange: (val: boolean) => void;
}) {
  return (
    <div>
      <label className="text-sm font-body font-medium text-foreground block mb-2.5">
        {question.label}
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(false)}
          className={`h-9 px-4 rounded-lg text-xs font-body font-medium transition-all cursor-pointer ${
            value === false
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Không
        </button>
        <button
          onClick={() => onChange(true)}
          className={`h-9 px-4 rounded-lg text-xs font-body font-medium transition-all cursor-pointer ${
            value === true
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Có
        </button>
      </div>
    </div>
  );
}

function SelectQuestion({
  question,
  value,
  onChange,
}: {
  question: { id: string; label: string; options?: string[] };
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-body font-medium text-foreground block mb-2.5">
        {question.label}
      </label>
      <div className="flex flex-wrap gap-2">
        {question.options?.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`h-8 px-3 rounded-lg text-xs font-body font-medium transition-all cursor-pointer ${
              value === opt
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectQuestion({
  question,
  value,
  onChange,
}: {
  question: { id: string; label: string; options?: string[] };
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div>
      <label className="text-sm font-body font-medium text-foreground block mb-2.5">
        {question.label} <span className="text-muted-foreground font-normal">(chọn nhiều)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {question.options?.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`h-8 px-3 rounded-lg text-xs font-body font-medium transition-all cursor-pointer ${
              value.includes(opt)
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextareaQuestion({
  question,
  value,
  onChange,
}: {
  question: { id: string; label: string; placeholder?: string };
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-body font-medium text-foreground block mb-2.5">
        {question.label}
      </label>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        rows={4}
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-foreground"
      />
      <div className="mt-1.5 flex justify-end">
        <span className="text-[10px] font-body text-muted-foreground">
          {(value ?? "").length}/1000
        </span>
      </div>
    </div>
  );
}
