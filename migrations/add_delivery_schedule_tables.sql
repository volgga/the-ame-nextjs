-- Миграция: добавление таблиц для настройки времени доставки по датам
-- Дата: 2026-02-12
-- Описание: Добавляет таблицы для хранения кастомных интервалов времени доставки для конкретных дат

-- Таблица дней доставки
CREATE TABLE IF NOT EXISTS delivery_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица интервалов времени для дней
CREATE TABLE IF NOT EXISTS delivery_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES delivery_days(id) ON DELETE CASCADE,
  start_time VARCHAR(5) NOT NULL CHECK (start_time ~ '^[0-9]{2}:[0-9]{2}$'),
  end_time VARCHAR(5) NOT NULL CHECK (end_time ~ '^[0-9]{2}:[0-9]{2}$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_format CHECK (
    start_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
    end_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  CONSTRAINT start_before_end CHECK (
    start_time < end_time
  )
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_delivery_days_date ON delivery_days(date);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_day_id ON delivery_time_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_sort_order ON delivery_time_slots(day_id, sort_order);

-- Комментарии к таблицам
COMMENT ON TABLE delivery_days IS 'Дни с кастомными интервалами времени доставки';
COMMENT ON TABLE delivery_time_slots IS 'Интервалы времени доставки для конкретных дней';
COMMENT ON COLUMN delivery_time_slots.start_time IS 'Время начала в формате HH:MM';
COMMENT ON COLUMN delivery_time_slots.end_time IS 'Время окончания в формате HH:MM';
COMMENT ON COLUMN delivery_time_slots.sort_order IS 'Порядок сортировки интервалов в рамках дня';
