-- =============================================================================
-- Миграция: создание категории "Цветы в составе"
-- Описание: категория для фильтрации товаров по цветам в составе букета
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

DO $$
DECLARE
  category_exists BOOLEAN;
BEGIN
  -- Проверяем, существует ли уже категория с таким slug
  SELECT EXISTS(
    SELECT 1 FROM public.categories 
    WHERE slug IN ('cvety-v-sostave', 'flowers-in-composition')
  ) INTO category_exists;

  -- Если категория не существует — создаём
  IF NOT category_exists THEN
    INSERT INTO public.categories (name, slug, sort_order, is_active, description)
    VALUES (
      'Цветы в составе',
      'cvety-v-sostave',
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.categories),
      true,
      'Букеты, отсортированные по цветам, входящим в их состав. Выберите цветок из списка, чтобы увидеть все букеты, содержащие его.'
    )
    ON CONFLICT (slug) DO NOTHING;
    
    RAISE NOTICE 'Категория "Цветы в составе" создана';
  ELSE
    RAISE NOTICE 'Категория "Цветы в составе" уже существует';
  END IF;
END $$;
