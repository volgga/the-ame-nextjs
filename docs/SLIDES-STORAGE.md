# Хранилище изображений слайдов (Supabase Storage)

## Bucket `hero-slides`

Изображения слайдов хранятся в Supabase Storage, bucket **hero-slides**.

> Если bucket уже существует (например, использовали URL ранее), создание не требуется.

### Создание bucket (если ещё нет)

**Способ 1: через Dashboard**

1. Supabase Dashboard → Storage → New bucket
2. Имя: `hero-slides`
3. Public bucket: **включить** (для публичного чтения на главной)
4. File size limit: 15MB (опционально)
5. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif` (опционально)

**Способ 2: через SQL**

Выполните в Supabase SQL Editor:

```sql
-- Создать публичный bucket для слайдов (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-slides',
  'hero-slides',
  true,
  15728640,  -- 15MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Политика: публичное чтение (anon)
CREATE POLICY "hero_slides_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-slides');

-- Политика: запись только через service_role (сервер)
CREATE POLICY "hero_slides_service_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-slides');

CREATE POLICY "hero_slides_service_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-slides');

CREATE POLICY "hero_slides_service_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-slides');
```

## Переменные окружения

- **NEXT_PUBLIC_SUPABASE_URL** — URL проекта Supabase (публичный)
- **SUPABASE_SERVICE_ROLE_KEY** — только на сервере, для загрузки файлов

## Путь хранения

Файлы сохраняются как: `hero-slides/{uuid}-{timestamp}.{ext}`

Пример: `hero-slides/700eda80-d985-44cd-acce-38ab3acce935-1763412518890.avif`

Публичный URL: `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hero-slides/{path}`
