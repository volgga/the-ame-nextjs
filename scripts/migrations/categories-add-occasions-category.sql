-- =============================================================================
-- Миграция: добавление категории "По поводу" и её подкатегорий
-- Описание: создаёт категорию верхнего уровня "По поводу" и добавляет подкатегории
--           для управления через админку (вместо отдельной таблицы occasions)
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- 
-- Структура:
-- - Категория "По поводу" создаётся в таблице categories со slug 'po-povodu'
-- - Подкатегории создаются в таблице subcategories с category_id = id категории "По поводу"
-- - Используется формат slug 'po-povodu' (латиница, дефисы) согласно стилю проекта
-- - Миграция идемпотентна: повторный запуск не создаёт дубликаты
-- =============================================================================

-- Создаём категорию "По поводу" (если её ещё нет)
WITH occasions_category AS (
  INSERT INTO public.categories (slug, name, description, sort_order, is_active)
  VALUES (
    'po-povodu',
    'По поводу',
    'Категория для управления поводами и подкатегориями',
    (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM public.categories),
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active
  RETURNING id
)
-- Добавляем подкатегории для "По поводу" (только если их ещё нет)
INSERT INTO public.subcategories (category_id, name, title, description, sort_order)
SELECT 
  oc.id,
  subcat_data.name,
  subcat_data.title,
  subcat_data.description,
  subcat_data.sort_order
FROM occasions_category oc
CROSS JOIN (VALUES
  ('День рождения', 'День рождения', 'Букеты и композиции на день рождения', 1),
  ('14 февраля', '14 февраля', 'Букеты ко Дню святого Валентина', 2),
  ('8 марта', '8 марта', 'Букеты к Международному женскому дню', 3),
  ('Свадьба', 'Свадьба', 'Букеты и композиции для свадьбы', 4),
  ('Юбилей', 'Юбилей', 'Букеты к юбилею', 5),
  ('Рождение ребёнка', 'Рождение ребёнка', 'Букеты по случаю рождения ребёнка', 6),
  ('Извиниться', 'Извиниться', 'Букеты для извинений', 7),
  ('Сказать спасибо', 'Сказать спасибо', 'Букеты в знак благодарности', 8),
  ('Признание', 'Признание', 'Букеты для признания в чувствах', 9),
  ('Без повода', 'Без повода', 'Букеты без особого повода', 10)
) AS subcat_data(name, title, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subcategories 
  WHERE category_id = oc.id AND name = subcat_data.name
);

-- Возвращаем информацию о созданной категории
SELECT 
  id,
  slug,
  name,
  'Категория "По поводу" создана/обновлена' AS status
FROM public.categories 
WHERE slug = 'po-povodu';
