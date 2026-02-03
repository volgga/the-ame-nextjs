-- =============================================================================
-- Таблица catalog_pages: управляемые страницы каталога (Каталог /magazin, Все цветы /posmotret-vse-tsvety).
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.catalog_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_pages_slug ON public.catalog_pages (slug);
CREATE INDEX IF NOT EXISTS idx_catalog_pages_sort ON public.catalog_pages (sort_order);

-- RLS: публичное чтение только is_active=true, запись через service_role
ALTER TABLE public.catalog_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_pages_select_public" ON public.catalog_pages;
CREATE POLICY "catalog_pages_select_public" ON public.catalog_pages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "catalog_pages_service_all" ON public.catalog_pages;
CREATE POLICY "catalog_pages_service_all" ON public.catalog_pages
  FOR ALL USING (auth.role() = 'service_role');

-- Сиды: Каталог (magazin), Все цветы (posmotret-vse-tsvety)
INSERT INTO public.catalog_pages (slug, title, description, sort_order, is_active)
VALUES
  ('magazin', 'Каталог', 'Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода.', 0, true),
  ('posmotret-vse-tsvety', 'Все цветы', 'Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких.', 1, true)
ON CONFLICT (slug) DO NOTHING;
