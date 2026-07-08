-- Thêm cột để cache kết quả AI Style Profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_style_profile_cache JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_style_profile_updated_at TIMESTAMPTZ DEFAULT NULL;
