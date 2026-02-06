# Аудит: проверка, чистка, оптимизация и сверка с БД (2026-02-06)

## 1. Проверки сборки и линтеров

| Команда              | Результат |
|----------------------|-----------|
| `npm run typecheck`  | ✅ 0 ошибок |
| `npm run lint`       | ✅ 0 ошибок, 14 предупреждений (no-img-element) |

### Исправлено в рамках аудита

- **src/lib/addOnProducts.ts** — удалён неиспользуемый импорт `Product` (устранено предупреждение `@typescript-eslint/no-unused-vars`).

---

## 2. Сверка с базой данных (Supabase)

Скрипт **`npm run check-db`** проверяет все таблицы, используемые в приложении.

### Таблицы, используемые в коде

| Группа | Таблицы | Назначение |
|--------|---------|------------|
| **Ядро** | `products`, `product_variants`, `variant_products`, `orders`, `product_details` | Товары, варианты, заказы, «Подарок при заказе» |
| **Главная** | `home_reviews`, `hero_slides`, `home_collections` | О нас, FAQ, отзывы, слайдер, блок заказа, коллекции |
| **Справочники** | `categories`, `add_on_products_categories`, `delivery_zones`, `gift_hints`, `one_click_orders` | Каталог, доп. товары, зоны доставки, «Намекнуть о подарке», быстрый заказ |

### Результат проверки (на момент аудита)

- Все перечисленные таблицы существуют и доступны (RLS/права не блокируют count).
- Расхождений имён таблиц между кодом и БД не выявлено.
- Миграции в `scripts/migrations/` соответствуют используемым в коде полям (см. docs/DB-SCHEMA.md и предыдущие отчёты).

### Расширение check-db

- В **scripts/check-db.ts** добавлены проверки таблиц: `product_details`, `home_reviews`, `hero_slides`, `home_collections`, `categories`, `add_on_products_categories`, `delivery_zones`, `gift_hints`, `one_click_orders`.
- Вывод сгруппирован по блокам (Ядро / Главная / Справочники) для удобной сверки.

---

## 3. Чистота кода

### Оставшиеся предупреждения ESLint (14)

- **@next/next/no-img-element** — использование `<img>` вместо `next/image` в:
  - `app/admin/products/page.tsx` (6),
  - `components/ContactsModal.tsx` (2),
  - `components/FloatingSocialButton.tsx` (3),
  - `components/admin/collections/CollectionCard.tsx` (1),
  - `components/admin/products/ProductRowCard.tsx` (1),
  - `components/admin/slides/SlideCard.tsx` (1).

Замена на `next/image` — отдельная задача (внешние URL, модалки, превью в админке).

### Критичных расхождений с БД нет

- Обращений к несуществующим колонкам не обнаружено.
- Имена таблиц в API/lib совпадают с миграциями.

---

## 4. Рекомендации

1. **Периодически запускать** `npm run check-db` после деплоя миграций или смены окружения.
2. **no-img-element** — оставить как есть или править точечно с учётом внешних URL и layout модалок.
3. **Документация БД** — при добавлении новых таблиц/колонок обновлять `docs/DB-SCHEMA.md` и при необходимости список таблиц в `scripts/check-db.ts`.

---

## 5. Итог

| Действие | Результат |
|----------|-----------|
| Typecheck / Lint | Без ошибок |
| Чистка | Удалён неиспользуемый импорт в `addOnProducts.ts` |
| Сверка с БД | Скрипт check-db расширен; все таблицы приложения проверяются |
| Оптимизация | Глобальных изменений не вносилось |

Код и база согласованы; для актуального состояния таблиц достаточно выполнить `npm run check-db`.
