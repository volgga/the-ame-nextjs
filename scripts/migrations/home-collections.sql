-- =============================================================================
-- Миграция: home_collections — карточки для блока «КОЛЛЕКЦИИ THE ÁME» на главной.
-- По аналогии с hero_slides. Запуск: Supabase SQL Editor.
-- =============================================================================

-- 1) Таблица home_collections (category_slug — ссылка формируется как /magazine/{slug})
CREATE TABLE IF NOT EXISTS public.home_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  name TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT 'magazin',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_collections_sort ON public.home_collections (sort_order);

-- 2) RLS
ALTER TABLE public.home_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_collections_select_public" ON public.home_collections;
CREATE POLICY "home_collections_select_public" ON public.home_collections
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "home_collections_service_all" ON public.home_collections;
CREATE POLICY "home_collections_service_all" ON public.home_collections
  FOR ALL USING (auth.role() = 'service_role');

-- 3) Bucket home-collections: создать в Supabase Dashboard → Storage → New bucket
-- Имя: home-collections, Public: true
-- Либо через SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('home-collections', 'home-collections', true) ON CONFLICT (id) DO NOTHING;
-- Политики Storage: public read, service_role write/update/delete (как hero-slides)
