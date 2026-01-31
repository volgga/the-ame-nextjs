-- =============================================================================
-- Миграция: hero_slides, categories, category_slug в products/variant_products
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) hero_slides
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индекс по порядку
CREATE INDEX IF NOT EXISTS idx_hero_slides_sort ON public.hero_slides (sort_order);

-- -----------------------------------------------------------------------------
-- 2) categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories (sort_order);

-- -----------------------------------------------------------------------------
-- 3) category_slug в products и variant_products (опционально — если колонки нет)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_slug'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_slug TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'category_slug'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN category_slug TEXT;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) RLS: публичное чтение, запись только через service_role
-- Для anon: только SELECT. INSERT/UPDATE/DELETE — через API (service_role).
-- -----------------------------------------------------------------------------
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Политики hero_slides
DROP POLICY IF EXISTS "hero_slides_select_public" ON public.hero_slides;
CREATE POLICY "hero_slides_select_public" ON public.hero_slides
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "hero_slides_service_all" ON public.hero_slides;
CREATE POLICY "hero_slides_service_all" ON public.hero_slides
  FOR ALL USING (auth.role() = 'service_role');

-- Политики categories
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "categories_service_all" ON public.categories;
CREATE POLICY "categories_service_all" ON public.categories
  FOR ALL USING (auth.role() = 'service_role');

-- products, variant_products, product_variants: если RLS выключен — включить
-- и разрешить SELECT для anon, остальное через service_role
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть, чтобы не конфликтовали
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_service_all" ON public.products;
DROP POLICY IF EXISTS "variant_products_select_public" ON public.variant_products;
DROP POLICY IF EXISTS "variant_products_service_all" ON public.variant_products;
DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_service_all" ON public.product_variants;

-- products: SELECT для всех (каталог), остальное service_role
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_service_all" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

-- variant_products
CREATE POLICY "variant_products_select_public" ON public.variant_products
  FOR SELECT USING (true);

CREATE POLICY "variant_products_service_all" ON public.variant_products
  FOR ALL USING (auth.role() = 'service_role');

-- product_variants
CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "product_variants_service_all" ON public.product_variants
  FOR ALL USING (auth.role() = 'service_role');

-- ВАЖНО: orders — не трогаем. Там свои политики (insert anon, update для webhook).
-- Проверьте: orders должен иметь INSERT для anon и UPDATE для webhook.
