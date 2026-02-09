-- =============================================================================
-- Миграция: создание таблицы occasions (По поводу)
-- Описание: сущность "По поводу" для привязки к товарам
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Создаём функцию для обновления updated_at (если её ещё нет)
CREATE OR REPLACE FUNCTION update_occasions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- Создаём таблицу occasions, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'occasions'
  ) THEN
    CREATE TABLE public.occasions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Индекс для поиска по названию
    CREATE INDEX idx_occasions_name ON public.occasions(name);

    -- Триггер для автоматического обновления updated_at
    CREATE TRIGGER update_occasions_updated_at_trigger
      BEFORE UPDATE ON public.occasions
      FOR EACH ROW
      EXECUTE FUNCTION update_occasions_updated_at();

    RAISE NOTICE 'Created table: occasions';
  ELSE
    RAISE NOTICE 'Table occasions already exists';
  END IF;
END $$;
