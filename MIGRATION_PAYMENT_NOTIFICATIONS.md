# Миграция: Добавление полей для идемпотентности уведомлений о платежах

## Описание

Добавляет два поля в таблицу `orders` для отслеживания факта отправки уведомлений в Telegram о платежах. Это предотвращает дубликаты уведомлений при повторных вызовах webhook от Tinkoff.

## Поля

- `payment_success_notified_at` (TIMESTAMPTZ, NULL) — время отправки уведомления об успешной оплате
- `payment_fail_notified_at` (TIMESTAMPTZ, NULL) — время отправки уведомления о неуспешной оплате

## Способы выполнения миграции

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)
4. Скопируйте и выполните один из вариантов SQL ниже:

**Вариант A: Полная версия с комментариями** (из файла `migrations/add_payment_notification_fields.sql`)

**Вариант B: Краткая версия для быстрого выполнения:**

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_success_notified_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS payment_fail_notified_at TIMESTAMPTZ NULL;
```

5. Нажмите **Run** (или `Ctrl/Cmd + Enter`)
6. Убедитесь, что выполнение прошло успешно (должно быть сообщение "Success")

### Вариант 2: Через Supabase CLI (если установлен)

```bash
# Если у вас настроен Supabase CLI локально
supabase db push

# Или выполните SQL напрямую
supabase db execute --file migrations/add_payment_notification_fields.sql
```

### Вариант 3: Через psql (если есть прямой доступ к БД)

```bash
# Подключитесь к вашей БД Supabase через psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Выполните миграцию
\i migrations/add_payment_notification_fields.sql
```

### Вариант 4: Через API (программно)

Если нужно выполнить миграцию программно через Supabase API:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Используйте service role key для миграций
);

const sql = `
  ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_success_notified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS payment_fail_notified_at TIMESTAMPTZ NULL;
`;

await supabase.rpc('exec_sql', { sql });
```

## Проверка выполнения

После выполнения миграции проверьте, что поля добавлены:

### Через Supabase Dashboard:

1. Перейдите в **Table Editor**
2. Выберите таблицу `orders`
3. Проверьте, что в списке колонок появились:
   - `payment_success_notified_at`
   - `payment_fail_notified_at`

### Через SQL:

```sql
-- Проверить структуру таблицы
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('payment_success_notified_at', 'payment_fail_notified_at');
```

Должно вернуться 2 строки с типами `timestamp with time zone` и `YES` в `is_nullable`.

## Откат миграции (если нужно)

Если нужно откатить изменения:

```sql
ALTER TABLE orders 
DROP COLUMN IF EXISTS payment_success_notified_at,
DROP COLUMN IF EXISTS payment_fail_notified_at;
```

## Важные замечания

1. **Безопасность**: Миграция использует `IF NOT EXISTS`, поэтому безопасно выполнять её повторно
2. **Существующие данные**: Для существующих заказов поля будут `NULL`, что корректно (уведомления еще не отправлялись)
3. **Производительность**: Добавление колонок с `NULL` по умолчанию не блокирует таблицу и выполняется быстро
4. **RLS (Row Level Security)**: Убедитесь, что политики RLS для таблицы `orders` позволяют обновлять эти поля (обычно это уже настроено для `update` операций)

## После выполнения миграции

После успешного выполнения миграции:

1. Код уже готов к работе (изменения в `src/services/orders.ts` и обработчиках webhook)
2. При следующем вызове webhook от Tinkoff система автоматически начнет отслеживать отправку уведомлений
3. Дубликаты уведомлений больше не будут отправляться

## Тестирование

После миграции протестируйте:

1. Создайте тестовый заказ
2. Симулируйте успешную оплату через webhook
3. Повторите тот же webhook еще раз
4. Проверьте логи — второй вызов должен содержать `"already sent, skipping"`
5. В Telegram должно прийти только одно уведомление
