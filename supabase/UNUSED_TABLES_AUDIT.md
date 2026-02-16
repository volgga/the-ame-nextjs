# Аудит неиспользуемых таблиц и колонок

## ⚠️ ВНИМАНИЕ
Этот отчет содержит предположения на основе анализа кода. **НЕ УДАЛЯЙТЕ** таблицы/колонки без дополнительной проверки в проде!

## Методология

1. Поиск всех использований таблиц через `.from('table_name')`
2. Поиск упоминаний колонок в коде
3. Проверка foreign keys и связей
4. Рекомендации по безопасной очистке

## Таблицы, найденные в коде

### ✅ Активно используемые таблицы (НЕ удалять)

Все таблицы из `INVENTORY.md` активно используются.

## Возможные неиспользуемые таблицы

⚠️ **ТРЕБУЕТ ПРОВЕРКИ В ПРОДЕ**

Для проверки выполните в Supabase SQL Editor:

```sql
-- Список всех таблиц в public схеме
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Сравните с таблицами из INVENTORY.md
-- Если есть таблицы не из списка — проверьте их использование
```

## Рекомендации по безопасной очистке

### Этап 1: Пометить как deprecated (безопасно)

```sql
-- Добавить комментарий к таблице
COMMENT ON TABLE public.unknown_table IS 'DEPRECATED: Проверить использование перед удалением. Дата проверки: 2025-02-16';
```

### Этап 2: Логирование обращений (если возможно)

Создать триггер для логирования обращений к таблице:

```sql
CREATE TABLE IF NOT EXISTS public.table_access_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  operation text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  user_role text
);

CREATE OR REPLACE FUNCTION log_table_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.table_access_log (table_name, operation, user_role)
  VALUES (TG_TABLE_NAME, TG_OP, current_setting('request.jwt.claims', true)::json->>'role');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пример для подозрительной таблицы
CREATE TRIGGER log_access_unknown_table
  AFTER INSERT OR UPDATE OR DELETE OR SELECT
  ON public.unknown_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION log_table_access();
```

### Этап 3: Удаление (только после подтверждения)

```sql
-- ТОЛЬКО после подтверждения что таблица не используется!
-- 1. Сделать бэкап
-- 2. Проверить что нет foreign keys на эту таблицу
-- 3. Удалить таблицу

DROP TABLE IF EXISTS public.unknown_table CASCADE;
```

## Проверка неиспользуемых колонок

Для каждой таблицы можно проверить использование колонок:

```sql
-- Пример: проверить какие колонки есть в таблице products
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;
```

Затем сравнить с использованием в коде (поиск по названиям колонок).

## Foreign Keys и связи

Проверить все foreign keys:

```sql
-- Все foreign keys в базе
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## Рекомендации

1. **Не удаляйте таблицы сразу** — сначала пометьте как deprecated
2. **Мониторьте обращения** — используйте логирование если возможно
3. **Проверьте в проде** — выполните запросы из `checks.sql` для понимания структуры
4. **Делайте бэкапы** — перед любыми destructive операциями

## Следующие шаги

1. Выполнить `supabase/checks.sql` в проде для получения полного списка таблиц
2. Сравнить с таблицами из `INVENTORY.md`
3. Для подозрительных таблиц — добавить комментарии и логирование
4. Через месяц проверить логи и принять решение об удалении
