-- =============================================================================
-- Миграция: Бегущая дорожка (marquee) — настройки в home_reviews.
-- Запуск: Supabase SQL Editor.
-- =============================================================================

ALTER TABLE public.home_reviews
ADD COLUMN IF NOT EXISTS marquee_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS marquee_text TEXT,
ADD COLUMN IF NOT EXISTS marquee_link TEXT;

COMMENT ON COLUMN public.home_reviews.marquee_enabled IS 'Показывать бегущую дорожку над шапкой';
COMMENT ON COLUMN public.home_reviews.marquee_text IS 'Текст бегущей дорожки';
COMMENT ON COLUMN public.home_reviews.marquee_link IS 'URL при клике (пусто = не кликабельно)';
