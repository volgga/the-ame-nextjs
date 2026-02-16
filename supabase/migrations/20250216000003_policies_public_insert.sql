-- ============================================================================
-- Миграция: Policies для публичной вставки (Public Insert-Only таблицы)
-- ============================================================================
-- Эти таблицы должны разрешать INSERT всем, но блокировать SELECT/UPDATE/DELETE для anon

-- orders: публичная вставка, чтение/обновление только через service role
-- ВАЖНО: orders содержит чувствительные данные клиентов!
DO $$
BEGIN
  -- Разрешаем INSERT всем (для создания заказов из корзины)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON public.orders
      FOR INSERT
      WITH CHECK (true);
  END IF;

  -- SELECT только через service role (для чтения заказов в админке и notify)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'service_role_select'
  ) THEN
    CREATE POLICY "service_role_select" ON public.orders
      FOR SELECT
      USING (auth.role() = 'service_role');
  END IF;

  -- UPDATE только через service role (для обновления статуса заказа)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'service_role_update'
  ) THEN
    CREATE POLICY "service_role_update" ON public.orders
      FOR UPDATE
      USING (auth.role() = 'service_role');
  END IF;

  -- DELETE только через service role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'service_role_delete'
  ) THEN
    CREATE POLICY "service_role_delete" ON public.orders
      FOR DELETE
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- one_click_orders: публичная вставка, чтение только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'one_click_orders' 
      AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON public.one_click_orders
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'one_click_orders' 
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.one_click_orders
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- leads: публичная вставка, чтение только через service role
-- ВАЖНО: leads содержит персональные данные!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON public.leads
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.leads
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- gift_hints: публичная вставка, чтение только через service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'gift_hints' 
      AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON public.gift_hints
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'gift_hints' 
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.gift_hints
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
