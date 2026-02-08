-- =============================================================================
-- Добавить ВСЕ недостающие колонки в promo_codes (если таблица была создана неполной).
-- Запуск: Supabase SQL Editor. После выполнения обновите schema cache в Supabase
-- (например перезагрузите страницу Table Editor или подождите несколько секунд).
-- =============================================================================

-- name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN code TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- discount_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'PERCENT'
      CHECK (discount_type IN ('PERCENT', 'FIXED'));
  END IF;
END $$;

-- value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'value'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN value NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- is_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- starts_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN starts_at TIMESTAMPTZ;
  END IF;
END $$;

-- ends_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Уникальность code (если ещё нет)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.promo_codes'::regclass AND conname = 'promo_codes_code_unique'
  ) THEN
    ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_code_unique UNIQUE (code);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes (code);
