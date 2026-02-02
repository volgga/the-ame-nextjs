-- Создание таблицы gift_hints для хранения "намёков о подарке"
-- Запуск: Supabase SQL Editor → вставить и выполнить

CREATE TABLE IF NOT EXISTS gift_hints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по дате создания
CREATE INDEX IF NOT EXISTS idx_gift_hints_created_at ON gift_hints(created_at DESC);

-- RLS (Row Level Security) - разрешаем вставку всем (anon), чтение только админам
ALTER TABLE gift_hints ENABLE ROW LEVEL SECURITY;

-- Политика: вставка разрешена всем анонимным пользователям
CREATE POLICY "Allow insert for anon users"
  ON gift_hints
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Политика: чтение только для service_role (админ)
CREATE POLICY "Allow read for service role"
  ON gift_hints
  FOR SELECT
  TO service_role
  USING (true);

-- Комментарии для документации
COMMENT ON TABLE gift_hints IS 'Таблица для хранения "намёков о подарке" от пользователей';
COMMENT ON COLUMN gift_hints.product_id IS 'ID товара (строка)';
COMMENT ON COLUMN gift_hints.product_title IS 'Название товара';
COMMENT ON COLUMN gift_hints.from_name IS 'Имя отправителя намёка';
COMMENT ON COLUMN gift_hints.to_name IS 'Имя получателя намёка';
COMMENT ON COLUMN gift_hints.phone IS 'Телефон получателя';
COMMENT ON COLUMN gift_hints.created_at IS 'Дата и время создания записи';
