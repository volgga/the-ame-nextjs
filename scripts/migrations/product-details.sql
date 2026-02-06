-- Глобальные детали товаров (один набор на весь каталог): Подарок при заказе.
-- Singleton: одна строка (id = 1). Редактируется в админке на странице «Товары» → «Детали».

CREATE TABLE IF NOT EXISTS product_details (
  id INT PRIMARY KEY DEFAULT 1,
  kit TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_details_single_row CHECK (id = 1)
);

-- Единственная строка
INSERT INTO product_details (id, kit)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS: публичное чтение (карточки товаров), запись только через service_role в API
ALTER TABLE product_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON product_details
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow service role all"
  ON product_details
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE product_details IS 'Глобальный текст для всех карточек товаров: подарок при заказе';
