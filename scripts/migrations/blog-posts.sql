-- =============================================================================
-- Миграция: таблица blog_posts для блога в разделе "Клиентам"
-- Таблица: blog_posts. Запуск: Supabase SQL Editor.
-- =============================================================================

-- Создание таблицы blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  cover_image_path TEXT,
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- RLS (Row Level Security) политики
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Политика для публичного чтения: только опубликованные посты
CREATE POLICY "Публичное чтение опубликованных постов"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Политика для админских операций: все операции через service role
-- (Админские операции выполняются через API routes с проверкой сессии и использованием service role)
-- Поэтому здесь не нужны дополнительные политики для INSERT/UPDATE/DELETE
-- Все админские операции будут выполняться через getSupabaseAdmin() с service role key

-- Комментарии к таблице и колонкам
COMMENT ON TABLE public.blog_posts IS 'Статьи блога в разделе "Клиентам"';
COMMENT ON COLUMN public.blog_posts.id IS 'Уникальный идентификатор поста';
COMMENT ON COLUMN public.blog_posts.title IS 'Заголовок статьи';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL-слаг статьи (уникальный)';
COMMENT ON COLUMN public.blog_posts.content IS 'Текст статьи (многострочный)';
COMMENT ON COLUMN public.blog_posts.cover_image_path IS 'Путь к обложке в Supabase Storage';
COMMENT ON COLUMN public.blog_posts.cover_image_url IS 'Публичный URL обложки';
COMMENT ON COLUMN public.blog_posts.published IS 'Опубликован ли пост (true = виден публично)';
COMMENT ON COLUMN public.blog_posts.created_at IS 'Дата создания';
COMMENT ON COLUMN public.blog_posts.updated_at IS 'Дата последнего обновления';
