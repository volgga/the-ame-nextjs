-- =============================================================================
-- Миграция: add_on_products_categories — порядок категорий для блока
-- «Хотите добавить к заказу?» на карточке товара.
-- Управляется из раздела админки «Доп товары».
-- Запуск: Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.add_on_products_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_add_on_products_categories_slug
  ON public.add_on_products_categories (category_slug);
CREATE INDEX IF NOT EXISTS idx_add_on_products_categories_sort
  ON public.add_on_products_categories (sort_order);

-- RLS: публичное чтение (фронт подставляет товары по порядку категорий)
ALTER TABLE public.add_on_products_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "add_on_products_categories_select_public" ON public.add_on_products_categories;
CREATE POLICY "add_on_products_categories_select_public" ON public.add_on_products_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "add_on_products_categories_service_all" ON public.add_on_products_categories;
CREATE POLICY "add_on_products_categories_service_all" ON public.add_on_products_categories
  FOR ALL USING (auth.role() = 'service_role');

-- Дефолтный порядок: Сладости, Вазы, Шары, Игрушки (слаги из slugify)
INSERT INTO public.add_on_products_categories (category_slug, sort_order)
VALUES
  ('sladosti', 0),
  ('vazy', 1),
  ('shary', 2),
  ('igrushki', 3)
ON CONFLICT (category_slug) DO NOTHING;
