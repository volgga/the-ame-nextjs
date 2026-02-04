# Миграция home_reviews

## Проблема
Если вы видите ошибку "Could not find the table 'public.home_reviews'", значит таблица не создана в базе данных.

## Решение

### Шаг 1: Откройте Supabase Dashboard
1. Зайдите в ваш проект Supabase: https://supabase.com/dashboard
2. Выберите ваш проект

### Шаг 2: Откройте SQL Editor
1. В левом меню найдите "SQL Editor"
2. Нажмите "New query"

### Шаг 3: Выполните миграцию
1. Скопируйте весь код из файла `scripts/migrations/home-reviews.sql`
2. Вставьте в SQL Editor
3. Нажмите "Run" (или Ctrl+Enter / Cmd+Enter)

### Шаг 4: Проверка
После выполнения миграции:
- Обновите страницу админки `/admin/home/reviews`
- Ошибка должна исчезнуть
- Форма должна работать и сохранять данные

## Что делает миграция
- Создает таблицу `home_reviews` с полями:
  - `id` (UUID)
  - `rating_count` (INT) - количество оценок
  - `rating_text` (TEXT, опционально) - кастомный текст
  - `review2_text` (TEXT) - текст отзыва #2
  - `review3_text` (TEXT) - текст отзыва #3
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- Создает начальную запись с дефолтными значениями
- Настраивает RLS (Row Level Security) политики:
  - Публичный доступ на чтение (SELECT)
  - Админский доступ на все операции (service_role)

## Альтернативный способ (через CLI)
Если используете Supabase CLI:
```bash
supabase db push
```
Или выполните SQL напрямую через psql, если есть доступ.
