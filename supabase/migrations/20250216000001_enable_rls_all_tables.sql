-- ============================================================================
-- Миграция: Включение RLS на всех таблицах public схемы
-- ============================================================================
-- Безопасность: только включает RLS, не добавляет policies (это в следующей миграции)
-- Откат: можно отключить RLS через ALTER TABLE ... DISABLE ROW LEVEL SECURITY

-- Включаем RLS на всех таблицах public схемы
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_%'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
      RAISE NOTICE 'RLS enabled on table: %', r.tablename;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to enable RLS on table %: %', r.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- Комментарий для документации
COMMENT ON SCHEMA public IS 'RLS включен на всех таблицах. Policies добавляются в следующих миграциях.';
