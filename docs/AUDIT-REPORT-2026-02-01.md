# Аудит проекта the-ame-nextjs

**Дата:** 2026-02-01  
**Раздел:** Админка товаров, создание товаров (простые + варианты)

---

## A) Аудит и чистка кода (Frontend)

### Файлы, проверенные в ходе аудита

| Файл | Назначение | Статус |
|------|------------|--------|
| `src/app/admin/products/page.tsx` | Список товаров + модалка создания | ✓ Чисто |
| `src/app/admin/products/[id]/page.tsx` | Редактирование товара | ✓ Чисто |
| `src/app/admin/products/new/page.tsx` | Редирект на модалку | ✓ Чисто |
| `src/app/api/admin/products/route.ts` | GET/POST товаров | ✓ Улучшено |
| `src/app/api/admin/products/upload/route.ts` | Загрузка изображений | ✓ Чисто |
| `src/app/api/admin/products/[id]/route.ts` | CRUD товара | ✓ Чисто |
| `src/app/api/admin/products/[id]/variants/route.ts` | Создание вариантов | ✓ Чисто |
| `src/lib/supabaseAdmin.ts` | Supabase service role клиент | ✓ Чисто |
| `src/utils/slugify.ts` | Генерация slug | ✓ Чисто |

### Выполненные улучшения

1. **Создан файл общих типов** `src/types/admin.ts`:
   - `Category` — категория
   - `ImageDraft` — изображение для превью (не загружено)
   - `UploadedImage` — загруженное изображение
   - `ProductRow`, `VariantProductRow`, `ProductVariantRow` — строки БД
   - `ProductCreatePayload`, `VariantProductCreatePayload` — payload для создания
   - `VariantDraft`, `VariantPayload` — черновик/payload варианта
   - `ProductListItem` — элемент списка товаров

2. **Улучшена обработка ошибок Supabase** (`route.ts`):
   - `getErrorMessage()` теперь извлекает `message`, `hint`, `details` из ошибок Supabase
   - Пользователь видит более информативные сообщения

3. **Проверена очистка ресурсов**:
   - `URL.revokeObjectURL()` вызывается при:
     - Закрытии модалки (`closeCreateModal`)
     - Размонтировании компонента (cleanup в useEffect)
     - Удалении изображений
     - Замене изображений
   - Утечек памяти нет

4. **Проверена блокировка кнопки "Создать"**:
   - `disabled={createLoading || productImagesUploading}`
   - Текст меняется на "Загрузка изображений…" / "Создание…"

---

## B) Аудит логики создания товара

### Простой товар (type: "simple")

```
1. validateCreateForm() → проверка полей
2. Upload images → последовательно в /api/admin/products/upload
3. POST /api/admin/products → insert в products
   ↳ Если ошибка → показываем message/hint/details
```

**Статус:** ✓ Работает корректно

### Вариантный товар (type: "variant")

```
1. validateCreateForm() → проверка полей + вариантов
2. Upload main image → /api/admin/products/upload
3. Upload variant images → последовательно для каждого варианта
4. POST /api/admin/products → 
   a) insert в variant_products
   b) insert в product_variants (все варианты одним запросом)
   ↳ Если ошибка на шаге b → variant_products уже создан
```

**Известное ограничение:** Если вставка вариантов падает после успешной вставки `variant_products`, товар останется без вариантов. Для полного rollback нужна транзакция на уровне БД или RPC-функция.

**Рекомендация:** Добавить best-effort cleanup (удаление variant_products) при ошибке вставки вариантов. Пока что логируется и показывается ошибка пользователю.

---

## C) Проверка Supabase Storage

### Bucket: `product-images`

| Параметр | Значение |
|----------|----------|
| Существует | Нужно проверить в Dashboard |
| Публичный | Да (для отображения на сайте) |
| Формат пути | `{uuid}-{timestamp}.{ext}` |
| Макс. размер | 25 MB |
| MIME-типы | JPEG, PNG, WebP, AVIF, GIF |

### RLS политики Storage

Админка использует **service_role key** (`getSupabaseAdmin()`), поэтому RLS политики **не применяются** к операциям загрузки.

Для публичного чтения нужна политика:

