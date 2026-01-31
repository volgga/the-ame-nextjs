-- =============================================================================
-- ФИНАЛЬНАЯ ЧИСТКА СХЕМЫ (The Ame)
-- Запуск: Supabase SQL Editor → вставить и выполнить
-- ВНИМАНИЕ: перед запуском сделайте бэкап!
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) hero_slides: удалить неиспользуемые колонки (если есть)
-- -----------------------------------------------------------------------------

-- Удаляем title, subtitle (если существуют)
ALTER TABLE public.hero_slides DROP COLUMN IF EXISTS title;
ALTER TABLE public.hero_slides DROP COLUMN IF EXISTS subtitle;
ALTER TABLE public.hero_slides DROP COLUMN IF EXISTS description;

-- Убедимся что sort_order и is_active NOT NULL с дефолтами
ALTER TABLE public.hero_slides ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE public.hero_slides ALTER COLUMN sort_order SET DEFAULT 0;
ALTER TABLE public.hero_slides ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.hero_slides ALTER COLUMN is_active SET DEFAULT true;

-- Индекс на sort_order
CREATE INDEX IF NOT EXISTS idx_hero_slides_sort ON public.hero_slides (sort_order);

-- -----------------------------------------------------------------------------
-- 2) categories: убедиться в правильной структуре
-- -----------------------------------------------------------------------------

-- slug должен быть UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_slug_key' AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- sort_order и is_active NOT NULL с дефолтами
ALTER TABLE public.categories ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN sort_order SET DEFAULT 0;
ALTER TABLE public.categories ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN is_active SET DEFAULT true;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- -----------------------------------------------------------------------------
-- 3) Добавить updated_at в categories если нет
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) Удалить неиспользуемые таблицы/view (ОСТОРОЖНО!)
-- Эти таблицы НЕ используются в текущем коде nextjs-project
-- -----------------------------------------------------------------------------

-- Таблицы которые точно не используются
DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS public.product_recommendations CASCADE;
DROP TABLE IF EXISTS public.promo_code_usage CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.variant_items CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.new_clients CASCADE;
DROP TABLE IF EXISTS public.discount_rules CASCADE;

-- View которые не используются
DROP VIEW IF EXISTS public.products_with_categories CASCADE;

-- Старые связующие таблицы категорий (категории теперь через category_slug)
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.variant_product_categories CASCADE;

-- -----------------------------------------------------------------------------
-- 5) НЕ УДАЛЯЕМ (критичные таблицы)
-- -----------------------------------------------------------------------------
-- products              - каталог
-- variant_products      - товары с вариантами
-- product_variants      - варианты товаров
-- orders                - заказы
-- hero_slides           - слайды
-- categories            - категории

-- -----------------------------------------------------------------------------
-- 6) Перезагрузка схемы PostgREST
-- -----------------------------------------------------------------------------
SELECT pg_notify('pgrst', 'reload schema');

-- =============================================================================
-- ГОТОВО
-- =============================================================================
