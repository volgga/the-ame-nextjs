-- Добавление колонок currency и customer в таблицу orders (для совместимости с кодом и PostgREST).
-- Запуск: Supabase Dashboard → SQL Editor → вставить и выполнить.
-- После выполнения: перезагрузить схему PostgREST (см. комментарий внизу).

-- currency
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT;
UPDATE public.orders SET currency = 'RUB' WHERE currency IS NULL;
ALTER TABLE public.orders ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'RUB';

-- customer (JSONB: имя, телефон, адрес, дата/время доставки и т.д.)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB;
UPDATE public.orders SET customer = '{}'::jsonb WHERE customer IS NULL;
ALTER TABLE public.orders ALTER COLUMN customer SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer SET DEFAULT '{}'::jsonb;

-- Перезагрузка кэша схемы PostgREST (иначе ошибка "Could not find the '...' column"):
-- SELECT pg_notify('pgrst', 'reload schema');
-- Или: Dashboard → Settings → API → Reload schema / перезапуск проекта.
