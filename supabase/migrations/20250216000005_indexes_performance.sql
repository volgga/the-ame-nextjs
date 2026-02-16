-- ============================================================================
-- Миграция: Индексы для улучшения производительности
-- ============================================================================
-- ВАЖНО: Для больших таблиц используйте CREATE INDEX CONCURRENTLY в проде
-- Эта миграция создает индексы синхронно (для небольших таблиц безопасно)

-- ============================================================================
-- Индексы для каталога товаров
-- ============================================================================

-- products: индексы для фильтрации и сортировки
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON public.products(is_hidden) WHERE is_hidden = false OR is_hidden IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug) WHERE category_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_preorder ON public.products(is_preorder) WHERE is_preorder = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new, new_until) WHERE is_new = true;

-- variant_products: аналогичные индексы
CREATE INDEX IF NOT EXISTS idx_variant_products_is_active ON public.variant_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_variant_products_is_hidden ON public.variant_products(is_hidden) WHERE is_hidden = false OR is_hidden IS NULL;
CREATE INDEX IF NOT EXISTS idx_variant_products_sort_order ON public.variant_products(sort_order NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_variant_products_slug ON public.variant_products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variant_products_category_slug ON public.variant_products(category_slug) WHERE category_slug IS NOT NULL;

-- product_variants: индексы для связи с товарами
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_sort_order ON public.product_variants(product_id, sort_order NULLS LAST);

-- ============================================================================
-- Индексы для категорий и фильтров
-- ============================================================================

-- categories: индексы для сортировки и фильтрации
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order NULLS LAST);

-- subcategories: индексы для связи с категориями
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug) WHERE slug IS NOT NULL;

-- flowers: индексы для фильтрации
CREATE INDEX IF NOT EXISTS idx_flowers_slug ON public.flowers(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flowers_is_active ON public.flowers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_flowers_sort_order ON public.flowers(sort_order NULLS LAST);

-- occasions: индексы для фильтрации
-- Примечание: таблица occasions не имеет колонки slug, только id, name, created_at, updated_at
-- Индекс на name для сортировки (если нужно)
CREATE INDEX IF NOT EXISTS idx_occasions_name ON public.occasions(name) WHERE name IS NOT NULL;

-- ============================================================================
-- Индексы для join таблиц
-- ============================================================================

-- product_flowers: индексы для быстрого поиска связей
CREATE INDEX IF NOT EXISTS idx_product_flowers_product_id ON public.product_flowers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_flowers_flower_id ON public.product_flowers(flower_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_flowers_unique ON public.product_flowers(product_id, flower_id);

-- product_occasions: индексы для быстрого поиска связей
CREATE INDEX IF NOT EXISTS idx_product_occasions_product_id ON public.product_occasions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_occasions_occasion_id ON public.product_occasions(occasion_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_occasions_unique ON public.product_occasions(product_id, occasion_id);

-- product_subcategories: индексы для быстрого поиска связей
CREATE INDEX IF NOT EXISTS idx_product_subcategories_product_id ON public.product_subcategories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_subcategories_subcategory_id ON public.product_subcategories(subcategory_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_subcategories_unique ON public.product_subcategories(product_id, subcategory_id);

-- ============================================================================
-- Индексы для блога
-- ============================================================================

-- blog_posts: индексы для фильтрации и сортировки
-- Примечание: таблица использует колонку published (boolean), а не published_at
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_sort_order ON public.blog_posts(sort_order NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- ============================================================================
-- Индексы для заказов (только для service role, но индексы помогают админке)
-- ============================================================================

-- orders: индексы для поиска и фильтрации в админке
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders((customer->>'phone')) WHERE customer->>'phone' IS NOT NULL;

-- ============================================================================
-- Индексы для доставки
-- ============================================================================

-- delivery_zones: индекс для сортировки
CREATE INDEX IF NOT EXISTS idx_delivery_zones_sort_order ON public.delivery_zones(sort_order);

-- delivery_days: индексы для фильтрации по дате
-- Примечание: таблица имеет только колонки id и date
CREATE INDEX IF NOT EXISTS idx_delivery_days_date ON public.delivery_days(date) WHERE date IS NOT NULL;

-- delivery_time_slots: индексы для связи с днями
-- Примечание: таблица имеет колонки id, day_id, start_time, end_time, sort_order
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_day_id ON public.delivery_time_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_sort_order ON public.delivery_time_slots(day_id, sort_order);

-- ============================================================================
-- Индексы для промокодов
-- ============================================================================

-- promo_codes: индекс для быстрого поиска по коду
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes(is_active) WHERE is_active = true;

-- ============================================================================
-- Индексы для правил минимального заказа
-- ============================================================================

-- minimum_order_rules: индекс для поиска по дате
CREATE INDEX IF NOT EXISTS idx_minimum_order_rules_date ON public.minimum_order_rules(date) WHERE date IS NOT NULL;

-- Комментарии для документации
COMMENT ON INDEX idx_products_is_active IS 'Ускоряет фильтрацию активных товаров';
COMMENT ON INDEX idx_products_slug IS 'Ускоряет поиск товара по slug';
COMMENT ON INDEX idx_product_variants_product_id IS 'Ускоряет загрузку вариантов товара';
COMMENT ON INDEX idx_orders_status IS 'Ускоряет фильтрацию заказов по статусу в админке';
COMMENT ON INDEX idx_orders_created_at IS 'Ускоряет сортировку заказов по дате создания';
