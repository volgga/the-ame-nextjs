-- =============================================================================
-- Аудит Supabase: RLS для one_click_orders, индексы
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- Идемпотентно: можно запускать повторно.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) one_click_orders: включить RLS, доступ только service_role
-- Таблица заполняется только через API (service role). Чтение — только в админке (service role).
-- -----------------------------------------------------------------------------
ALTER TABLE public.one_click_orders ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "one_click_orders_service_all" ON public.one_click_orders;

-- Только service_role может SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "one_click_orders_service_all" ON public.one_click_orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 2) one_click_orders: индекс по status для админских выборок
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_one_click_orders_status
  ON public.one_click_orders (status);

-- -----------------------------------------------------------------------------
-- 3) Проверка orders: индексы (уже в db-fix.sql, на всякий случай)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- -----------------------------------------------------------------------------
-- 4) Рекомендация по orders RLS (НЕ выполняется автоматически)
-- Убедитесь в Dashboard → Authentication → Policies для таблицы orders:
-- - anon: INSERT (создание заказа)
-- - anon: SELECT только по одному id (например USING (true) и ограничение в приложении по id, либо USING (id = current_setting('request.jwt.claim.order_id', true)::uuid) если передаёте order_id через заголовок/контекст)
-- - anon или service: UPDATE только по id (для webhook оплаты)
-- Если политики нет — добавьте вручную под вашу логику (например SELECT по id из query).
-- -----------------------------------------------------------------------------
-- Пример политики "только свой заказ по id" (если заказ показывается по id в URL):
-- CREATE POLICY "orders_select_by_id" ON public.orders FOR SELECT USING (true);
-- (Ограничение "только один id" делается в коде: getOrderById(orderId) — один запрос по id.
--  Чтобы запретить anon перебирать все id, можно использовать функцию/политику с передачей id через app context — по желанию.)
-- Ничего не удаляем и не меняем в orders без явного решения.
