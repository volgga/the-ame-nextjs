# Аудит и техдолг-спринт (2026-02-02)

## A) НАЙДЕНО (список проблем)

### A) Dead code / мусор

| Пункт | Файл/место | Причина |
|-------|------------|---------|
| Дублирование константы `ALL_CATALOG` | `middleware.ts`, `lib/catalogCategories.ts` | Одна и та же строка в двух файлах — не критично |
| Неиспользуемые экспорты `CardHeader`, `CardTitle` | `components/ui/card.tsx` | Экспортируются, но используются только `Card`, `CardContent` — часть UI-библиотеки, оставить |

### B) Ошибки/риски

| Пункт | Файл/место | Причина |
|-------|------------|---------|
| `gift_hints`: mock при отсутствии таблицы | `api/gift-hints/route.ts:64-66` | Возвращает `ok: true` при `42P01` — в проде может скрыть отсутствие миграции |
| `reorder`: обновления без транзакции | `api/admin/products/reorder/route.ts` | Цикл `UPDATE` — при ошибке на 5-м из 10 остаются частично сохранённые позиции |
| `useEffect` dependency | `admin/products/page.tsx:433` | `closeCreateModal` отсутствует в deps — линт warning |

### C) Перформанс

| Пункт | Файл/место | Причина |
|-------|------------|---------|
| Отсутствуют индексы на `sort_order` | `products`, `variant_products` | ORDER BY по `sort_order` без индекса — медленнее на больших таблицах |
| Quick-view: 3 запроса для вариантного товара | `api/products/[id]/quick-view` | Последовательно: variant_product, product_variants, categories — приемлемо для одиночного товара |

### D) Качество типов

| Пункт | Файл/место | Причина |
|-------|------------|---------|
| Множество `as any` для Supabase | API routes, services | Схема не в сгенерированных типах — уже задокументировано в комментариях |

### E) БД: запросы / индексы

| Пункт | Детали |
|-------|--------|
| Индексы `products.sort_order`, `variant_products.sort_order` | Отсутствуют — добавлена миграция |
| Индексы `categories`, `hero_slides`, `orders`, `product_variants` | Уже есть в миграциях |
| N+1 | Нет: каталог — 2 запроса (products + variant_products), варианты загружаются батчем |

### F) Безопасность

| Пункт | Результат |
|-------|-----------|
| Захардкоженные ключи | Нет, только env |
| Защита админки | Middleware проверяет cookie, API admin — 401 при неавторизованном |
| Утечка `SUPABASE_SERVICE_ROLE_KEY` | Не попадает на клиент (нет `NEXT_PUBLIC_`) |

---

## B) ИСПРАВЛЕНО

| Что изменено | Файлы | Улучшение |
|--------------|-------|-----------|
| Миграция индексов для `sort_order` | `scripts/migrations/products-sort-order-indexes.sql` | Добавлены `idx_products_sort_order`, `idx_variant_products_sort_order` для ускорения ORDER BY при выборке каталога и админки |

---

## C) НЕ ТРОГАЛ, НО РЕКОМЕНДУЮ

| Тема | Почему |
|------|--------|
| Reorder в транзакции | Текущая реализация — цикл UPDATE. При сбое на середине порядок частично сохранён. Решение: RPC/plpgsql или batch-обновление с проверкой — делать отдельным таском |
| `gift_hints` mock в проде | Сейчас при отсутствии таблицы возвращается `ok: true`. В проде лучше возвращать 503 и логировать |
| `useEffect` deps в admin products | Добавить `closeCreateModal` в deps, обернуть `closeCreateModal` в `useCallback` |
| Генерация типов Supabase | `supabase gen types` — убрать `as any` в API |
| Next.js middleware deprecation | Предупреждение "middleware → proxy" — следовать миграции Next.js при обновлении |

---

## D) ПРОВЕРКИ

| Команда | Результат |
|---------|-----------|
| `npm run lint` | 0 errors, 14 warnings (img vs Image, useEffect deps) |
| `npm run typecheck` | OK |
| `npm run build` | OK (137 страниц) |

---

## Миграция индексов

Выполнить в Supabase SQL Editor:

```bash
# Файл: scripts/migrations/products-sort-order-indexes.sql
```

Индексы идемпотентны (`IF NOT EXISTS`). Обратимо: `DROP INDEX IF EXISTS idx_products_sort_order; DROP INDEX IF EXISTS idx_variant_products_sort_order;`
