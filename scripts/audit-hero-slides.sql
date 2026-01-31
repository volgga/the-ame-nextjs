-- =============================================================================
-- Аудит таблицы hero_slides и связанных данных
-- Запуск: Supabase SQL Editor
-- =============================================================================

-- 1) Структура таблицы hero_slides
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hero_slides'
ORDER BY ordinal_position;

-- 2) Индексы и ограничения
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'hero_slides';

-- 3) Проверка sort_order (дубли, NULL)
SELECT sort_order, COUNT(*) as cnt
FROM public.hero_slides
GROUP BY sort_order
HAVING COUNT(*) > 1 OR sort_order IS NULL;

-- 4) Список слайдов с порядком
SELECT id, sort_order, is_active, 
       CASE WHEN image_url IS NOT NULL THEN 'has image_url' ELSE 'NULL' END as img_status
FROM public.hero_slides
ORDER BY sort_order;

-- 5) Лишние колонки (которые должны быть удалены)
-- title, subtitle - если есть, вывести предупреждение
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'hero_slides' AND column_name = 'title'
) as has_title,
EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'hero_slides' AND column_name = 'subtitle'
) as has_subtitle;
