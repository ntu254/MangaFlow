-- Mở rộng CHECK constraint trên cột feature để hỗ trợ thêm 'survey' và 'credits_exhausted'
ALTER TABLE public.survey_responses DROP CONSTRAINT IF EXISTS survey_responses_feature_check;
ALTER TABLE public.survey_responses
  ADD CONSTRAINT survey_responses_feature_check
  CHECK (feature IN ('quiz', 'recommender', 'tryon', 'survey', 'credits_exhausted'));
