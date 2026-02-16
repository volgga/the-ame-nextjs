-- ============================================================================
-- Миграция: Исправление существующих policies с неправильным синтаксисом
-- ============================================================================
-- Эта миграция должна выполняться ПЕРЕД остальными, если в БД уже есть policies
-- с использованием несуществующей функции auth.is_service_role()

-- Удаляем все policies, которые могут использовать старый синтаксис
-- (это безопасно, так как мы пересоздадим их в следующих миграциях)

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Удаляем все policies на таблицах, которые будут пересозданы
  FOR r IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname LIKE '%service_role%' 
        OR policyname LIKE '%public_read%'
        OR policyname LIKE '%public_insert%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
        r.policyname, r.schemaname, r.tablename);
      RAISE NOTICE 'Dropped policy: %.%', r.tablename, r.policyname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to drop policy %.%: %', r.tablename, r.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

-- Комментарий для документации
COMMENT ON SCHEMA public IS 'Старые policies удалены. Применяйте следующие миграции для создания правильных policies.';
