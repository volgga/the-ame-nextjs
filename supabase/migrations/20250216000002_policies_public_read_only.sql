-- ============================================================================
-- Миграция: Policies для публичного чтения (Public Read-Only таблицы)
-- ============================================================================
-- Эти таблицы читаются публично на сайте, но запись разрешена только через service role

-- Функция-хелпер для проверки service role (используется в policies)
-- Используем встроенную функцию auth.role() напрямую в policies
-- (не создаем отдельную функцию, используем прямое сравнение как в corporate_page_settings)

-- ============================================================================
-- Каталог товаров
-- ============================================================================

-- products: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'products' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.products
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'products' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.products
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- variant_products: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'variant_products' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.variant_products
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'variant_products' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.variant_products
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- product_variants: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_variants' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.product_variants
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_variants' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.product_variants
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- Категории и фильтры
-- ============================================================================

-- categories: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'categories' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.categories
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'categories' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.categories
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- subcategories: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subcategories' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.subcategories
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subcategories' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.subcategories
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- flowers: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flowers' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.flowers
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flowers' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.flowers
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- occasions: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'occasions' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.occasions
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'occasions' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.occasions
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- Контент (блог, главная)
-- ============================================================================

-- blog_posts: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'blog_posts' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.blog_posts
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'blog_posts' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.blog_posts
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- hero_slides: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'hero_slides' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.hero_slides
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'hero_slides' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.hero_slides
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- home_collections: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'home_collections' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.home_collections
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'home_collections' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.home_collections
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- home_reviews: публичное чтение, запись только через service role
-- ВАЖНО: эта таблица хранит разные данные (отзывы, FAQ, About, Order Block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'home_reviews' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.home_reviews
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'home_reviews' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.home_reviews
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- corporate_page_settings: policies уже созданы в миграции 20260214110000_corporate_page_settings.sql
-- Не создаем их здесь, чтобы избежать конфликтов

-- about_page: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'about_page' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.about_page
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'about_page' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.about_page
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- product_details: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_details' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.product_details
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_details' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.product_details
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- Доставка и промокоды
-- ============================================================================

-- delivery_zones: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_zones' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.delivery_zones
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_zones' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.delivery_zones
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- delivery_days: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_days' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.delivery_days
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_days' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.delivery_days
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- delivery_time_slots: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_time_slots' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.delivery_time_slots
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'delivery_time_slots' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.delivery_time_slots
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- promo_codes: публичное чтение (для проверки), запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'promo_codes' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.promo_codes
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'promo_codes' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.promo_codes
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- minimum_order_rules: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'minimum_order_rules' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.minimum_order_rules
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'minimum_order_rules' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.minimum_order_rules
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- add_on_products_categories: публичное чтение, запись только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'add_on_products_categories' 
      AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON public.add_on_products_categories
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'add_on_products_categories' 
      AND policyname = 'service_role_write'
  ) THEN
    CREATE POLICY "service_role_write" ON public.add_on_products_categories
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
