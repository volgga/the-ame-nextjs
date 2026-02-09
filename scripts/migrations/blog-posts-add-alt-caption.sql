-- =============================================================================
-- Миграция: добавление полей cover_alt и cover_caption в таблицу blog_posts
-- Запуск: Supabase SQL Editor.
-- =============================================================================

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS cover_alt TEXT,
ADD COLUMN IF NOT EXISTS cover_caption TEXT;

COMMENT ON COLUMN public.blog_posts.cover_alt IS 'Alt-текст для обложки статьи';
COMMENT ON COLUMN public.blog_posts.cover_caption IS 'Подпись к обложке статьи';
