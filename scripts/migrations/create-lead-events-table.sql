-- =============================================================================
-- Таблица lead_events — аудит событий для форм (received, saved, tg_sent, etc.)
-- Запуск: Supabase SQL Editor → вставить и выполнить
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('received', 'saved', 'tg_sent', 'tg_failed', 'saved_failed', 'rate_limited', 'honeypot')),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON public.lead_events (type);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events (created_at DESC);

-- Комментарии для документации
COMMENT ON TABLE public.lead_events IS 'Аудит событий для форм: получение, сохранение, отправка в Telegram';
COMMENT ON COLUMN public.lead_events.lead_id IS 'ID лида из таблицы leads (может быть NULL для событий до сохранения)';
COMMENT ON COLUMN public.lead_events.type IS 'Тип события: received, saved, tg_sent, tg_failed, saved_failed, rate_limited, honeypot';
COMMENT ON COLUMN public.lead_events.meta IS 'JSONB с метаданными события (без секретов)';
