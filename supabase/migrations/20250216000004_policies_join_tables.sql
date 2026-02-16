-- ============================================================================
-- Миграция: Policies для join таблиц (Internal таблицы)
-- ============================================================================
-- Эти таблицы используются для связей между сущностями

-- product_flowers: связь товаров и цветов
-- SELECT разрешен публично (для фильтрации), запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_flowers' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.product_flowers
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_flowers' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.product_flowers
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- product_occasions: связь товаров и поводов
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_occasions' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.product_occasions
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_occasions' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.product_occasions
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- product_subcategories: связь товаров и подкатегорий
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_subcategories' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.product_subcategories
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_subcategories' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.product_subcategories
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
