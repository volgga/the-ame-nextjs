# Миграция: Настройка времени доставки по датам

## Описание
Добавлена возможность настраивать кастомные интервалы времени доставки для конкретных дат через админ-панель.

## Файлы миграции
- `migrations/add_delivery_schedule_tables.sql` - SQL миграция для создания таблиц

## Как применить миграцию

### Вариант 1: Через Supabase Dashboard (рекомендуется)
1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Перейдите в раздел SQL Editor
3. Скопируйте содержимое файла `migrations/add_delivery_schedule_tables.sql`
4. Вставьте в SQL Editor и выполните (Run)

### Вариант 2: Через Supabase CLI (если установлен)
```bash
# Если у вас настроен Supabase CLI локально
supabase db push

# Или выполните SQL напрямую
supabase db execute --file migrations/add_delivery_schedule_tables.sql
```

### Вариант 3: Через psql
```bash
# Подключитесь к вашей БД Supabase через psql
psql -h <your-supabase-host> -U postgres -d postgres

# Выполните SQL из файла миграции
\i migrations/add_delivery_schedule_tables.sql
```

## Что создается

### Таблицы
1. **delivery_days** - дни с кастомными интервалами времени
   - `id` (UUID) - первичный ключ
   - `date` (DATE) - дата в формате YYYY-MM-DD (уникально)
   - `created_at`, `updated_at` - временные метки

2. **delivery_time_slots** - интервалы времени для дней
   - `id` (UUID) - первичный ключ
   - `day_id` (UUID) - ссылка на delivery_days (CASCADE DELETE)
   - `start_time` (VARCHAR(5)) - время начала в формате HH:MM
   - `end_time` (VARCHAR(5)) - время окончания в формате HH:MM
   - `sort_order` (INTEGER) - порядок сортировки
   - `created_at`, `updated_at` - временные метки

### Индексы
- `idx_delivery_days_date` - для быстрого поиска по дате
- `idx_delivery_time_slots_day_id` - для связи с днями
- `idx_delivery_time_slots_sort_order` - для сортировки интервалов

## Функционал

### Админ-панель
- Страница `/admin/delivery-schedule` для управления расписанием
- Добавление дней с кастомными интервалами
- Редактирование и удаление дней и интервалов
- Валидация формата времени (HH:MM) и проверка start < end

### Чекаут
- При выборе даты автоматически загружаются опции времени из API
- Если для даты есть кастомные интервалы - они показываются после "Доставка ночью"
- Если кастомных интервалов нет - используются стандартные (10:00-21:00)
- Graceful fallback на стандартные опции при ошибках API

## API Endpoints

### Админские (требуют авторизации)
- `GET /api/admin/delivery-schedule` - получить все дни с интервалами
- `POST /api/admin/delivery-schedule` - создать день
- `PUT /api/admin/delivery-schedule/days/[id]` - обновить день
- `DELETE /api/admin/delivery-schedule/days/[id]` - удалить день
- `POST /api/admin/delivery-schedule/days/[id]/slots` - добавить интервал
- `PUT /api/admin/delivery-schedule/slots/[slotId]` - обновить интервал
- `DELETE /api/admin/delivery-schedule/slots/[slotId]` - удалить интервал

### Публичные
- `GET /api/delivery-time-options?date=YYYY-MM-DD` - получить опции времени для даты

## Проверка после миграции

1. Убедитесь, что таблицы созданы:
   ```sql
   SELECT * FROM delivery_days;
   SELECT * FROM delivery_time_slots;
   ```

2. Проверьте работу админ-панели:
   - Откройте `/admin/delivery-schedule`
   - Добавьте тестовый день
   - Добавьте интервалы времени

3. Проверьте работу чекаута:
   - Откройте корзину и перейдите к оформлению заказа
   - Выберите дату с кастомными интервалами
   - Убедитесь, что опции времени загружаются корректно

## Откат миграции (если нужно)

```sql
DROP TABLE IF EXISTS delivery_time_slots CASCADE;
DROP TABLE IF EXISTS delivery_days CASCADE;
```

**Внимание:** Откат удалит все данные о кастомных интервалах времени доставки.
