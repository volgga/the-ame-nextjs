# Инженерный аудит и чистка — отчёт (2026-02-05)

## 1. Сборка и диагностика

### Выполненные команды
- `npm install` — успешно
- `npm run build` — **успешно** (Next.js 16.1.6, Turbopack)
- `npm run lint` — **0 ошибок**, 15 предупреждений (после правок было 18)
- `npm run typecheck` — **успешно** (`tsc --noEmit`)

### Зафиксированные предупреждения/замечания

| Источник | Тип | Описание |
|----------|-----|----------|
| next build | deprecation | Файл `middleware` устарел, рекомендуется использовать `proxy` |
| eslint | react-hooks/exhaustive-deps | `admin/home/collections/page.tsx:147` — в `useEffect` отсутствует зависимость `form` |
| eslint | @next/next/no-img-element | 11 мест: использование `<img>` вместо `next/image` (admin/products, ContactsModal, FloatingSocialButton, CollectionCard, ProductRowCard, SlideCard) |

**Решения:**  
- Middleware: без изменений (требует отдельного решения по proxy).  
- exhaustive-deps: не меняли (намеренное исключение, добавление `form` может вызвать лишние перезапуски).  
- no-img-element: не меняли (часто внешние URL / модалки; замена на `Image` — отдельная задача без редизайна).

---

## 2. Что исправлено (атомарно)

### 2.1 Удалён неиспользуемый код и мусор
- **FaqForm.tsx** — удалён неиспользуемый импорт `useRef`.
- **ReviewsForm.tsx** — удалён неиспользуемый импорт `useRef`.
- **OrderBlockForm.tsx** — переменная `errData` не использовалась; вызов `await res.json().catch(...)` оставлен без присваивания (логика сохранена).
- **scripts/migrations/Untitled** — удалён (не миграция, а копия текста задачи; мусор в каталоге миграций).

### 2.2 Багфиксы
- Явных багов, ломающих build/lint/typecheck или воспроизводимых по описанию (рендер `\n`, aspect-square, hover, disabled), не выявлено. Изменения ограничены чисткой (п. 2.1).

### 2.3 Рефакторинг
- Крупный рефакторинг и смена UI не выполнялись.

---

## 3. Сверка с базой данных (Supabase/Postgres)

### Таблицы и колонки, используемые в коде

- **home_reviews**  
  Используются: `id`, `about_title`, `about_text`, `about_image_url`, `order_block_title`, `order_block_subtitle1`, `order_block_text`, `order_block_subtitle2`, `order_block_image_url`, `faq_items`, `rating_count`, `review2_text`, `review3_text`.  
  Миграции: `home-reviews.sql`, `home-reviews-extend.sql`, `home-order-block.sql` — колонки добавлены, соответствие есть.

- **hero_slides**  
  Используются: `id`, `image_url`, `sort_order`, `is_active`, `button_text`, `button_href`, `button_variant`, `button_align`.  
  Миграции: `hero-slides-button-fields.sql`, `hero-slides-final.sql` — соответствие есть.

- **home_collections**  
  Используются: `id`, `image_url`, `name`, `category_slug`, `sort_order`, `is_active`.  
  Миграции: `home-collections.sql`, `home-collections-category-slug.sql` — соответствие есть.

- **products**  
  Используются поля из запросов в `products.ts`, API admin/products и т.д. — соответствуют миграциям `products-add-*`, `products-sort-order-indexes.sql`.

- **variant_products**  
  Используются: `id`, `slug`, `name`, `description`, `image_url`, `min_price_cache`, `category_slug`, `category_slugs`, `is_active`, `is_hidden`, `published_at`, `sort_order`.  
  В коде также есть обращение к `created_at` (VariantProductsRow и маппинг в `createdAt`), но в `select` эта колонка **не запрашивается** — значение всегда `undefined`. Колонка в миграциях не проверялась; при необходимости — добавить в `select` или убрать использование в коде.

- **product_variants**  
  Используются поля из миграций `product-variants-add-*`, `product-variants-add-height-width-cm.sql` — соответствие есть.

- **categories**, **orders**, **one_click_orders**, **gift_hints**  
  Используемые в коде поля покрыты существующими миграциями.

### Добавленные миграции
- **Новых миграций не добавлялось.** Несоответствий «код обращается к несуществующей колонке» не найдено. Удаление колонок/таблиц не выполнялось.

---

## 4. Что осталось / риски

- **variant_products.created_at:** в типах и маппинге используется, но не выбирается в запросах — при желании либо добавить `created_at` в `select` (и при необходимости миграцию), либо убрать использование из кода.
- **Предупреждения ESLint:** 15 шт. (no-img-element, exhaustive-deps) — не блокируют сборку; исправление по желанию отдельными задачами.
- **Deprecation middleware:** переход на `proxy` (Next.js) — отдельная задача.

---

## 5. Как проверить вручную

1. **Главная**  
   Открыть `/`, убедиться: блоки «О нас», «Форма заявки», отзывы, FAQ, карта рендерятся; разделители и кнопки на месте; переносы строк в подзаголовках и тексте отображаются; фото в «О нас» и в форме без искажений (квадрат 1:1); кнопка «Отправить» неактивна при пустых полях/не отмеченном согласии.

2. **Админка**  
   Войти в `/admin`, раздел «Главная»: модалки «О нас», «Форма заявки», «FAQ», «Отзывы» открываются и сохраняют данные; в поле «Подзаголовок №1» (textarea) переносы строк вводятся и сохраняются; загрузка фото в блоке заявки и в слайдах работает.

3. **Сохранение и форма**  
   На главной заполнить форму заявки (имя, телефон, согласие), отправить — запрос уходит, отображается «Заявка отправлена»; в админке после сохранения изменений в «О нас» или «Форма заявки» обновить главную и убедиться, что контент обновился.
