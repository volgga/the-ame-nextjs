# Настройка Supabase Storage

## Bucket: hero-slides

### Назначение
Хранение изображений слайдов для главной страницы.

### Параметры

| Параметр | Значение |
|----------|----------|
| Имя bucket | `hero-slides` |
| Публичный доступ | Да (для отображения на сайте) |
| Формат пути | `{uuid}-{timestamp}.{ext}` |
| Допустимые форматы | JPEG, PNG, WebP, AVIF |
| Макс. размер | 15 MB |

### Пример пути
```
hero-slides/a1b2c3d4-1706745600000.jpg
```

### Публичный URL
```
https://{supabase-url}/storage/v1/object/public/hero-slides/{path}
```

---

## Где в коде используется

### Upload (создание/обновление слайда)
**Файл:** `src/app/api/admin/slides/upload/route.ts`

```typescript
const BUCKET = "hero-slides";
// ...
const storagePath = `${id}-${timestamp}.${ext}`;
await supabase.storage.from(BUCKET).upload(storagePath, buffer, { ... });
```

### Построение URL
```typescript
const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${data.path}`;
```

### Удаление при delete слайда
**Файл:** `src/app/api/admin/slides/[id]/route.ts`

При удалении слайда файл удаляется из Storage:
```typescript
// Извлечь путь из image_url
const path = slide.image_url.split('/hero-slides/')[1];
await supabase.storage.from('hero-slides').remove([path]);
```

---

## Создание bucket в Supabase

### Через Dashboard
1. Storage → New Bucket
2. Name: `hero-slides`
3. Public bucket: **Yes**
4. Create bucket

### Через SQL
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-slides', 'hero-slides', true)
ON CONFLICT (id) DO NOTHING;
```

---

## RLS политики Storage

```sql
-- Публичное чтение
CREATE POLICY "hero-slides public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-slides');

-- Запись только через service_role (админ API)
CREATE POLICY "hero-slides service write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-slides' AND auth.role() = 'service_role');

CREATE POLICY "hero-slides service update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-slides' AND auth.role() = 'service_role');

CREATE POLICY "hero-slides service delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-slides' AND auth.role() = 'service_role');
```

---

## Проверка целостности

### Проверить что все слайды имеют image_url
```sql
SELECT id, image_url
FROM hero_slides
WHERE image_url IS NULL OR image_url = '';
```

### Проверить существование файлов в Storage
В Supabase Dashboard → Storage → hero-slides → проверить что файлы существуют.

### Найти "сиротские" файлы
```sql
-- Получить список путей из БД
SELECT 
  SUBSTRING(image_url FROM '/hero-slides/(.+)$') as storage_path
FROM hero_slides
WHERE image_url IS NOT NULL;
```
Сравнить с файлами в Storage вручную или через API.

---

## Миграция с внешних URL

Если слайды используют внешние URL (не из Storage):
1. Скачать изображение
2. Загрузить через `/api/admin/slides/upload`
3. Обновить `image_url` в БД

Или через админку: редактировать слайд → загрузить новый файл.
