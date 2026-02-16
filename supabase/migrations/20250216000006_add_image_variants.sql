-- Миграция: добавление полей для предгенерированных размеров изображений
-- Цель: хранить ссылки на thumb, medium, large версии в форматах WebP и AVIF
-- Это позволит избежать ресайза "на лету" и ускорить загрузку

-- ============================================
-- Таблица products (простые товары)
-- ============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_url TEXT,
  ADD COLUMN IF NOT EXISTS image_thumb_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_avif_url TEXT;

COMMENT ON COLUMN public.products.image_thumb_url IS 'URL превью ~320px (WebP)';
COMMENT ON COLUMN public.products.image_medium_url IS 'URL среднего размера ~768px (WebP)';
COMMENT ON COLUMN public.products.image_large_url IS 'URL большого размера ~1400px (WebP)';
COMMENT ON COLUMN public.products.image_thumb_avif_url IS 'URL превью ~320px (AVIF, опционально)';
COMMENT ON COLUMN public.products.image_medium_avif_url IS 'URL среднего размера ~768px (AVIF, опционально)';
COMMENT ON COLUMN public.products.image_large_avif_url IS 'URL большого размера ~1400px (AVIF, опционально)';

-- Для массива images: создаем JSONB структуру для хранения вариантов
-- Если images уже используется как string[], оставляем как есть для обратной совместимости
-- Новые поля для вариантов каждого изображения в массиве (если нужно будет расширить)

-- ============================================
-- Таблица variant_products (вариантные товары)
-- ============================================
ALTER TABLE public.variant_products
  ADD COLUMN IF NOT EXISTS image_thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_url TEXT,
  ADD COLUMN IF NOT EXISTS image_thumb_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_avif_url TEXT;

COMMENT ON COLUMN public.variant_products.image_thumb_url IS 'URL превью ~320px (WebP)';
COMMENT ON COLUMN public.variant_products.image_medium_url IS 'URL среднего размера ~768px (WebP)';
COMMENT ON COLUMN public.variant_products.image_large_url IS 'URL большого размера ~1400px (WebP)';
COMMENT ON COLUMN public.variant_products.image_thumb_avif_url IS 'URL превью ~320px (AVIF, опционально)';
COMMENT ON COLUMN public.variant_products.image_medium_avif_url IS 'URL среднего размера ~768px (AVIF, опционально)';
COMMENT ON COLUMN public.variant_products.image_large_avif_url IS 'URL большого размера ~1400px (AVIF, опционально)';

-- ============================================
-- Таблица product_variants (варианты товаров)
-- ============================================
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS image_thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_url TEXT,
  ADD COLUMN IF NOT EXISTS image_thumb_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_medium_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS image_large_avif_url TEXT;

COMMENT ON COLUMN public.product_variants.image_thumb_url IS 'URL превью ~320px (WebP)';
COMMENT ON COLUMN public.product_variants.image_medium_url IS 'URL среднего размера ~768px (WebP)';
COMMENT ON COLUMN public.product_variants.image_large_url IS 'URL большого размера ~1400px (WebP)';
COMMENT ON COLUMN public.product_variants.image_thumb_avif_url IS 'URL превью ~320px (AVIF, опционально)';
COMMENT ON COLUMN public.product_variants.image_medium_avif_url IS 'URL среднего размера ~768px (AVIF, опционально)';
COMMENT ON COLUMN public.product_variants.image_large_avif_url IS 'URL большого размера ~1400px (AVIF, опционально)';

-- ============================================
-- Таблица blog_posts
-- ============================================
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS cover_image_thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_medium_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_large_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_thumb_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_medium_avif_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_large_avif_url TEXT;

COMMENT ON COLUMN public.blog_posts.cover_image_thumb_url IS 'URL превью обложки ~320px (WebP)';
COMMENT ON COLUMN public.blog_posts.cover_image_medium_url IS 'URL среднего размера обложки ~768px (WebP)';
COMMENT ON COLUMN public.blog_posts.cover_image_large_url IS 'URL большого размера обложки ~1400px (WebP)';
COMMENT ON COLUMN public.blog_posts.cover_image_thumb_avif_url IS 'URL превью обложки ~320px (AVIF, опционально)';
COMMENT ON COLUMN public.blog_posts.cover_image_medium_avif_url IS 'URL среднего размера обложки ~768px (AVIF, опционально)';
COMMENT ON COLUMN public.blog_posts.cover_image_large_avif_url IS 'URL большого размера обложки ~1400px (AVIF, опционально)';

-- ============================================
-- Таблица hero_slides (слайды для Hero карусели)
-- ============================================
DO $$
BEGIN
  -- Проверяем существование таблицы перед добавлением колонок
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hero_slides') THEN
    ALTER TABLE public.hero_slides
      ADD COLUMN IF NOT EXISTS image_thumb_url TEXT,
      ADD COLUMN IF NOT EXISTS image_medium_url TEXT,
      ADD COLUMN IF NOT EXISTS image_large_url TEXT,
      ADD COLUMN IF NOT EXISTS image_thumb_avif_url TEXT,
      ADD COLUMN IF NOT EXISTS image_medium_avif_url TEXT,
      ADD COLUMN IF NOT EXISTS image_large_avif_url TEXT;

    COMMENT ON COLUMN public.hero_slides.image_thumb_url IS 'URL превью слайда ~320px (WebP)';
    COMMENT ON COLUMN public.hero_slides.image_medium_url IS 'URL среднего размера слайда ~768px (WebP)';
    COMMENT ON COLUMN public.hero_slides.image_large_url IS 'URL большого размера слайда ~1400px (WebP)';
    COMMENT ON COLUMN public.hero_slides.image_thumb_avif_url IS 'URL превью слайда ~320px (AVIF, опционально)';
    COMMENT ON COLUMN public.hero_slides.image_medium_avif_url IS 'URL среднего размера слайда ~768px (AVIF, опционально)';
    COMMENT ON COLUMN public.hero_slides.image_large_avif_url IS 'URL большого размера слайда ~1400px (AVIF, опционально)';
  END IF;
END $$;

-- ============================================
-- Таблица corporate_page_settings
-- Примечание: images здесь - это JSONB массив, поэтому для каждого изображения
-- нужно будет хранить варианты внутри JSONB структуры
-- Пока добавляем поля для основного изображения (если есть)
-- ============================================
-- Для corporate_page_settings images - это массив, варианты будут храниться внутри JSONB
-- Пример структуры: [{"original": "...", "thumb": "...", "medium": "...", "large": "...", "thumbAvif": "...", ...}, ...]

-- ============================================
-- Индексы (опционально, если нужен поиск по URL)
-- ============================================
-- CREATE INDEX IF NOT EXISTS idx_products_image_thumb_url ON public.products(image_thumb_url) WHERE image_thumb_url IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_variant_products_image_thumb_url ON public.variant_products(image_thumb_url) WHERE image_thumb_url IS NOT NULL;
