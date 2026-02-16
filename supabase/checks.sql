-- ============================================================================
-- Проверка состояния RLS и Policies в Supabase
-- ============================================================================
-- Использование: выполнить в Supabase SQL Editor для аудита текущего состояния

-- 1. Таблицы без RLS (должны быть пустыми после миграций)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 2. Все таблицы с их RLS статусом
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS включен'
    ELSE '❌ RLS выключен'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Список всех policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Таблицы без policies (критично!)
SELECT 
  t.schemaname,
  t.tablename,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true  -- RLS включен, но нет policies
GROUP BY t.schemaname, t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- 5. Публичные привилегии на таблицы (должны быть ограничены)
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- 6. Статистика по таблицам (для понимания размера)
SELECT 
  schemaname,
  relname as tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- 7. Индексы на таблицах (для анализа производительности)
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. Foreign keys (для понимания связей)
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
