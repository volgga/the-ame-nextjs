-- =============================================================================
-- Миграция: добавление поля excerpt в таблицу blog_posts
-- Поле: excerpt (TEXT, nullable) — короткое описание для SEO meta description
-- Запуск: Supabase SQL Editor → вставить и выполнить
-- =============================================================================

-- Добавляем колонку excerpt
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Комментарий к колонке
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Короткое описание для SEO (meta description). Если пусто — генерируется автоматически из контента.';
