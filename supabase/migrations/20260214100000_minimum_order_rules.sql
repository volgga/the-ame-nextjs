-- Минимальный заказ по дате доставки.
-- Одна запись на дату; если дата повторяется — обновляем запись (upsert по date).

CREATE TABLE IF NOT EXISTS public.minimum_order_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  minimum_amount integer NOT NULL CHECK (minimum_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_minimum_order_rules_date ON public.minimum_order_rules (date);

COMMENT ON TABLE public.minimum_order_rules IS 'Минимальная сумма заказа по дате доставки (руб). Нет записи на дату — ограничений нет.';
