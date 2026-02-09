-- =============================================================================
-- Миграция: добавление поля sort_order в таблицу blog_posts
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- Идемпотентно: можно запускать повторно.
-- =============================================================================

-- Добавляем колонку sort_order
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Создаём индекс для производительности сортировки
CREATE INDEX IF NOT EXISTS idx_blog_posts_sort_order
ON public.blog_posts(sort_order ASC NULLS LAST);

-- Устанавливаем начальные значения sort_order на основе created_at (старые посты получают больший sort_order)
-- Это нужно для обратной совместимости: новые посты будут выше в списке
UPDATE public.blog_posts
SET sort_order = (
  SELECT COUNT(*) 
  FROM public.blog_posts bp2 
  WHERE bp2.created_at >= blog_posts.created_at
)
WHERE sort_order = 0 OR sort_order IS NULL;

-- Комментарий к колонке
COMMENT ON COLUMN public.blog_posts.sort_order IS 'Порядок сортировки постов (меньше = выше в списке)';
