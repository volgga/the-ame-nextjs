-- =============================================================================
-- Сид: категории "Каталог" (magazin) и "Все цветы" (posmotret-vse-tsvety).
-- Редактируются в админке "Категории". Upsert по slug — повторный запуск не дублирует.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Убедимся, что поле description есть (на случай если не применяли categories-add-description)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN description TEXT;
  END IF;
END $$;

-- Каталог (страница /magazin)
INSERT INTO public.categories (slug, name, description, sort_order, is_active)
VALUES (
  'magazin',
  'Каталог',
  'Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.',
  (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM public.categories),
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Все цветы (страница /posmotret-vse-tsvety)
INSERT INTO public.categories (slug, name, description, sort_order, is_active)
VALUES (
  'posmotret-vse-tsvety',
  'Все цветы',
  'Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.',
  (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM public.categories),
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
