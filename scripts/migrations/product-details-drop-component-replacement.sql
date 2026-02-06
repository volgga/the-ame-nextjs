-- Удаление поля «Замена компонентов» из глобальных деталей товаров.
-- Остаётся только «Подарок при заказе» (колонка kit).

ALTER TABLE product_details
  DROP COLUMN IF EXISTS component_replacement;

COMMENT ON TABLE product_details IS 'Глобальный текст для всех карточек товаров: подарок при заказе';
