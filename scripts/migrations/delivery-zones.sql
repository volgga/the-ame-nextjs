-- =============================================================================
-- Миграция: delivery_zones — зоны доставки для страницы "Доставка и оплата"
-- Запуск: Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_title TEXT NOT NULL,
  paid_up_to INT NOT NULL DEFAULT 0,
  delivery_price INT NOT NULL DEFAULT 0,
  free_from INT NOT NULL DEFAULT 0,
  subareas_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_sort ON public.delivery_zones (sort_order);

-- RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_zones_select_public" ON public.delivery_zones;
CREATE POLICY "delivery_zones_select_public" ON public.delivery_zones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "delivery_zones_service_all" ON public.delivery_zones;
CREATE POLICY "delivery_zones_service_all" ON public.delivery_zones
  FOR ALL USING (auth.role() = 'service_role');

-- Сид данных по умолчанию (если таблица пуста)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.delivery_zones LIMIT 1) THEN
    INSERT INTO public.delivery_zones (zone_title, paid_up_to, delivery_price, free_from, sort_order) VALUES
      ('Центр Сочи', 4000, 300, 4000, 0),
      ('Дагомыс, Мацеста', 5000, 500, 5000, 1),
      ('Хоста', 7000, 700, 7000, 2),
      ('Адлер', 9000, 900, 9000, 3),
      ('Сириус, Лоо', 12000, 1200, 12000, 4),
      ('п. Красная поляна', 18000, 1800, 18000, 5),
      ('п. Эсто-Садок', 20000, 2000, 20000, 6),
      ('п. Роза-Хутор', 22000, 2200, 22000, 7),
      ('На высоту 960м (Роза-Хутор/Горки город)', 24000, 2400, 24000, 8);
  END IF;
END $$;
