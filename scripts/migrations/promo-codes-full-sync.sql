-- =============================================================================
-- ПРОМОКОДЫ: полная синхронизация таблицы с приложением (один запуск — без ошибок).
-- Приложение использует: id, code, name, discount_type, value, is_active, starts_at, ends_at, created_at, updated_at.
-- Запуск: Supabase SQL Editor — выполнить весь файл целиком.
-- =============================================================================

-- 1) Таблица есть? Добавляем недостающие колонки (если таблица создана вручную/по-другому)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promo_codes') THEN
    CREATE TABLE public.promo_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      discount_type TEXT NOT NULL DEFAULT 'PERCENT',
      value NUMERIC(10, 2) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT promo_codes_code_unique UNIQUE (code),
      CONSTRAINT promo_codes_discount_type_check CHECK (discount_type IN ('PERCENT', 'FIXED'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes (code);
    ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;
    CREATE POLICY "promo_codes_select_active" ON public.promo_codes FOR SELECT USING (is_active = true);
    DROP POLICY IF EXISTS "promo_codes_service_all" ON public.promo_codes;
    CREATE POLICY "promo_codes_service_all" ON public.promo_codes FOR ALL USING (auth.role() = 'service_role');
    RETURN;
  END IF;
END $$;

-- 2) Добавить колонки по одной, если их нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'name') THEN
    ALTER TABLE public.promo_codes ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'code') THEN
    ALTER TABLE public.promo_codes ADD COLUMN code TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'discount_type') THEN
    ALTER TABLE public.promo_codes ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'PERCENT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'value') THEN
    ALTER TABLE public.promo_codes ADD COLUMN value NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'is_active') THEN
    ALTER TABLE public.promo_codes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'starts_at') THEN
    ALTER TABLE public.promo_codes ADD COLUMN starts_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'ends_at') THEN
    ALTER TABLE public.promo_codes ADD COLUMN ends_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'created_at') THEN
    ALTER TABLE public.promo_codes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'updated_at') THEN
    ALTER TABLE public.promo_codes ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- 3) discount_amount: если колонка есть — сделать nullable с default (приложение её не шлёт)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'discount_amount') THEN
    UPDATE public.promo_codes SET discount_amount = 0 WHERE discount_amount IS NULL;
    ALTER TABLE public.promo_codes ALTER COLUMN discount_amount SET DEFAULT 0, ALTER COLUMN discount_amount DROP NOT NULL;
  END IF;
END $$;

-- 4) Удалить старый check по discount_type (любой)
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'public.promo_codes'::regclass AND c.contype = 'c' AND a.attname = 'discount_type'
  ) LOOP
    EXECUTE format('ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 5) Привести ВСЕ строки к ровно 'PERCENT' или 'FIXED' (CHECK чувствителен к регистру)
-- Обновляем любую строку, где значение не равно ровно 'PERCENT' и не равно ровно 'FIXED'
UPDATE public.promo_codes
SET discount_type = CASE
  WHEN UPPER(TRIM(COALESCE(discount_type, ''))) = 'FIXED' THEN 'FIXED'
  ELSE 'PERCENT'
END
WHERE discount_type IS DISTINCT FROM 'PERCENT'
  AND discount_type IS DISTINCT FROM 'FIXED';

-- 6) Добавить check
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_type_check
  CHECK (discount_type IN ('PERCENT', 'FIXED'));

-- 7) Уникальность code и индекс (если ещё нет)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.promo_codes'::regclass AND conname = 'promo_codes_code_unique') THEN
    ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_code_unique UNIQUE (code);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes (code);

-- 8) RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;
CREATE POLICY "promo_codes_select_active" ON public.promo_codes FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "promo_codes_service_all" ON public.promo_codes;
CREATE POLICY "promo_codes_service_all" ON public.promo_codes FOR ALL USING (auth.role() = 'service_role');
