-- =============================================================================
-- Таблица leads — универсальная таблица для всех форм (one-click, bouquet, gift-hint)
-- Запуск: Supabase SQL Editor → вставить и выполнить
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('one_click', 'bouquet', 'gift_hint')),
  name text,
  phone text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_leads_type ON public.leads (type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);

-- Комментарии для документации
COMMENT ON TABLE public.leads IS 'Универсальная таблица для всех форм: one-click, bouquet, gift-hint';
COMMENT ON COLUMN public.leads.type IS 'Тип формы: one_click, bouquet, gift_hint';
COMMENT ON COLUMN public.leads.payload IS 'JSONB со всеми полями формы (зависит от типа)';
COMMENT ON COLUMN public.leads.page_url IS 'URL страницы, с которой была отправлена форма';
