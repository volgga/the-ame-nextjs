-- =============================================================================
-- Заменить CHECK на discount_type: допускать только 'PERCENT' и 'FIXED' (как в приложении).
-- Запуск: Supabase SQL Editor.
-- =============================================================================

-- Удалить старый check по имени (типичное имя)
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;

-- Удалить любой другой check на discount_type (если имя отличалось)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'public.promo_codes'::regclass
      AND c.contype = 'c'
      AND a.attname = 'discount_type'
  ) LOOP
    EXECUTE format('ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Нормализовать ВСЕ строки, где discount_type не ровно 'PERCENT' или 'FIXED' (включая NULL и пустую строку)
UPDATE public.promo_codes
SET discount_type = CASE
  WHEN UPPER(TRIM(COALESCE(discount_type, ''))) = 'FIXED' THEN 'FIXED'
  ELSE 'PERCENT'
END
WHERE discount_type IS NULL
   OR TRIM(discount_type) = ''
   OR UPPER(TRIM(discount_type)) NOT IN ('PERCENT', 'FIXED');

-- Добавить правильный check (если запускаете только этот блок — сначала удалить старый)
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_type_check
  CHECK (discount_type IN ('PERCENT', 'FIXED'));
