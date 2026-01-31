-- [АРХИВ] Миграция orders. Актуальная схема и миграции — scripts/db-fix.sql.

-- CREATE TABLE IF NOT EXISTS public.orders ( ... );
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
-- Индексы, RLS, триггер set_updated_at — всё объединено в db-fix.sql.