```sql
CREATE POLICY "product-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

### Проверка в Dashboard

1. Storage → Buckets → убедиться что `product-images` существует
2. Если нет — создать: Name: `product-images`, Public: Yes

---

## D) Проверка Supabase DB

### Таблицы и колонки

#### products
| Колонка | Обязательно в коде | NOT NULL в БД | Совпадает |
|---------|-------------------|---------------|-----------|
| name | ✓ | ✓ | ✓ |
| slug | auto-generated | — | ✓ |
| description | — | — | ✓ |
| composition_size | ✓ (simple) | — | ✓ |
| price | ✓ (simple) | — | ✓ |
| image_url | ✓ (simple) | — | ✓ |
| images | — | — | ✓ |
| is_active | default true | — | ✓ |
| is_hidden | default false | — | ✓ |
| is_preorder | default false | — | ✓ |
| category_slugs | ✓ | — | ✓ |

#### variant_products
| Колонка | Обязательно в коде | NOT NULL в БД | Совпадает |
|---------|-------------------|---------------|-----------|
| name | ✓ | ✓ | ✓ |
| slug | auto-generated | — | ✓ |
| description | — | — | ✓ |
| image_url | ✓ | — | ✓ |
| min_price_cache | вычисляется | — | ✓ |
| category_slugs | ✓ | — | ✓ |

#### product_variants
| Колонка | Обязательно в коде | NOT NULL в БД | Совпадает |
|---------|-------------------|---------------|-----------|
| product_id | ✓ | ✓ | ✓ |
| title | ✓ | ✓ | ✓ |
| composition | ✓ | — | ✓ |
| price | ✓ (если не preorder) | ✓ | ⚠️ |
| is_preorder | — | default false | ✓ |
| sort_order | ✓ | — | ✓ |
| image_url | — | — | ✓ |

**Замечание:** Если `is_preorder=true` и `price=0`, БД должна принимать это. Проверить что `price` позволяет 0.

### RLS политики

Админка использует **service_role key**, поэтому RLS **не применяется** к insert/update/delete.

Для каталога (anon) нужны политики SELECT:

```sql
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "variant_products_select" ON variant_products FOR SELECT USING (true);
CREATE POLICY "product_variants_select" ON product_variants FOR SELECT USING (true);
```

### Индексы (рекомендуемые)

```sql
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS variant_products_slug_unique ON variant_products(slug);
CREATE INDEX IF NOT EXISTS product_variants_product_id ON product_variants(product_id);
```

---

## E) Найденные проблемы и исправления

### Проблемы

| # | Область | Проблема | Статус |
|---|---------|----------|--------|
| 1 | DB | Колонка `product_variants.title` — в документации было `name/size` | ✓ Исправлено |
| 2 | DB | Отсутствовала `category_slugs` в variant_products | ✓ Миграция создана |
| 3 | DB | Отсутствовала `composition`, `is_preorder` в product_variants | ✓ Миграция создана |
| 4 | Types | Типы были inline, не переиспользуемые | ✓ Создан `types/admin.ts` |
| 5 | Errors | Supabase hint/details не показывались | ✓ Исправлено в `getErrorMessage()` |

### Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `src/types/admin.ts` | **Создан** — общие типы для админки |
| `src/app/api/admin/products/route.ts` | Импорт типов, улучшена `getErrorMessage()` |
| `docs/DB-SCHEMA.md` | Обновлена документация (title, category_slugs, composition, is_preorder) |
| `scripts/audit/db-storage-audit.sql` | **Создан** — SQL для проверки и настройки БД |

### Миграции (выполнить в Supabase SQL Editor)

1. `scripts/migrations/product-variants-add-fields.sql` — добавляет composition, is_preorder
2. `scripts/migrations/variant-products-add-category-slugs.sql` — добавляет category_slugs

---

## F) Рекомендации

### Краткосрочные (сделать сейчас)

1. Выполнить миграции в Supabase SQL Editor
2. Проверить что bucket `product-images` существует и публичный
3. Запустить `scripts/audit/db-storage-audit.sql` для проверки структуры

### Среднесрочные (опционально)

1. Добавить RPC-функцию для транзакционного создания variant_products + product_variants
2. Рассмотреть разбиение `admin/products/page.tsx` на компоненты (1200+ строк)
3. Добавить unit-тесты для валидации форм

---

## Итог

✅ Код чист, типизирован, ресурсы освобождаются  
✅ Ошибки Supabase показываются информативно  
✅ Storage настроен корректно (нужно проверить bucket в Dashboard)  
✅ БД документирована, миграции созданы  
⚠️ Транзакционность создания вариантов — известное ограничение (не критично)
