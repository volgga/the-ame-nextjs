-- =============================================================================
-- Аудит и настройка БД/Storage для админки товаров
-- Дата: 2026-02-01
-- =============================================================================

-- ===========================
-- 1. ПРОВЕРКА ТАБЛИЦ
-- ===========================

-- Проверить структуру products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Проверить структуру variant_products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'variant_products'
ORDER BY ordinal_position;

-- Проверить структуру product_variants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- ===========================
-- 2. ПРОВЕРКА ИНДЕКСОВ
-- ===========================

-- Индексы на products
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products';

-- Индексы на variant_products
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'variant_products';

-- Индексы на product_variants
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'product_variants';

-- ===========================
-- 3. ПРОВЕРКА RLS ПОЛИТИК
-- ===========================

-- RLS статус таблиц
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('products', 'variant_products', 'product_variants');

-- Политики на таблицах
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('products', 'variant_products', 'product_variants');

-- ===========================
-- 4. ПРОВЕРКА STORAGE
-- ===========================

-- Проверить существование bucket product-images
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'product-images';

-- Политики на storage.objects для product-images
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ===========================
-- 5. СОЗДАНИЕ НЕДОСТАЮЩИХ ОБЪЕКТОВ
-- ===========================

-- Создать bucket product-images если не существует
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- 6. RLS ПОЛИТИКИ ДЛЯ STORAGE (если нужны)
-- ===========================

-- Публичное чтение product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product-images public read'
  ) THEN
    CREATE POLICY "product-images public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Запись через service_role (админ API использует service_role, RLS не применяется)
-- Эти политики нужны только если захотите использовать anon/authenticated ключ для загрузки
-- При использовании service_role key эти политики НЕ нужны

-- ===========================
-- 7. ПРОВЕРКА ВНЕШНИХ КЛЮЧЕЙ
-- ===========================

-- FK на product_variants
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'product_variants';

-- ===========================
-- 8. ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ КОЛОНОК (если миграции не выполнены)
-- ===========================

-- composition в product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'composition'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN composition TEXT DEFAULT NULL;
    RAISE NOTICE 'Added column: product_variants.composition';
  END IF;
END $$;

-- is_preorder в product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'is_preorder'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN is_preorder BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: product_variants.is_preorder';
  END IF;
END $$;

-- category_slugs в variant_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'variant_products' AND column_name = 'category_slugs'
  ) THEN
    ALTER TABLE public.variant_products ADD COLUMN category_slugs TEXT[] DEFAULT NULL;
    RAISE NOTICE 'Added column: variant_products.category_slugs';
  END IF;
END $$;

-- images (jsonb) в products — массив URL изображений
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images JSONB DEFAULT NULL;
    RAISE NOTICE 'Added column: products.images';
  END IF;
END $$;

-- ===========================
-- 9. ПРОВЕРКА НА СИРОТСКИЕ ЗАПИСИ
-- ===========================

-- Варианты без родительского товара
SELECT pv.id, pv.title, pv.product_id
FROM product_variants pv
LEFT JOIN variant_products vp ON pv.product_id = vp.id
WHERE vp.id IS NULL;

-- ===========================
-- 10. ИТОГОВЫЕ ПРОВЕРКИ
-- ===========================

-- Количество записей в таблицах
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'variant_products', COUNT(*) FROM variant_products
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants;
