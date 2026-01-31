-- =============================================================================
-- Фикс схемы Supabase: FK, индексы, поля оплаты, стандартизация amount.
-- Запуск: Supabase Dashboard → SQL Editor → вставить и выполнить.
-- Идемпотентно: можно запускать повторно.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) orders: стандартизация amount (если в БД было total_amount)
-- Код приложения везде использует amount (bigint, копейки). Если колонка
-- называется total_amount — переименовываем в amount.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN total_amount TO amount;
  END IF;
END $$;

-- Если amount нет — добавляем (на случай старой схемы без amount и без total_amount)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount BIGINT;
UPDATE public.orders SET amount = 0 WHERE amount IS NULL;
ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2) orders: поля под оплату
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tinkoff_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'tinkoff';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
-- payment_status не добавляем: используется существующее поле status
-- (created | payment_pending | paid | canceled | failed)

-- Переносим tinkoff_payment_id в payment_id только если колонка уже была в БД (данные)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tinkoff_payment_id'
  ) THEN
    UPDATE public.orders SET payment_id = tinkoff_payment_id WHERE payment_id IS NULL AND tinkoff_payment_id IS NOT NULL;
  END IF;
END $$;
UPDATE public.orders SET payment_provider = 'tinkoff' WHERE payment_provider IS NULL;

-- -----------------------------------------------------------------------------
-- 3) orders: индексы (если ещё нет)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- -----------------------------------------------------------------------------
-- 4) product_variants → variant_products: FK
-- product_id должен ссылаться на variant_products.id. ON DELETE CASCADE:
-- при удалении variant_product удаляются все его варианты.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_variants_product_id_fkey'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.variant_products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL; -- variant_products может не существовать в тесте
END $$;

-- -----------------------------------------------------------------------------
-- 5) products.slug UNIQUE (для поиска по slug)
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON public.products (slug) WHERE slug IS NOT NULL AND slug <> '';

-- Если в проекте slug всегда заполнен — можно жёсткий UNIQUE:
-- ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
-- (раскомментировать при необходимости)

-- -----------------------------------------------------------------------------
-- 6) variant_products.slug UNIQUE
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_products_slug_unique
  ON public.variant_products (slug) WHERE slug IS NOT NULL AND slug <> '';

-- -----------------------------------------------------------------------------
-- 7) Индексы по связкам: product_variants(product_id)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants (product_id);

-- -----------------------------------------------------------------------------
-- 8) orders: user_id (если есть) — сделать nullable, чтобы не ломалось без auth
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Снять FK с user_id если он ссылается на auth.users (по имени ограничения)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'orders' AND c.contype = 'f'
      AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.conrelid AND a.attname = 'user_id' AND a.attnum = ANY(c.conkey))
  ) LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMIT;

-- Перезагрузка схемы PostgREST
SELECT pg_notify('pgrst', 'reload schema');
