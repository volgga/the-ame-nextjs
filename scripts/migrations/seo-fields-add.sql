-- Миграция: добавление SEO полей для категорий, товаров и вариантов товаров
-- Применение: Supabase SQL Editor → выполнить этот файл
-- Дата: 2025-02

-- 1) Категории: seo_title
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title TEXT NULL;

-- 2) Простые товары (products): seo_title, seo_description, seo_keywords, og_title, og_description, og_image
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_keywords TEXT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_title TEXT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_description TEXT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_image TEXT NULL;

-- 3) Вариантные товары (variant_products): те же SEO поля
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS seo_title TEXT NULL;
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS seo_keywords TEXT NULL;
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS og_title TEXT NULL;
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS og_description TEXT NULL;
ALTER TABLE public.variant_products ADD COLUMN IF NOT EXISTS og_image TEXT NULL;

-- 4) Варианты товаров (product_variants): seo_title, seo_description, og_image
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS seo_title TEXT NULL;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS og_image TEXT NULL;
