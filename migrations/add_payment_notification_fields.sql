-- Миграция: добавление полей для идемпотентности уведомлений о платежах
-- Дата: 2026-02-12
-- Описание: Добавляет поля для отслеживания факта отправки уведомлений в Telegram
--            о успешной/неуспешной оплате заказа, чтобы предотвратить дубликаты

-- Добавляем поле для отслеживания отправки уведомления об успешной оплате
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_success_notified_at TIMESTAMPTZ NULL;

-- Добавляем поле для отслеживания отправки уведомления о неуспешной оплате
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_fail_notified_at TIMESTAMPTZ NULL;

-- Комментарии к полям (для документации в БД)
COMMENT ON COLUMN orders.payment_success_notified_at IS 'Время отправки уведомления в Telegram об успешной оплате заказа. NULL если еще не отправляли.';
COMMENT ON COLUMN orders.payment_fail_notified_at IS 'Время отправки уведомления в Telegram о неуспешной оплате заказа. NULL если еще не отправляли.';
