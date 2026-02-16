# План отката миграций RLS

## ⚠️ ВНИМАНИЕ
Откат миграций RLS может временно открыть доступ к данным. Используйте только в случае критических проблем.

## Откат миграций (в обратном порядке)

### 1. Откат индексов (20250216000005)
```sql
-- Удаление индексов (если нужно)
DROP INDEX IF EXISTS idx_products_is_active;
DROP INDEX IF EXISTS idx_products_slug;
-- ... (остальные индексы)
```

### 2. Откат policies для join таблиц (20250216000004)
```sql
DROP POLICY IF EXISTS "service_role_write" ON public.product_flowers;
DROP POLICY IF EXISTS "public_read" ON public.product_flowers;
-- ... (аналогично для product_occasions, product_subcategories)
```

### 3. Откат policies для insert-only таблиц (20250216000003)
```sql
-- orders
DROP POLICY IF EXISTS "service_role_delete" ON public.orders;
DROP POLICY IF EXISTS "service_role_update" ON public.orders;
DROP POLICY IF EXISTS "service_role_select" ON public.orders;
DROP POLICY IF EXISTS "public_insert" ON public.orders;

-- one_click_orders
DROP POLICY IF EXISTS "service_role_all" ON public.one_click_orders;
DROP POLICY IF EXISTS "public_insert" ON public.one_click_orders;

-- leads
DROP POLICY IF EXISTS "service_role_all" ON public.leads;
DROP POLICY IF EXISTS "public_insert" ON public.leads;

-- gift_hints
DROP POLICY IF EXISTS "service_role_all" ON public.gift_hints;
DROP POLICY IF EXISTS "public_insert" ON public.gift_hints;
```

### 4. Откат policies для read-only таблиц (20250216000002)
```sql
-- Для каждой таблицы удаляем policies
DROP POLICY IF EXISTS "service_role_write" ON public.products;
DROP POLICY IF EXISTS "public_read" ON public.products;
-- ... (повторить для всех таблиц из миграции)
```

### 5. Отключение RLS (20250216000001)
```sql
-- ⚠️ ОПАСНО: отключает RLS на всех таблицах
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
      RAISE NOTICE 'RLS disabled on table: %', r.tablename;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to disable RLS on table %: %', r.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
```

## Безопасный частичный откат

Если нужно временно открыть доступ к конкретной таблице:

```sql
-- Временно отключить RLS на одной таблице
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Или удалить конкретную policy
DROP POLICY IF EXISTS "public_read" ON public.products;
```

## Проверка после отката

```sql
-- Проверить что RLS отключен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;

-- Проверить что policies удалены
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```
