-- =============================================================================
-- Таблица one_click_orders — заявки «Купить в 1 клик»
-- Запуск: Supabase SQL Editor → вставить и выполнить
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.one_click_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  product_id text NOT NULL,
  product_title text NOT NULL,
  price numeric NOT NULL,
  phone text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'new'
);

-- Индекс по дате для выборки и сортировки
CREATE INDEX IF NOT EXISTS idx_one_click_orders_created_at
  ON public.one_click_orders (created_at DESC);

-- Комментарии для документации
COMMENT ON TABLE public.one_click_orders IS 'Заявки из формы «Купить в 1 клик»';
COMMENT ON COLUMN public.one_click_orders.status IS 'Статус заявки: new, contacted, completed, cancelled';
